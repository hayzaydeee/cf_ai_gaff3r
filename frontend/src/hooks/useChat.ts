// Chat state management hook — loads persisted history + sends new messages

import { useState, useCallback, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { sendChat, getChatHistory, type ChatResponseData } from '../services/api';

export function useChat(gameweek: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAccuracy, setLastAccuracy] = useState<ChatResponseData['accuracy'] | null>(null);

  // Load persisted chat history when GW changes
  useEffect(() => {
    if (!gameweek) return;
    let cancelled = false;

    async function loadHistory() {
      setHistoryLoading(true);
      try {
        const data = await getChatHistory(gameweek!);
        if (!cancelled && data.messages.length > 0) {
          setMessages(data.messages);
        }
      } catch (err) {
        // Silently fail — empty chat is fine
        console.warn('Failed to load chat history:', err);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    // Reset messages when switching GW
    setMessages([]);
    loadHistory();
    return () => { cancelled = true; };
  }, [gameweek]);

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

  return { messages, loading, historyLoading, error, lastAccuracy, send, clearMessages };
}
