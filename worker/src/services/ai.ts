// Workers AI integration
// Model: @cf/meta/llama-3.3-70b-instruct-fp8-fast
// Builds prompt, calls AI, parses PREDICTION_JSON

import type { Env } from '../types/env';
import type { Confidence } from '../types/app';

const PRIMARY_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const FALLBACK_MODEL = '@cf/meta/llama-3.1-8b-instruct';
const EMBED_MODEL = '@cf/baai/bge-base-en-v1.5';
const GATEWAY_ID = 'gaff3r-gateway';

export interface PredictionData {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  confidence: Confidence;
  reasoning: string;
}

export interface AIResult {
  response: string;
  prediction: PredictionData | null;
}

/**
 * Run the analysis pipeline: call Workers AI with the assembled prompt.
 * Falls back to smaller model on primary model failure.
 */
export async function runAnalysis(
  env: Env,
  systemPrompt: string,
  userMessage: string
): Promise<AIResult> {
  let response: string;

  try {
    response = await callModel(env, PRIMARY_MODEL, systemPrompt, userMessage);
  } catch (err) {
    console.warn(`Primary model failed, falling back: ${err}`);
    try {
      response = await callModel(env, FALLBACK_MODEL, systemPrompt, userMessage);
    } catch (fallbackErr) {
      throw new Error(`Both AI models failed. Primary: ${err}. Fallback: ${fallbackErr}`);
    }
  }

  // Extract prediction from response
  const prediction = extractPrediction(response);

  // Clean the response — remove the PREDICTION_JSON block from the visible text
  const cleanResponse = response
    .replace(/<<<PREDICTION_JSON>>>[\s\S]*?<<<END_PREDICTION_JSON>>>/g, '')
    .trim();

  return { response: cleanResponse, prediction };
}

/**
 * Call a specific Workers AI model.
 */
async function callModel(
  env: Env,
  model: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const result = await env.AI.run(model as Parameters<typeof env.AI.run>[0], {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    max_tokens: 1024,
    temperature: 0.7,
  }, { gateway: { id: GATEWAY_ID } });

  // Workers AI returns { response: string } for text generation
  if (typeof result === 'object' && result !== null && 'response' in result) {
    return (result as { response: string }).response;
  }

  throw new Error('Unexpected AI response format');
}

/**
 * Extract prediction JSON from the AI response via regex.
 * No second LLM call needed — the model embeds it inline.
 */
export function extractPrediction(response: string): PredictionData | null {
  const match = response.match(/<<<PREDICTION_JSON>>>([\s\S]*?)<<<END_PREDICTION_JSON>>>/);
  if (!match) {
    return extractPredictionFromText(response);
  }

  try {
    const parsed = JSON.parse(match[1].trim());

    // Validate required fields
    if (
      typeof parsed.homeTeam !== 'string' ||
      typeof parsed.awayTeam !== 'string' ||
      typeof parsed.homeScore !== 'number' ||
      typeof parsed.awayScore !== 'number' ||
      !['low', 'medium', 'high'].includes(parsed.confidence)
    ) {
      console.warn('Invalid prediction structure:', parsed);
      return null;
    }

    return {
      homeTeam: parsed.homeTeam,
      awayTeam: parsed.awayTeam,
      homeScore: parsed.homeScore,
      awayScore: parsed.awayScore,
      confidence: parsed.confidence as Confidence,
      reasoning: parsed.reasoning ?? '',
    };
  } catch (err) {
    console.warn('Failed to parse prediction JSON:', err);
    return extractPredictionFromText(response);
  }
}

function normalizeTeamName(name: string): string {
  return name
    .replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPredictionFromText(response: string): PredictionData | null {
  const normalized = response
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/[\u2013\u2014]/g, '-');

  const scorelineMatch = normalized.match(/([A-Za-z][A-Za-z .'-]{1,40}?)\s+(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z][A-Za-z .'-]{1,40})/);
  if (!scorelineMatch) return null;

  const homeTeam = normalizeTeamName(scorelineMatch[1]);
  const awayTeam = normalizeTeamName(scorelineMatch[4]);
  const homeScore = Number.parseInt(scorelineMatch[2], 10);
  const awayScore = Number.parseInt(scorelineMatch[3], 10);

  const confMatch = normalized.match(/confidence\s*[:\-]\s*(low|medium|high)/i);
  const confidence = (confMatch?.[1]?.toLowerCase() ?? 'medium') as Confidence;

  if (!homeTeam || !awayTeam || Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
    return null;
  }

  return {
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    confidence,
    reasoning: 'Extracted from response text.',
  };
}

/**
 * Stream a Workers AI response, forwarding SSE chunks to the caller.
 * Accumulates the full text, extracts the prediction, runs onComplete,
 * then emits a final `done` SSE event.
 *
 * @param extraDoneData  Extra fields merged into the `done` event (accuracy, fixtureFound, etc.)
 * @param onComplete     Called after full text is assembled (store to DO/D1/Vectorize)
 */
export async function runAnalysisStreaming(
  env: Env,
  systemPrompt: string,
  userMessage: string,
  extraDoneData: Record<string, unknown>,
  onComplete: (response: string, prediction: PredictionData | null) => Promise<void>,
): Promise<ReadableStream<Uint8Array>> {
  // Workers AI with stream:true returns ReadableStream<Uint8Array>
  const aiStream = await env.AI.run(
    PRIMARY_MODEL as Parameters<typeof env.AI.run>[0],
    {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 1024,
      temperature: 0.7,
      stream: true,
    } as Parameters<typeof env.AI.run>[1],
    { gateway: { id: GATEWAY_ID } },
  ) as ReadableStream<Uint8Array>;

  const encoder = new TextEncoder();
  let accumulated = '';

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = aiStream.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';

      const emit = (data: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split('\n');
          sseBuffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const raw = trimmed.slice(5).trim();
            if (raw === '[DONE]') continue;

            try {
              const parsed = JSON.parse(raw);
              const text: string = parsed.response ?? '';
              if (text) {
                accumulated += text;
                emit({ type: 'chunk', text });
              }
            } catch {
              // malformed SSE chunk — skip
            }
          }
        }
      } catch (err) {
        console.error('AI stream read error:', err);
        emit({ type: 'error', error: 'Stream interrupted' });
        controller.close();
        return;
      } finally {
        reader.releaseLock();
      }

      // Full response assembled — extract prediction and clean text
      const prediction = extractPrediction(accumulated);
      const cleanResponse = accumulated
        .replace(/<<<PREDICTION_JSON>>>[\s\S]*?<<<END_PREDICTION_JSON>>>/g, '')
        .trim();

      try {
        await onComplete(cleanResponse, prediction);
      } catch (err) {
        console.warn('Streaming onComplete failed:', err);
      }

      emit({ type: 'done', response: cleanResponse, prediction, ...extraDoneData });
      controller.close();
    },
  });
}

/**
 * Generate a text embedding using the BGE-small model via AI Gateway.
 * Returns a 768-dimension float array, or null on failure.
 */
export async function embedText(env: Env, text: string): Promise<number[] | null> {
  try {
    const result = await env.AI.run(
      EMBED_MODEL as Parameters<typeof env.AI.run>[0],
      { text: [text] } as Parameters<typeof env.AI.run>[1],
      { gateway: { id: GATEWAY_ID } },
    );
    const data = (result as { data?: number[][] }).data;
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.warn('embedText failed:', err);
    return null;
  }
}

/**
 * Fallback LLM call for fuzzy team matching when alias map fails.
 */
export async function identifyTeams(
  env: Env,
  userMessage: string,
  teamList: string[]
): Promise<{ homeTeam: string | null; awayTeam: string | null; found: boolean }> {
  const prompt = `From the user's message, identify two football teams. JSON only:
{"homeTeam": "<from list or null>", "awayTeam": "<from list or null>", "found": true/false}

Message: "${userMessage}"
Available: ${teamList.join(', ')}`;

  try {
    const result = await callModel(env, FALLBACK_MODEL, 'You are a JSON-only assistant. Return only valid JSON, no other text.', prompt);

    // Try to extract JSON from the response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { homeTeam: null, awayTeam: null, found: false };

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      homeTeam: parsed.homeTeam ?? null,
      awayTeam: parsed.awayTeam ?? null,
      found: parsed.found ?? false,
    };
  } catch {
    return { homeTeam: null, awayTeam: null, found: false };
  }
}
