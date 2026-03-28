// Better Auth browser client
// Used throughout the frontend for sign-in, sign-out, and session access

import { createAuthClient } from 'better-auth/react';
import { magicLinkClient } from 'better-auth/client/plugins';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export const authClient = createAuthClient({
  baseURL: API_BASE,
  plugins: [magicLinkClient(), sentinelClient()],
});

export type AuthSession = typeof authClient.$Infer.Session;
export type AuthUser = typeof authClient.$Infer.Session.user;
function sentinelClient() {
  return {
    id: 'sentinel',
    init: async () => {},
  };
}

