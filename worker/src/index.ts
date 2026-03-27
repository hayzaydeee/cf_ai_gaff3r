// Worker entry point — router and request handling

import type { Env } from './types/env';
import { handleGetGameweek, handleGetFixtures, handleGetUpcoming } from './routes/fixtures';
import { handleChat } from './routes/chat';
import { handleGetPredictions } from './routes/predictions';
import { handleGetStats, handleResolve } from './routes/stats';

export { UserState } from './durable-objects/user-state';

// ── Constants ──

// Allowed Pages origins. Adjust when deploying.
// In dev, wrangler dev serves on localhost:8787 and the Vite proxy handles CORS.
const ALLOWED_ORIGINS = new Set([
  'https://gaff3r.com',
  'https://www.gaff3r.com',
  'https://cf-ai-gaff3r.pages.dev',
  'http://localhost:5173', // local dev only — wrangler strips this in prod
]);

// Standard security response headers applied to every response
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

// Chat message limits — prevent prompt stuffing and resource abuse
const MAX_MESSAGE_LENGTH = 500;   // chars
const MAX_GAMEWEEK = 38;
const MIN_GAMEWEEK = 1;

// userId format: must start with "usr_" and be at most 64 chars
const USER_ID_REGEX = /^usr_[a-zA-Z0-9_-]{1,59}$/;

// ── Router ──

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get('Origin') ?? '';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    try {
      let response: Response;

      // ── Public routes (no userId required) ──

      if (path === '/api/gameweek/current' && request.method === 'GET') {
        response = await handleGetGameweek(env);
        return secured(response, origin);
      }

      if (path.match(/^\/api\/fixtures\/\d+$/) && request.method === 'GET') {
        const gw = parseInt(path.split('/').pop()!);
        if (gw < MIN_GAMEWEEK || gw > MAX_GAMEWEEK) {
          return secured(errorResponse('Invalid gameweek', 400), origin);
        }
        response = await handleGetFixtures(gw, env);
        return secured(response, origin);
      }

      if (path === '/api/fixtures/upcoming' && request.method === 'GET') {
        response = await handleGetUpcoming(env);
        return secured(response, origin);
      }

      // ── Authenticated routes (userId required) ──

      const userId = request.headers.get('x-user-id');

      if (!userId) {
        return secured(errorResponse('Missing x-user-id header', 401), origin);
      }

      // Validate userId format — prevents using arbitrary strings as DO keys
      if (!USER_ID_REGEX.test(userId)) {
        return secured(errorResponse('Invalid user ID format', 400), origin);
      }

      // GET /api/chat/:gw — load stored chat history
      if (path.match(/^\/api\/chat\/\d+$/) && request.method === 'GET') {
        const gw = parseInt(path.split('/').pop()!);
        if (gw < MIN_GAMEWEEK || gw > MAX_GAMEWEEK) {
          return secured(errorResponse('Invalid gameweek', 400), origin);
        }
        const doId = env.USER_STATE.idFromName(userId);
        const doStub = env.USER_STATE.get(doId);
        const doRes = await doStub.fetch(new Request(`http://do/chat/${gw}`));
        const messages = await doRes.json();
        response = new Response(JSON.stringify({ messages }), {
          headers: { 'Content-Type': 'application/json' },
        });
        return secured(response, origin);
      }

      // POST /api/chat — send a message
      if (path === '/api/chat' && request.method === 'POST') {
        // Validate Content-Type
        const contentType = request.headers.get('Content-Type') ?? '';
        if (!contentType.includes('application/json')) {
          return secured(errorResponse('Content-Type must be application/json', 415), origin);
        }

        // Parse and validate body before handing to the route handler
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return secured(errorResponse('Invalid JSON body', 400), origin);
        }

        const { message, gameweek, fixtureId } = body as Record<string, unknown>;

        if (typeof message !== 'string' || !message.trim()) {
          return secured(errorResponse('message must be a non-empty string', 400), origin);
        }
        if (message.length > MAX_MESSAGE_LENGTH) {
          return secured(errorResponse(`message must be ${MAX_MESSAGE_LENGTH} characters or fewer`, 400), origin);
        }
        if (typeof gameweek !== 'number' || gameweek < MIN_GAMEWEEK || gameweek > MAX_GAMEWEEK) {
          return secured(errorResponse('gameweek must be an integer between 1 and 38', 400), origin);
        }
        if (fixtureId !== undefined && (typeof fixtureId !== 'number' || fixtureId <= 0)) {
          return secured(errorResponse('fixtureId must be a positive integer', 400), origin);
        }

        // Reconstruct a validated request to pass downstream
        const validatedRequest = new Request(request.url, {
          method: 'POST',
          headers: request.headers,
          body: JSON.stringify({ message: message.trim(), gameweek, fixtureId, userId }),
        });
        response = await handleChat(validatedRequest, userId, env);
        return secured(response, origin);
      }

      if (path === '/api/predictions' && request.method === 'GET') {
        response = await handleGetPredictions(userId, env);
        return secured(response, origin);
      }

      if (path === '/api/stats' && request.method === 'GET') {
        response = await handleGetStats(userId, env);
        return secured(response, origin);
      }

      if (path === '/api/resolve' && request.method === 'POST') {
        response = await handleResolve(userId, env);
        return secured(response, origin);
      }

      // 404
      return secured(errorResponse('Not Found', 404), origin);

    } catch (err) {
      console.error('Worker error:', err);
      // Never leak internal error messages in production
      return secured(errorResponse('Internal Server Error', 500), origin);
    }
  },
};

// ── Helpers ──

/**
 * Build CORS headers. Only allow known origins; reflect the origin header
 * when it matches, return a restrictive value otherwise.
 */
function corsHeaders(origin: string): Record<string, string> {
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://gaff3r.com';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-user-id',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

/**
 * Attach CORS + security headers to a response.
 */
function secured(response: Response, origin: string): Response {
  const newResponse = new Response(response.body, response);
  const headers = { ...corsHeaders(origin), ...SECURITY_HEADERS };
  for (const [key, value] of Object.entries(headers)) {
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
