// Better Auth instance factory
// Creates a new auth instance per request (required — env bindings are request-scoped in CF Workers)

import { betterAuth } from 'better-auth';
import { D1Dialect } from 'kysely-d1';
import type { Env } from './types/env';

/**
 * Returns a Better Auth instance bound to the current request's env.
 * Call once per request; do not cache across requests.
 */
export function getAuth(env: Env) {
  const hasGoogle = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    // Better Auth needs to know its own URL to build callback/redirect URIs.
    // Set BETTER_AUTH_URL in .dev.vars for local dev; in production it's set as a secret.
    baseURL: env.BETTER_AUTH_URL ?? 'http://localhost:8787',
    database: {
      dialect: new D1Dialect({ database: env.DB }),
      type: 'sqlite',
    },
    ...(hasGoogle && {
      socialProviders: {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      },
    }),
    trustedOrigins: [
      'https://gaff3r.xyz',
      'https://www.gaff3r.xyz',
      'https://cf-ai-gaff3r.pages.dev',
      'http://localhost:5173',
    ],
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 24 * 30,
      },
    },
  });
}

/**
 * Attempt to resolve a Better Auth session from the incoming request.
 * Returns the user ID string on success, null if no valid session.
 */
export async function getSessionUserId(
  request: Request,
  env: Env,
): Promise<string | null> {
  try {
    const auth = getAuth(env);
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

