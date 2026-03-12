// Cloudflare Worker environment bindings

export interface Env {
  // Durable Objects
  USER_STATE: DurableObjectNamespace;

  // KV Namespaces
  FPL_CACHE: KVNamespace;

  // Workers AI
  AI: Ai;

  // Secrets
  FOOTBALL_DATA_API_KEY: string;
}
