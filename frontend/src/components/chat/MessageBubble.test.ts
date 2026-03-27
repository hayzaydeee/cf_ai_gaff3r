import { describe, expect, it } from 'vitest';
import { parseAssistantSections } from './MessageBubble';

describe('parseAssistantSections', () => {
  it('parses bold heading lines with inline body after colon', () => {
    const content = [
      "**The Gaffer's Call**: I'm backing Man Utd.",
      '',
      "**Form Check**: Last 5: W-W-D-L-W.",
      '',
      '**Prediction:** Man Utd 2-0 Leeds. Confidence: High',
    ].join('\n');

    const sections = parseAssistantSections(content);

    expect(sections).not.toBeNull();
    expect(sections?.map((s) => s.header)).toEqual([
      "The Gaffer's Call",
      'Form Check',
      'Prediction',
    ]);
    expect(sections?.[2].body).toContain('Man Utd 2-0 Leeds');
  });
});
