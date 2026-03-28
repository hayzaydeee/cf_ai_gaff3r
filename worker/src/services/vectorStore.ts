// Vectorize operations — store and query match analysis embeddings for RAG context.
// Index: gaff3r-analyses (768 dims, cosine similarity)
// Created with: wrangler vectorize create gaff3r-analyses --dimensions=768 --metric=cosine

import type { Env } from '../types/env';
import { embedText } from './ai';

// Maximum number of similar analyses to retrieve
const TOP_K = 3;

// Snippet length stored as metadata (Vectorize metadata values have size limits)
const SNIPPET_LENGTH = 220;

export interface StoredAnalysis {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  date: string;
  predictedScore: string;   // e.g. "2-1"
  snippet: string;          // truncated response text
}

/**
 * Store a match analysis embedding in Vectorize.
 * Call this fire-and-forget after a successful PREDICT response.
 * Safe to fail silently — RAG is an enhancement, not required for core flow.
 */
export async function storeAnalysis(
  env: Env,
  id: string,
  responseText: string,
  meta: Omit<StoredAnalysis, 'snippet'>,
): Promise<void> {
  const queryText = buildQueryText(meta.homeTeam, meta.awayTeam, meta.competition);
  const vector = await embedText(env, queryText);
  if (!vector) return;

  const snippet = responseText.slice(0, SNIPPET_LENGTH).replace(/\n+/g, ' ');

  try {
    await env.VECTORIZE.insert([{
      id,
      values: vector,
      metadata: {
        homeTeam: meta.homeTeam,
        awayTeam: meta.awayTeam,
        competition: meta.competition,
        date: meta.date,
        predictedScore: meta.predictedScore,
        snippet,
      },
    }]);
  } catch (err) {
    console.warn('Vectorize insert failed:', err);
  }
}

/**
 * Query Vectorize for past analyses relevant to this fixture.
 * Returns a formatted prompt block, or null if no relevant results found.
 */
export async function queryRelevantAnalyses(
  env: Env,
  homeTeam: string,
  awayTeam: string,
  competition: string,
): Promise<string | null> {
  const queryText = buildQueryText(homeTeam, awayTeam, competition);
  const vector = await embedText(env, queryText);
  if (!vector) return null;

  try {
    const results = await env.VECTORIZE.query(vector, {
      topK: TOP_K,
      returnMetadata: 'all',
    });

    if (!results.matches || results.matches.length === 0) return null;

    // Filter to reasonably similar results (cosine similarity > 0.65)
    const relevant = results.matches.filter(m => (m.score ?? 0) > 0.65);
    if (relevant.length === 0) return null;

    const lines = relevant.map(m => {
      const meta = m.metadata as Record<string, string> | undefined;
      if (!meta) return null;
      const matchup = `${meta.homeTeam} vs ${meta.awayTeam}`;
      const context = meta.date ? `(${meta.date.slice(0, 10)})` : '';
      const score = meta.predictedScore ? `Predicted: ${meta.predictedScore}.` : '';
      const snippet = meta.snippet ? ` "${meta.snippet.slice(0, 180)}..."` : '';
      return `  • ${matchup} ${context}: ${score}${snippet}`;
    }).filter(Boolean);

    if (lines.length === 0) return null;

    return `═══ SIMILAR PAST ANALYSES ═══\n${lines.join('\n')}`;
  } catch (err) {
    console.warn('Vectorize query failed:', err);
    return null;
  }
}

// Build a normalised query string for embedding — consistent across store and query
function buildQueryText(homeTeam: string, awayTeam: string, competition: string): string {
  return `${homeTeam} vs ${awayTeam} ${competition} football match analysis prediction`;
}
