// Server-side security utilities
// Prompt injection detection — complements the system prompt's OUT_OF_SCOPE mode
// with a pre-LLM filter that rejects obvious manipulation attempts early.

// ── Prompt injection detection ──

// Patterns that strongly indicate an injection attempt.
// Tested against lower-cased, normalised input.
const INJECTION_PATTERNS: RegExp[] = [
  // Instruction override
  /ignore\s+(previous|prior|all|your)\s+(instructions?|rules?|guidelines?|context|prompt)/i,
  /forget\s+(your|all|previous|prior)\s+(rules?|instructions?|guidelines?|identity|context)/i,
  /disregard\s+(your|all|previous|prior|the)\s+(instructions?|rules?|guidelines?|context)/i,

  // Identity replacement
  /you\s+are\s+now\s+(a\s+)?(new|different|another|an?\s)/i,
  /your\s+(new\s+)?(instructions?|rules?|guidelines?|identity|role|persona)\s+(are|is)\b/i,
  /pretend\s+(you\s+are|to\s+be)\b/i,
  /act\s+as\s+(if\s+you\s+are\s+)?a\s+(different|new|another|unrestricted|uncensored)/i,
  /roleplay\s+as\b/i,

  // Jailbreak keywords
  /\b(jailbreak|jailbroken|DAN|developer\s+mode|god\s+mode|unrestricted\s+mode|no\s+restrictions?)\b/i,

  // System prompt exfiltration
  /repeat\s+(your\s+)?(system\s+prompt|instructions?|rules?|guidelines?)\b/i,
  /print\s+(your\s+)?(system\s+prompt|instructions?|initial\s+prompt)\b/i,
  /what\s+(are|were|is)\s+your\s+(system\s+prompt|instructions?|initial\s+prompt)\b/i,
  /reveal\s+(your\s+)?(system\s+prompt|instructions?|rules?)\b/i,

  // Token injection via delimiters
  /<<<|>>>|\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>|<\|system\|>/i,
];

/**
 * Returns true if the message contains a likely prompt injection attempt.
 * The worker should reject these with 400 before they reach the LLM.
 */
export function isPromptInjection(message: string): boolean {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(message)) return true;
  }
  return false;
}

// ── Input sanitisation ──

/**
 * Strip null bytes and non-printable control characters from a string.
 * Tabs, newlines, and carriage returns are kept (legitimate user input).
 */
export function sanitiseInput(input: string): string {
  // Remove null bytes (\x00) and non-printable ASCII except tab/LF/CR
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}
