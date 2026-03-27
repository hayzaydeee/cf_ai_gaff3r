import { describe, expect, it } from 'vitest';
import { extractPrediction } from './ai';

describe('extractPrediction', () => {
  it('extracts prediction details from free-text prediction line when JSON block is absent', () => {
    const response = [
      "**The Gaffer's Call**: I'm backing Man Utd.",
      "**Prediction:** Man Utd 2-0 Leeds: Confidence: High",
    ].join('\n');

    const prediction = extractPrediction(response);

    expect(prediction).not.toBeNull();
    expect(prediction?.homeTeam).toBe('Man Utd');
    expect(prediction?.awayTeam).toBe('Leeds');
    expect(prediction?.homeScore).toBe(2);
    expect(prediction?.awayScore).toBe(0);
    expect(prediction?.confidence).toBe('high');
  });
});
