// Workers AI integration
// Model: @cf/meta/llama-3.3-70b-instruct-fp8-fast
// Builds prompt, calls AI, parses PREDICTION_JSON

import type { Env } from '../types/env';
import type { Confidence } from '../types/app';
import type { TypedPredictionPayload, PredictionType } from '../types/api';
import { log } from '../utils/logger';

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

export type { TypedPredictionPayload };

export interface AIResult {
  response: string;
  prediction: PredictionData | null;
  typedPrediction: TypedPredictionPayload | null;
  /** All typed prediction blocks extracted from the response (compound queries emit multiple). */
  typedPredictions: TypedPredictionPayload[];
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

  const start = Date.now();
  try {
    response = await callModel(env, PRIMARY_MODEL, systemPrompt, userMessage);
    log('ai_call', { model: PRIMARY_MODEL, ms: Date.now() - start });
  } catch (err) {
    log('ai_fallback', { model: PRIMARY_MODEL, fallback: FALLBACK_MODEL, error: String(err), ms: Date.now() - start }, 'warn');
    const fallbackStart = Date.now();
    try {
      response = await callModel(env, FALLBACK_MODEL, systemPrompt, userMessage);
      log('ai_call', { model: FALLBACK_MODEL, ms: Date.now() - fallbackStart });
    } catch (fallbackErr) {
      log('ai_call', { model: FALLBACK_MODEL, error: String(fallbackErr), ms: Date.now() - fallbackStart }, 'error');
      throw new Error(`Both AI models failed. Primary: ${err}. Fallback: ${fallbackErr}`);
    }
  }

  // Extract prediction from response
  const typedPredictions = extractAllTypedPredictions(response);
  const typedPrediction = typedPredictions[0] ?? null;
  const prediction = typedPredictionToPredictionData(typedPrediction) ?? extractPrediction(response);

  // Clean the response — remove the PREDICTION_JSON block from the visible text
  const cleanResponse = response
    .replace(/<<<PREDICTION_JSON>>>[\ s\ S]*?<<<END_PREDICTION_JSON>>>/g, '')
    .trim();

  return { response: cleanResponse, prediction, typedPrediction, typedPredictions };
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
 * Extract ALL TypedPredictionPayload blocks from a response.
 * Compound queries emit multiple <<<PREDICTION_JSON>>> blocks — this returns every one.
 */
export function extractAllTypedPredictions(response: string): TypedPredictionPayload[] {
  const pattern = /<<<PREDICTION_JSON>>>([\s\S]*?)<<<END_PREDICTION_JSON>>>/g;
  const results: TypedPredictionPayload[] = [];
  let m: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((m = pattern.exec(response)) !== null) {
    const parsed = parseTypedPredictionBlock(m[1].trim());
    if (parsed) results.push(parsed);
  }
  return results;
}

/**
 * Extract a TypedPredictionPayload from any PREDICT sub-type JSON block.
 * Returns the FIRST block found (single-intent path; compound path uses extractAllTypedPredictions).
 */
export function extractTypedPrediction(response: string): TypedPredictionPayload | null {
  const all = extractAllTypedPredictions(response);
  return all[0] ?? null;
}

/** Internal: parse a single raw JSON string into a TypedPredictionPayload. */
function parseTypedPredictionBlock(raw: string): TypedPredictionPayload | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.type || !parsed.homeTeam || !parsed.awayTeam) return null;

    const base = { homeTeam: parsed.homeTeam as string, awayTeam: parsed.awayTeam as string };
    const type = parsed.type as PredictionType;

    if (type === 'result') {
      if (typeof parsed.homeScore !== 'number' || typeof parsed.awayScore !== 'number') return null;
      return { ...base, type, homeScore: parsed.homeScore, awayScore: parsed.awayScore, confidence: parsed.confidence ?? 'medium', reasoning: parsed.reasoning ?? '' };
    }
    if (type === 'scorer') {
      if (!Array.isArray(parsed.scorers)) return null;
      return { ...base, type, scorers: parsed.scorers };
    }
    if (type === 'lineup') {
      return { ...base, type, homeLineup: parsed.homeLineup, awayLineup: parsed.awayLineup };
    }
    if (type === 'btts') {
      return { ...base, type, btts: parsed.btts, confidence: parsed.confidence ?? 'medium', overUnder: parsed.overUnder };
    }
    return null;
  } catch (err) {
    log('stream_error', { phase: 'parse_typed_prediction', error: String(err) }, 'warn');
    return null;
  }
}

/** Convert a result-type TypedPredictionPayload to legacy PredictionData for backward compat. */
function typedPredictionToPredictionData(typed: TypedPredictionPayload | null): PredictionData | null {
  if (!typed || typed.type !== 'result' || typed.homeScore === undefined || typed.awayScore === undefined) return null;
  return {
    homeTeam: typed.homeTeam,
    awayTeam: typed.awayTeam,
    homeScore: typed.homeScore,
    awayScore: typed.awayScore,
    confidence: (typed.confidence ?? 'medium') as Confidence,
    reasoning: typed.reasoning ?? '',
  };
}

/**
 * Extract result-type prediction from the AI response (legacy / fallback).
 */
export function extractPrediction(response: string): PredictionData | null {
  const match = response.match(/<<<PREDICTION_JSON>>>([\s\S]*?)<<<END_PREDICTION_JSON>>>/);
  if (!match) {
    return extractPredictionFromText(response);
  }

  try {
    const parsed = JSON.parse(match[1].trim());

    // New typed format: only extract if it's a result type
    if (parsed.type && parsed.type !== 'result') return null;

    if (
      typeof parsed.homeTeam !== 'string' ||
      typeof parsed.awayTeam !== 'string' ||
      typeof parsed.homeScore !== 'number' ||
      typeof parsed.awayScore !== 'number'
    ) {
      return null;
    }

    return {
      homeTeam: parsed.homeTeam,
      awayTeam: parsed.awayTeam,
      homeScore: parsed.homeScore,
      awayScore: parsed.awayScore,
      confidence: (['low', 'medium', 'high'].includes(parsed.confidence) ? parsed.confidence : 'medium') as Confidence,
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
 * @param metaData       Emitted as the first SSE event before any AI chunks.
 *                       Tells the frontend what to expect (hasModel, intent) so the
 *                       skeleton can be shown or suppressed immediately.
 */
export async function runAnalysisStreaming(
  env: Env,
  systemPrompt: string,
  userMessage: string,
  extraDoneData: Record<string, unknown>,
  onComplete: (response: string, prediction: PredictionData | null, typedPrediction: TypedPredictionPayload | null, typedPredictions: TypedPredictionPayload[]) => Promise<void>,
  metaData?: { hasModel: boolean; intent: string },
  ctx?: ExecutionContext,
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

      // Emit meta event first — frontend uses this to show/suppress skeleton
      // before any AI content arrives.
      if (metaData) {
        emit({ type: 'meta', ...metaData });
      }

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

      // Full response assembled — extract prediction(s) and clean text
      const typedPredictions = extractAllTypedPredictions(accumulated);
      const typedPrediction = typedPredictions[0] ?? null;
      const prediction = typedPredictionToPredictionData(typedPrediction) ?? extractPrediction(accumulated);
      const cleanResponse = accumulated
        .replace(/<<<PREDICTION_JSON>>>[\s\S]*?<<<END_PREDICTION_JSON>>>/g, '')
        .trim();

      // Approach B safety net: strip simResult/adjustmentNotes from done event
      // when the extracted prediction type is not 'result'.
      // This catches cases where the classifier returned null but the LLM produced
      // a non-result sub-type — prevents the Dixon-Coles block from rendering.
      const isResultType = !typedPrediction || typedPrediction.type === 'result';
      const { simResult: simData, adjustmentNotes: adjNotes, ...restExtraDone } = extraDoneData;
      emit({
        type: 'done',
        response: cleanResponse,
        prediction,
        typedPrediction,
        typedPredictions: typedPredictions.length > 1 ? typedPredictions : undefined,
        ...(isResultType ? { simResult: simData, adjustmentNotes: adjNotes } : {}),
        ...restExtraDone,
      });
      controller.close();

      // Post-processing (DO writes) must be registered with ctx.waitUntil so CF Workers
      // guarantees completion even after the stream response is fully sent to the client.
      const postProcess = onComplete(cleanResponse, prediction, typedPrediction, typedPredictions).catch(err => {
        console.warn('Streaming onComplete failed:', err);
      });
      if (ctx) {
        ctx.waitUntil(postProcess);
      } else {
        await postProcess;
      }
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
