// Better Auth instance factory
// Creates a new auth instance per request (required — env bindings are request-scoped in CF Workers)

import { betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins';
import { D1Dialect } from 'kysely-d1';
import type { Env } from './types/env';

/**
 * Returns a Better Auth instance bound to the current request's env.
 * Call once per request; do not cache across requests.
 */
export function getAuth(env: Env) {
  return betterAuth({
    database: {
      dialect: new D1Dialect({ database: env.DB }),
      type: 'sqlite',
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLinkEmail(email, url, env.RESEND_API_KEY);
        },
      }),
      dash()
    ],
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    trustedOrigins: [
      'https://gaff3r.xyz',
      'https://www.gaff3r.xyz',
      'https://cf-ai-gaff3r.pages.dev',
      'http://localhost:5173',
    ],
    // Session cookie is HttpOnly + SameSite=Lax + Secure (set automatically by Better Auth)
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      },
    },
  });
}

/**
 * Send a magic link email via Resend.
 * Uses the REST API directly — no SDK needed.
 */
async function sendMagicLinkEmail(
  to: string,
  magicLinkUrl: string,
  resendApiKey: string,
): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Gaff3r <noreply@gaff3r.xyz>',
      to: [to],
      subject: 'Sign in to Gaff3r',
      html: magicLinkEmailHtml(magicLinkUrl),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

function magicLinkEmailHtml(url: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: sans-serif; max-width: 480px; margin: 40px auto; color: #1a1a1a;">
      <h2 style="color: #e85d04; margin-bottom: 8px;">Sign in to Gaff3r</h2>
      <p style="color: #555; margin-bottom: 24px;">Click the button below to sign in. This link expires in 15 minutes.</p>
      <a href="${url}"
         style="display: inline-block; background: #e85d04; color: #fff; padding: 12px 24px;
                border-radius: 6px; text-decoration: none; font-weight: 600;">
        Sign in to Gaff3r
      </a>
      <p style="margin-top: 24px; color: #999; font-size: 13px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </body>
    </html>
  `;
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
function dash() {
  return {
    id: 'dash',
  };
}

