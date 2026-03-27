import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '../types';
import { filterMessagesForFixture } from './useChat';

describe('filterMessagesForFixture', () => {
  const baseMessages: ChatMessage[] = [
    {
      id: 'm1',
      role: 'user',
      content: 'Fixture 100 user',
      timestamp: '2026-03-27T10:00:00Z',
      metadata: { fixtureId: 100 },
    },
    {
      id: 'm2',
      role: 'assistant',
      content: 'Fixture 100 reply',
      timestamp: '2026-03-27T10:00:05Z',
      metadata: { fixtureId: 100 },
    },
    {
      id: 'm3',
      role: 'user',
      content: 'Fixture 200 user',
      timestamp: '2026-03-27T10:01:00Z',
      metadata: { fixtureId: 200 },
    },
    {
      id: 'm4',
      role: 'assistant',
      content: 'Legacy missing fixture metadata',
      timestamp: '2026-03-27T10:01:05Z',
    },
  ];

  it('returns only selected fixture messages when fixture is provided', () => {
    const result = filterMessagesForFixture(baseMessages, 200);

    expect(result.map((m) => m.id)).toEqual(['m3']);
  });

  it('returns all messages when no fixture is selected', () => {
    const result = filterMessagesForFixture(baseMessages);

    expect(result.map((m) => m.id)).toEqual(['m1', 'm2', 'm3', 'm4']);
  });
});
