// Chat state management hook — loads persisted history + sends new messages
// When fixtureId is provided, filters messages to only those for that fixture.

import { useState, useCallback, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { sendChat, getChatHistory, type ChatResponseData } from '../services/api';

export function filterMessagesForFixture(messages: ChatMessage[], fixtureId?: number): ChatMessage[] {
  if (!fixtureId) return messages;
  return messages.filter((m) => m.metadata?.fixtureId === fixtureId);
}

export function useChat(gameweek: number | null, fixtureId?: number) {
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAccuracy, setLastAccuracy] = useState<ChatResponseData['accuracy'] | null>(null);

  // Keep fixture chats isolated when a fixture is selected.
  const messages = filterMessagesForFixture(allMessages, fixtureId);

  // Load persisted chat history when GW or fixture changes
  useEffect(() => {
    if (!gameweek) return;
    let cancelled = false;

    async function loadHistory() {
      setHistoryLoading(true);
      try {
        const data = await getChatHistory(gameweek!);
        if (!cancelled && data.messages.length > 0) {
          setAllMessages(data.messages);
        }
      } catch (err) {
        console.warn('Failed to load chat history:', err);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    setAllMessages([]);
    loadHistory();
    return () => { cancelled = true; };
  }, [gameweek]);

  const send = useCallback(async (message: string, sendFixtureId?: number) => {
    if (!gameweek || !message.trim()) return;

    const activeFixtureId = sendFixtureId ?? fixtureId;

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: `local_${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
      metadata: activeFixtureId ? { fixtureId: activeFixtureId } : undefined,
    };
    setAllMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const data = await sendChat(message.trim(), gameweek, activeFixtureId);

      const assistantMsg: ChatMessage = {
        id: `local_${Date.now()}_resp`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        metadata: activeFixtureId ? { fixtureId: activeFixtureId } : undefined,
        prediction: data.prediction,
      };
      setAllMessages(prev => [...prev, assistantMsg]);
      setLastAccuracy(data.accuracy);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
      // Remove the optimistic message on error
      setAllMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setLoading(false);
    }
  }, [gameweek, fixtureId]);

  const clearMessages = useCallback(() => {
    setAllMessages([]);
    setError(null);
  }, []);

  // Returns the fixture IDs that have at least one message in this GW
  const chattedFixtureIds = new Set(
    allMessages
      .map(m => m.metadata?.fixtureId)
      .filter((id): id is number => id !== undefined)
  );

  return { messages, allMessages, loading, historyLoading, error, lastAccuracy, send, clearMessages, chattedFixtureIds };
}
