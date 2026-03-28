// Better Auth instance factory
// Creates a new auth instance per request (required — env bindings are request-scoped in CF Workers)

import { betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins';
import { D1Dialect } from 'kysely-d1';
import sgMail from '@sendgrid/mail';
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
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLinkEmail(email, url, env.SENDGRID_API_KEY);
        },
      }),
    ],
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
 * Send a magic link email via SendGrid.
 * setApiKey is called per-request — env bindings are request-scoped in CF Workers.
 */
async function sendMagicLinkEmail(
  to: string,
  magicLinkUrl: string,
  sendgridApiKey: string,
): Promise<void> {
  sgMail.setApiKey(sendgridApiKey);
  await sgMail.send({
    to,
    from: 'Gaff3r <hello@gaff3r.xyz>',
    subject: 'Sign in to Gaff3r',
    html: magicLinkEmailHtml(magicLinkUrl),
  }).then(() => {
    console.log('Email sent')
  })
  .catch((error) => {
    console.error(error)
  });
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

