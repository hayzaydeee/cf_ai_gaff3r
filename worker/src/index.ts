// Worker entry point — router and request handling

import type { Env } from './types/env';
import { handleGetGameweek, handleGetFixtures, handleGetUpcoming } from './routes/fixtures';
import { handleChat } from './routes/chat';
import { handleGetPredictions } from './routes/predictions';
import { handleGetStats, handleResolve } from './routes/stats';

export { UserState } from './durable-objects/user-state';

// CORS headers for Pages domain
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*', // Restrict to Pages domain in production
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-user-id',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      let response: Response;

      // ── Public routes (no userId required) ──
      if (path === '/api/gameweek/current' && request.method === 'GET') {
        response = await handleGetGameweek(env);
        return addCors(response);
      }

      if (path.match(/^\/api\/fixtures\/\d+$/) && request.method === 'GET') {
        const gw = parseInt(path.split('/').pop()!);
        response = await handleGetFixtures(gw, env);
        return addCors(response);
      }

      if (path === '/api/fixtures/upcoming' && request.method === 'GET') {
        response = await handleGetUpcoming(env);
        return addCors(response);
      }

      // ── Authenticated routes (userId required) ──
      const userId = request.headers.get('x-user-id');
      if (!userId) {
        return addCors(errorResponse('Missing x-user-id header', 401));
      }

      if (path.match(/^\/api\/chat\/\d+$/) && request.method === 'GET') {
        const gw = parseInt(path.split('/').pop()!);
        const doId = env.USER_STATE.idFromName(userId);
        const doStub = env.USER_STATE.get(doId);
        const doRes = await doStub.fetch(new Request(`http://do/chat/${gw}`));
        const messages = await doRes.json();
        response = new Response(JSON.stringify({ messages }), {
          headers: { 'Content-Type': 'application/json' },
        });
        return addCors(response);
      }

      if (path === '/api/chat' && request.method === 'POST') {
        response = await handleChat(request, userId, env);
        return addCors(response);
      }

      if (path === '/api/predictions' && request.method === 'GET') {
        response = await handleGetPredictions(userId, env);
        return addCors(response);
      }

      if (path === '/api/stats' && request.method === 'GET') {
        response = await handleGetStats(userId, env);
        return addCors(response);
      }

      if (path === '/api/resolve' && request.method === 'POST') {
        response = await handleResolve(userId, env);
        return addCors(response);
      }

      // 404
      return addCors(errorResponse('Not Found', 404));
    } catch (err) {
      console.error('Worker error:', err);
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      return addCors(errorResponse(message, 500));
    }
  },
};

function addCors(response: Response): Response {
  const newResponse = new Response(response.body, response);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    newResponse.headers.set(key, value);
  }
  return newResponse;
}

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
