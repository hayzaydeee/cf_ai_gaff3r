// Frontend API client
// Handles userId generation, auth headers, and typed fetch wrappers

import type { Fixture, Prediction, PredictionSummary } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

// ── User ID ──

function getUserId(): string {
  let id = localStorage.getItem('gaff3r-user-id');
  if (!id) {
    id = `usr_${crypto.randomUUID()}`;
    localStorage.setItem('gaff3r-user-id', id);
  }
  return id;
}

// ── Base fetcher ──

async function fetchAPI<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': getUserId(),
    ...(options.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(url, { ...options, headers });

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
 * GET /api/fixtures/upcoming
 */
export function getUpcomingFixtures(): Promise<{ fixtures: FixtureData[] }> {
  return fetchAPI('/api/fixtures/upcoming');
}

/**
 * POST /api/chat
 */
export function sendChat(message: string, gameweek: number, fixtureId?: number): Promise<ChatResponseData> {
  return fetchAPI<ChatResponseData>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, gameweek, fixtureId, userId: getUserId() }),
  });
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
