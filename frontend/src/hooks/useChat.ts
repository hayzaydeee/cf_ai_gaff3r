// Chat state management hook

import { useState, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { sendChat, type ChatResponseData } from '../services/api';

export function useChat(gameweek: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAccuracy, setLastAccuracy] = useState<ChatResponseData['accuracy'] | null>(null);

  const send = useCallback(async (message: string, fixtureId?: number) => {
    if (!gameweek || !message.trim()) return;

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: `local_${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const data = await sendChat(message.trim(), gameweek, fixtureId);

      // Add assistant message
      const assistantMsg: ChatMessage = {
        id: `local_${Date.now()}_resp`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        prediction: data.prediction,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setLastAccuracy(data.accuracy);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setLoading(false);
    }
  }, [gameweek]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, lastAccuracy, send, clearMessages };
}
