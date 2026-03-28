// Cloudflare Worker environment bindings

export interface Env {
  // Durable Objects
  USER_STATE: DurableObjectNamespace;

  // KV Namespaces
  FPL_CACHE: KVNamespace;

  // Workers AI (AI Gateway configured at runtime)
  AI: Ai;

  // D1 Database
  DB: D1Database;

  // Vectorize (RAG)
  VECTORIZE: VectorizeIndex;

  // Rate Limiters
  RATE_LIMITER_CHAT: RateLimit;
  RATE_LIMITER_FIXTURES: RateLimit;

  // Secrets — set via wrangler secret put or .dev.vars locally
  FOOTBALL_DATA_API_KEY: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SENDGRID_API_KEY: string;
}
