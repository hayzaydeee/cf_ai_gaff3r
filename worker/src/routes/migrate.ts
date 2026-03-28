// POST /api/migrate-anonymous
// Copies an anonymous user's Durable Object data (chat history, predictions)
// into the authenticated user's account after sign-up.

import type { Env } from '../types/env';

export async function handleMigrateAnonymous(
  request: Request,
  authenticatedUserId: string,
  env: Env,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { anonymousUserId } = body as Record<string, unknown>;

  if (typeof anonymousUserId !== 'string' || !/^usr_[a-zA-Z0-9_-]{1,59}$/.test(anonymousUserId)) {
    return errorResponse('Invalid anonymousUserId format', 400);
  }

  // Prevent migrating into the same ID
  if (anonymousUserId === authenticatedUserId) {
    return errorResponse('Cannot migrate into the same user ID', 400);
  }

  try {
    // ── Migrate Durable Object data ──
    // Fetch chat history from the anonymous user's DO
    const anonDoId = env.USER_STATE.idFromName(anonymousUserId);
    const anonStub = env.USER_STATE.get(anonDoId);

    // Get the anonymous user's profile to find which gameweeks have data
    const profileRes = await anonStub.fetch(new Request('http://do/profile'));
    if (!profileRes.ok) {
      // Anonymous user has no DO — nothing to migrate
      return new Response(JSON.stringify({ migrated: false, reason: 'no_anonymous_data' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Init the authenticated user's DO if it doesn't exist yet
    const authDoId = env.USER_STATE.idFromName(authenticatedUserId);
    const authStub = env.USER_STATE.get(authDoId);
    await authStub.fetch(new Request('http://do/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: authenticatedUserId }),
    }));

    // Copy gameweek chat history (GW 1–38)
    let gwsCopied = 0;
    for (let gw = 1; gw <= 38; gw++) {
      const chatRes = await anonStub.fetch(new Request(`http://do/chat/${gw}`));
      if (chatRes.ok) {
        const messages = await chatRes.json() as unknown[];
        if (Array.isArray(messages) && messages.length > 0) {
          await authStub.fetch(new Request(`http://do/chat/${gw}/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messages),
          }));
          gwsCopied++;
        }
      }
    }

    // ── Migrate D1 predictions ──
    // Re-attribute anonymous predictions to the authenticated user
    const updateResult = await env.DB.prepare(
      `UPDATE predictions
       SET user_id = ?1
       WHERE anon_user_id = ?2 AND user_id IS NULL`,
    )
      .bind(authenticatedUserId, anonymousUserId)
      .run();

    return new Response(
      JSON.stringify({
        migrated: true,
        gameweeksCopied: gwsCopied,
        predictionsMigrated: updateResult.meta.changes ?? 0,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Migration error:', err);
    return errorResponse('Migration failed', 500);
  }
}

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
