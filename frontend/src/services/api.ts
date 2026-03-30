// Frontend API client
// Typed fetch wrappers — auth via session cookie (credentials: 'include')

import type { Fixture, Prediction, PredictionSummary, ChatMessage, SimResult, TypedPrediction } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

// ── Base fetcher ──

async function fetchAPI<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // send session cookie when authenticated
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((error as { error?: string }).error || `API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Typed API calls ──

export interface GameweekData {
  current: number;
  next: number;
  nextDeadline: string;
}

export interface FixtureData extends Fixture {
  competition: string;
  competitionCode: string;
}

export interface ChatResponseData {
  response: string;
  prediction: PredictionSummary | null;
  accuracy: {
    totalPredictions: number;
    outcomeAccuracy: number;
    currentStreak: number;
  };
  fixtureFound: boolean;
  dataSource: 'fpl' | 'football-data' | null;
  identifiedFixture: {
    id: number;
    homeTeam: string;
    awayTeam: string;
    kickoffTime: string;
    competition: string;
    competitionCode: string;
  } | null;
}

export interface PredictionsData {
  predictions: Record<string, Prediction[]>;
  total: number;
}

export interface StatsData {
  totalPredictions: number;
  resolved: number;
  outcomeAccuracy: number;
  scoreAccuracy: number;
  currentStreak: number;
  bestStreak: number;
  byGameweek: { gw: number; total: number; correct: number }[];
}

export interface MatchContextTeamData {
  name: string;
  leaguePosition: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string[];
  formSummary: string;
  recentResults: {
    opponent: string;
    goalsFor: number;
    goalsAgainst: number;
    result: string;
    home: boolean;
  }[];
  keyPlayers?: {
    name: string;
    position: string;
    form: number;
    goals: number;
    assists: number;
    xG: number;
    xA: number;
    minutes: number;
    status: 'available' | 'injured' | 'doubtful' | 'suspended';
  }[];
  injuries?: {
    player: string;
    status: string;
    news: string;
    chanceOfPlaying: number | null;
  }[];
}

export interface MatchContextData {
  fixture: {
    id: number;
    homeTeam: string;
    awayTeam: string;
    competition: string;
    competitionCode: string;
    matchDate: string;
    matchday?: number;
  };
  dataSource: 'fpl' | 'football-data';
  fplDifficulty?: { home: number; away: number };
  homeTeam: MatchContextTeamData;
  awayTeam: MatchContextTeamData;
}

/**
 * GET /api/gameweek/current
 */
export function getGameweek(): Promise<GameweekData> {
  return fetchAPI<GameweekData>('/api/gameweek/current');
}

/**
 * GET /api/fixtures/:gw
 */
export function getFixtures(gw: number): Promise<{ gameweek: number; fixtures: FixtureData[] }> {
  return fetchAPI('/api/fixtures/' + gw);
}

/**
 * GET /api/match-context?fixtureId=...&gameweek=...&competitionCode=...
 */
export function getMatchContext(fixtureId: number, gameweek: number, competitionCode = 'PL'): Promise<MatchContextData> {
  const query = new URLSearchParams({
    fixtureId: String(fixtureId),
    gameweek: String(gameweek),
    competitionCode,
  });
  return fetchAPI<MatchContextData>(`/api/match-context?${query.toString()}`);
}

/**
 * GET /api/fixtures/upcoming
 */
export function getUpcomingFixtures(): Promise<{ fixtures: FixtureData[] }> {
  return fetchAPI('/api/fixtures/upcoming');
}

/**
 * POST /api/chat (non-streaming, kept for fallback/testing)
 */
export function sendChat(message: string, gameweek: number, fixtureId?: number): Promise<ChatResponseData> {
  return fetchAPI<ChatResponseData>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, gameweek, fixtureId }),
  });
}

export type ChatStreamChunk =
  | { type: 'meta'; hasModel: boolean; intent: string }
  | { type: 'chunk'; text: string }
  | { type: 'done'; response: string; prediction: ChatResponseData['prediction']; accuracy: ChatResponseData['accuracy']; fixtureFound: boolean; identifiedFixture: ChatResponseData['identifiedFixture']; simResult?: SimResult; adjustmentNotes?: string[]; typedPrediction?: TypedPrediction; typedPredictions?: TypedPrediction[] }
  | { type: 'error'; error: string };

/**
 * POST /api/chat with stream:true — yields SSE chunks as they arrive.
 * Usage: for await (const chunk of sendChatStream(...)) { ... }
 */
export async function* sendChatStream(
  message: string,
  gameweek: number,
  fixtureId?: number,
): AsyncGenerator<ChatStreamChunk> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, gameweek, fixtureId, stream: true }),
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || `API error: ${res.status}`);
  }

  if (!res.body) throw new Error('No response body for stream');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const raw = trimmed.slice(5).trim();
        try {
          const parsed = JSON.parse(raw) as ChatStreamChunk;
          yield parsed;
          if (parsed.type === 'done' || parsed.type === 'error') return;
        } catch {
          // malformed SSE line, skip
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * GET /api/predictions
 */
export function getPredictions(): Promise<PredictionsData> {
  return fetchAPI<PredictionsData>('/api/predictions');
}

/**
 * GET /api/stats
 */
export function getStats(): Promise<StatsData> {
  return fetchAPI<StatsData>('/api/stats');
}

/**
 * POST /api/resolve
 */
export function resolvePredictions(): Promise<{ resolved: number; errors: number }> {
  return fetchAPI('/api/resolve', { method: 'POST' });
}

/**
 * GET /api/chat/:gw — load stored chat history
 */
export function getChatHistory(gw: number): Promise<{ messages: ChatMessage[] }> {
  return fetchAPI(`/api/chat/${gw}`);
}
