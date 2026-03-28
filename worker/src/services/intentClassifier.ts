// Lightweight intent classifier for chat messages.
// Runs BEFORE the LLM call to determine whether to:
//   - Run the Dixon-Coles / Monte Carlo model (only for result-type queries)
//   - Inject an intent hint into the user prompt (for specific sub-types)
//
// Returns null for result/general queries — full pipeline runs.
// Returns a specific sub-type string for everything else — model skipped.

export type MessageIntent = 'scorer' | 'lineup' | 'btts' | 'analyse' | null;

// null = run full result prediction pipeline (default for general / "who you got" queries)

const SCORER_PATTERNS = [
  /\bwho.{0,25}(will\s+)?score\b/i,
  /\bgoalscorer\b/i,
  /\bscorer\s+pick\b/i,
  /\bfirst\s+goal\b/i,
  /\banytime\s+scorer\b/i,
  /\bwho\s+scores\b/i,
  /\btop\s+scorer\b/i,
  /\bscorer\b.{0,20}\b(pick|call|pick|prediction|bet)\b/i,
  /\bpredict.{0,15}scorer/i,
  /\bstandard\s+pick.{0,20}wildcard/i, // "standard picks and wildcards" scorer phrasing
];

const LINEUP_PATTERNS = [
  /\blineup\b/i,
  /\bline.?up\b/i,
  /\bpredicted\s+(xi|eleven|lineup|11)\b/i,
  /\bexpected\s+(xi|eleven|lineup|11)\b/i,
  /\bwho\s+starts\b/i,
  /\bstarting\s+(eleven|xi|11|lineup)\b/i,
  /\bteam\s+selection\b/i,
  /\bwho\s+plays\b/i,
  /\bformation\b/i,
  /\bwhat\s+xi\b/i,
];

const BTTS_PATTERNS = [
  /\bboth\s+teams.{0,20}score\b/i,
  /\bbtts\b/i,
  /\bover.{0,8}under\b/i,
  /\bover\s+\d+\.?\d*\s+goals\b/i,
  /\bunder\s+\d+\.?\d*\s+goals\b/i,
  /\bover\s+\d+\.?\d*\b/i,
  /\bclean\s+sheet\b/i,
  /\bgoals\s+market\b/i,
  /\btotal\s+goals\b/i,
  /\bwill\s+there\s+be\s+goals\b/i,
];

const ANALYSE_PATTERNS = [
  /\bhow\s+(is|are|has|have)\b/i,
  /\bhow.{0,15}(playing|performing|looking|been)\b/i,
  /\binjur(y|ies|ed)\b/i,
  /\btell\s+me\s+about\b/i,
  /\bkey\s+players\b/i,
  /\bhead.{0,8}head\b/i,
  /\bh2h\b/i,
  /\bform.{0,20}(been|like|look|past)\b/i,
  /\bwhat\s+about\b/i,
  /\bstats\b/i,
  /\btactic(s|al)\b/i,
  /\bdoubt(ful|s)\b/i,
  /\bsuspend(ed|sion)\b/i,
];

/**
 * Classify the user's intent from their message.
 * Returns null for general/result queries (run full pipeline).
 * Returns a specific sub-type for targeted prediction or analysis queries.
 */
export function classifyIntent(message: string): MessageIntent {
  if (SCORER_PATTERNS.some(p => p.test(message))) return 'scorer';
  if (LINEUP_PATTERNS.some(p => p.test(message))) return 'lineup';
  if (BTTS_PATTERNS.some(p => p.test(message))) return 'btts';
  if (ANALYSE_PATTERNS.some(p => p.test(message))) return 'analyse';
  return null;
}

/**
 * Returns true if the Monte Carlo model should run for this intent.
 * Only result-type queries (null intent) benefit from simulation data.
 */
export function shouldRunModel(intent: MessageIntent): boolean {
  return intent === null; // null = result/unknown — run full pipeline
}

/**
 * Build the intent hint line to inject into the user prompt.
 * Null intent = no hint (the LLM defaults to PREDICT:result).
 */
export function buildIntentHint(intent: MessageIntent): string {
  if (!intent) return '';
  const map: Record<NonNullable<MessageIntent>, string> = {
    scorer:  'DETECTED INTENT: scorer — respond using PREDICT:scorer sub-type with scorer JSON block.',
    lineup:  'DETECTED INTENT: lineup — respond using PREDICT:lineup sub-type with lineup JSON block.',
    btts:    'DETECTED INTENT: btts — respond using PREDICT:btts sub-type with btts JSON block.',
    analyse: 'DETECTED INTENT: analyse — respond using ANALYSE mode. No PREDICTION_JSON block.',
  };
  return map[intent];
}
