// UserState Durable Object
// Storage keys: profile, accuracy, gw:{N}:chat, gw:{N}:predictions
// One instance per user, persists all state across sessions

import type { UserProfile, ChatMessage, Prediction, AccuracyStats, Score, Outcome } from '../types/app';

export class UserState {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // GET routes
      if (request.method === 'GET') {
        if (path === '/profile') return json(await this.getProfile());
        if (path === '/accuracy') return json(await this.getAccuracy());
        if (path.startsWith('/chat/')) {
          const gw = parseInt(path.split('/')[2]);
          return json(await this.getChatHistory(gw));
        }
        if (path === '/predictions') {
          const gw = url.searchParams.get('gw');
          return json(await this.getAllPredictions(gw ? parseInt(gw) : undefined));
        }
      }

      // POST routes
      if (request.method === 'POST') {
        const body = await request.json() as Record<string, unknown>;

        if (path === '/init') {
          await this.initProfile(body.userId as string);
          return json({ ok: true });
        }
        if (path.startsWith('/chat/')) {
          const parts = path.split('/');
          const gw = parseInt(parts[2]);
          const msg = body as unknown as ChatMessage;
          await this.addChatMessage(gw, msg);
          return json({ ok: true });
        }
        if (path === '/prediction') {
          const pred = body as unknown as Prediction;
          await this.addPrediction(pred);
          return json({ ok: true });
        }
        if (path === '/resolve') {
          const { predictionId, actualScore } = body as {
            predictionId: string;
            actualScore: Score;
          };
          await this.resolvePrediction(predictionId, actualScore);
          return json({ ok: true });
        }
      }

      return new Response('Not Found', { status: 404 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal DO error';
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // ── Profile ──

  private async getProfile(): Promise<UserProfile> {
    const profile = await this.state.storage.get<UserProfile>('profile');
    return profile ?? {
      userId: '',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      theme: 'light',
    };
  }

  private async initProfile(userId: string): Promise<void> {
    const existing = await this.state.storage.get<UserProfile>('profile');
    if (existing) {
      existing.lastActiveAt = new Date().toISOString();
      await this.state.storage.put('profile', existing);
    } else {
      await this.state.storage.put('profile', {
        userId,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        theme: 'light',
      });
    }
  }

  // ── Accuracy ──

  async getAccuracy(): Promise<AccuracyStats> {
    const stats = await this.state.storage.get<AccuracyStats>('accuracy');
    return stats ?? {
      totalPredictions: 0,
      resolved: 0,
      pending: 0,
      correctOutcomes: 0,
      outcomeAccuracy: 0,
      exactScores: 0,
      scoreAccuracy: 0,
      avgGoalDifference: 0,
      currentStreak: 0,
      bestStreak: 0,
      byGameweek: [],
      byCompetition: {},
    };
  }

  // ── Chat History ──

  private async getChatHistory(gw: number): Promise<ChatMessage[]> {
    const messages = await this.state.storage.get<ChatMessage[]>(`gw:${gw}:chat`);
    return messages ?? [];
  }

  async addChatMessage(gw: number, message: ChatMessage): Promise<void> {
    const messages = await this.getChatHistory(gw);
    messages.push(message);

    // Keep last 20 messages per GW (rolling window)
    const trimmed = messages.slice(-20);
    await this.state.storage.put(`gw:${gw}:chat`, trimmed);
  }

  // ── Predictions ──

  private async getGameweekPredictions(gw: number): Promise<Prediction[]> {
    const preds = await this.state.storage.get<Prediction[]>(`gw:${gw}:predictions`);
    return preds ?? [];
  }

  async addPrediction(prediction: Prediction): Promise<void> {
    const gw = prediction.gameweek;
    const preds = await this.getGameweekPredictions(gw);

    // Check for duplicate fixture predictions in same GW
    const existing = preds.findIndex(p => p.fixtureId === prediction.fixtureId);
    if (existing >= 0) {
      preds[existing] = prediction; // Overwrite
    } else {
      preds.push(prediction);
    }

    await this.state.storage.put(`gw:${gw}:predictions`, preds);

    // Update accuracy stats
    await this.recalculateAccuracy();
  }

  private async resolvePrediction(predictionId: string, actualScore: Score): Promise<void> {
    // Find the prediction across all GWs
    const allKeys = await this.state.storage.list<Prediction[]>();
    for (const [key, preds] of allKeys) {
      if (!key.endsWith(':predictions') || !Array.isArray(preds)) continue;

      const idx = preds.findIndex(p => p.id === predictionId);
      if (idx >= 0) {
        const pred = preds[idx];
        const actualOutcome = determineOutcome(actualScore);

        pred.status = 'resolved';
        pred.actualScore = actualScore;
        pred.actualOutcome = actualOutcome;
        pred.outcomeCorrect = pred.predictedOutcome === actualOutcome;
        pred.exactScoreCorrect =
          pred.predictedScore.home === actualScore.home &&
          pred.predictedScore.away === actualScore.away;
        pred.resolvedAt = new Date().toISOString();

        preds[idx] = pred;
        await this.state.storage.put(key, preds);
        await this.recalculateAccuracy();
        return;
      }
    }
  }

  private async getAllPredictions(filterGw?: number): Promise<Record<string, Prediction[]>> {
    const result: Record<string, Prediction[]> = {};
    const allKeys = await this.state.storage.list<Prediction[]>();

    for (const [key, value] of allKeys) {
      if (!key.endsWith(':predictions') || !Array.isArray(value)) continue;

      // Extract GW number from key (format: gw:N:predictions)
      const gwMatch = key.match(/^gw:(\d+):predictions$/);
      if (!gwMatch) continue;

      const gw = parseInt(gwMatch[1]);
      if (filterGw !== undefined && gw !== filterGw) continue;

      if (value.length > 0) {
        result[`gw${gw}`] = value;
      }
    }

    return result;
  }

  // ── Accuracy Recalculation ──

  private async recalculateAccuracy(): Promise<void> {
    const allPreds = await this.getAllPredictions();
    const stats: AccuracyStats = {
      totalPredictions: 0,
      resolved: 0,
      pending: 0,
      correctOutcomes: 0,
      outcomeAccuracy: 0,
      exactScores: 0,
      scoreAccuracy: 0,
      avgGoalDifference: 0,
      currentStreak: 0,
      bestStreak: 0,
      byGameweek: [],
      byCompetition: {},
    };

    // Flatten all predictions, sorted by creation time
    const flatPreds: Prediction[] = [];
    for (const preds of Object.values(allPreds)) {
      flatPreds.push(...preds);
    }
    flatPreds.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    stats.totalPredictions = flatPreds.length;
    stats.resolved = flatPreds.filter(p => p.status === 'resolved').length;
    stats.pending = flatPreds.filter(p => p.status === 'pending').length;

    // Outcome accuracy
    const resolvedPreds = flatPreds.filter(p => p.status === 'resolved');
    stats.correctOutcomes = resolvedPreds.filter(p => p.outcomeCorrect).length;
    stats.outcomeAccuracy = stats.resolved > 0
      ? Math.round((stats.correctOutcomes / stats.resolved) * 100)
      : 0;

    // Exact score accuracy
    stats.exactScores = resolvedPreds.filter(p => p.exactScoreCorrect).length;
    stats.scoreAccuracy = stats.resolved > 0
      ? Math.round((stats.exactScores / stats.resolved) * 100)
      : 0;

    // Streaks
    let current = 0;
    let best = 0;
    for (const pred of resolvedPreds) {
      if (pred.outcomeCorrect) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    }
    stats.currentStreak = current;
    stats.bestStreak = best;

    // By gameweek
    const gwMap = new Map<number, { total: number; correct: number }>();
    for (const pred of resolvedPreds) {
      const entry = gwMap.get(pred.gameweek) ?? { total: 0, correct: 0 };
      entry.total++;
      if (pred.outcomeCorrect) entry.correct++;
      gwMap.set(pred.gameweek, entry);
    }
    stats.byGameweek = Array.from(gwMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([gw, data]) => ({ gw, ...data }));

    // By competition
    for (const pred of resolvedPreds) {
      const code = pred.competitionCode || 'UNKNOWN';
      if (!stats.byCompetition[code]) {
        stats.byCompetition[code] = {
          competitionName: pred.competition,
          total: 0,
          correctOutcomes: 0,
          outcomeAccuracy: 0,
        };
      }
      stats.byCompetition[code].total++;
      if (pred.outcomeCorrect) stats.byCompetition[code].correctOutcomes++;
    }
    for (const comp of Object.values(stats.byCompetition)) {
      comp.outcomeAccuracy = comp.total > 0
        ? Math.round((comp.correctOutcomes / comp.total) * 100)
        : 0;
    }

    await this.state.storage.put('accuracy', stats);
  }
}

// ── Helpers ──

function determineOutcome(score: Score): Outcome {
  if (score.home > score.away) return 'home';
  if (score.away > score.home) return 'away';
  return 'draw';
}

function json(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}
