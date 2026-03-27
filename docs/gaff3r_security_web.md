# Gaff3r: Web Security Fundamentals

> Standard security controls for Gaff3r as a web application. These are baseline requirements that apply regardless of the football analysis features. Nothing here is optional.

---

## Table of Contents

1. [HTTP Security Headers](#1-http-security-headers)
2. [Content Security Policy](#2-content-security-policy)
3. [CORS Configuration](#3-cors-configuration)
4. [CSRF Protection](#4-csrf-protection)
5. [Authentication & Session Management](#5-authentication--session-management)
6. [Error Handling & Information Disclosure](#6-error-handling--information-disclosure)
7. [Request Validation](#7-request-validation)
8. [Rate Limiting](#8-rate-limiting)
9. [Secrets Management](#9-secrets-management)
10. [Dependency Security](#10-dependency-security)
11. [Frontend Rendering Safety](#11-frontend-rendering-safety)
12. [Logging Hygiene](#12-logging-hygiene)
13. [Implementation: The Security Headers Module](#13-implementation-the-security-headers-module)
14. [Implementation: The Gate Chain](#14-implementation-the-gate-chain)
15. [Checklist](#15-checklist)

---

## 1. HTTP Security Headers

Every response from the Worker and Pages must include these headers. They're one-time configuration with significant defensive value.

### Required headers

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type confusion attacks. Browser respects the declared Content-Type rather than sniffing the response body. |
| `X-Frame-Options` | `DENY` | Prevents clickjacking. Gaff3r has no reason to be embedded in an iframe. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage. Same-origin requests send the full URL; cross-origin requests send only the origin. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables browser APIs Gaff3r doesn't use. Prevents any injected script from accessing hardware. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Forces HTTPS for 1 year. Cloudflare handles TLS at the edge, but this header prevents protocol downgrade attacks on the client side. |

### Pages configuration

Create a `_headers` file in the frontend's `public/` directory:

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Worker configuration

Apply headers to every Worker response via a helper:

```typescript
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
```

Every response returned from the Worker's `fetch` handler must pass through `withSecurityHeaders()`.

---

## 2. Content Security Policy

CSP is the most important single header for preventing XSS and code injection. It defines what the browser is allowed to load and execute.

### Gaff3r's CSP

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://cf-ai-gaffer.*.workers.dev; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
```

### Directive breakdown

| Directive | Value | Rationale |
|---|---|---|
| `default-src` | `'self'` | Only load resources from the same origin by default |
| `script-src` | `'self'` | Only execute scripts from the same origin. No inline scripts, no `eval()`, no CDN scripts unless explicitly added with SRI hashes. |
| `style-src` | `'self' 'unsafe-inline'` | Tailwind generates inline styles. `unsafe-inline` is required here. Acceptable trade-off since style injection is low-risk compared to script injection. |
| `img-src` | `'self' data: blob:` | Allow images from same origin, data URIs (for inline icons), and blob URIs (for generated data cards). |
| `connect-src` | `'self' https://cf-ai-gaffer.*.workers.dev` | Allow fetch/XHR to the same origin and the Worker API. No other external connections from the browser. |
| `font-src` | `'self' https://fonts.gstatic.com` | Google Fonts if used (Inter, JetBrains Mono). Remove if fonts are self-hosted. |
| `frame-ancestors` | `'none'` | Same as X-Frame-Options: DENY but CSP version. Prevents iframe embedding. |
| `base-uri` | `'self'` | Prevents `<base>` tag injection that could redirect relative URLs. |
| `form-action` | `'self'` | Prevents form submissions to external domains. |

### What's intentionally absent

No `unsafe-eval` (Gaff3r doesn't use `eval()`, `new Function()`, or template strings that require it). No `data:` in `script-src` (prevents script injection via data URIs). No wildcard `*` in any directive.

### If adding external chart libraries

If Recharts, Nivo, or D3 are loaded from a CDN rather than bundled, add the specific CDN origin to `script-src` with a Subresource Integrity hash:

```html
<script src="https://cdn.jsdelivr.net/npm/recharts@2/..."
        integrity="sha384-..." crossorigin="anonymous"></script>
```

And add `https://cdn.jsdelivr.net` to `script-src`. Prefer bundling over CDN to keep the CSP tight.

---

## 3. CORS Configuration

CORS restricts which browser origins can make requests to the Worker API. It does not protect against non-browser clients (curl, Postman, scripts), but it prevents drive-by attacks from malicious websites.

### Configuration

```typescript
const ALLOWED_ORIGINS = [
  "https://cf-ai-gaffer.pages.dev",
  // Add preview deployment URLs if needed
];

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some(o => origin === o || origin.endsWith(".cf-ai-gaffer.pages.dev"));

  if (!isAllowed) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}
```

### Key decisions

**No wildcard origins.** `Access-Control-Allow-Origin: *` allows any website to make requests to the API. Never use this.

**`Allow-Credentials: true`** is required if the userId moves to an HttpOnly cookie. Without it, the browser won't send cookies on cross-origin requests.

**Handle OPTIONS preflight.** The Worker must return a 204 with CORS headers for preflight requests:

```typescript
if (request.method === "OPTIONS") {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
```

**Preview deployment URLs.** Cloudflare Pages generates preview URLs like `abc123.cf-ai-gaffer.pages.dev`. The CORS check should allow these (wildcard subdomain match) during development but restrict to the production URL only in production config.

---

## 4. CSRF Protection

Cross-Site Request Forgery is a lower risk for JSON APIs than for traditional form-based apps, but not zero risk. A malicious page can fire `fetch()` with `credentials: 'include'`, which sends cookies. CORS blocks reading the response, but the side effect (storing a prediction, linking a PL account) still executes.

### Defence layers

**Layer 1: SameSite cookie attribute.** If the userId cookie is set with `SameSite=Lax`, browsers will not send it on cross-origin POST requests. This is the primary defence and handles the vast majority of CSRF scenarios.

**Layer 2: Content-Type validation.** Validate that all POST requests have `Content-Type: application/json` in the gate chain. Browsers cannot send `application/json` from a plain HTML form submission (`<form>` can only send `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`). This means any POST that arrives with `application/json` was initiated by JavaScript, which is subject to CORS preflight.

```typescript
async function contentTypeGate(ctx: GateContext): Promise<GateResult> {
  if (ctx.request.method === "POST") {
    const ct = ctx.request.headers.get("Content-Type") || "";
    if (!ct.includes("application/json")) {
      return { pass: false, reason: "Invalid content type", logType: "schema_validation_failed" };
    }
  }
  return { pass: true };
}
```

**Layer 3: Origin header check (already in CORS).** The CORS gate rejects requests from non-allowed origins. Combined with SameSite cookies and Content-Type validation, this creates a three-layer CSRF defence.

### What Gaff3r doesn't need

Token-based CSRF protection (double-submit cookies, synchroniser tokens) is unnecessary. These are designed for server-rendered form applications. Gaff3r's API is JSON-only, which means the Content-Type + SameSite + CORS combination provides equivalent protection with less complexity.

---

## 5. Authentication & Session Management

### V1: Lightweight, no signup

Gaff3r V1 has no user accounts. The identity model is a single UUID that separates one user's data from another's.

**Current design:** Client-generated UUID in localStorage. This is the simplest approach but has weaknesses: the ID is readable by any JS on the page (including browser extensions), appears in request bodies, and is trivially forgeable.

**Recommended upgrade:** Server-generated UUID in an HttpOnly cookie.

```
Set-Cookie: gafferId={uuid}; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=31536000
```

| Attribute | Purpose |
|---|---|
| `HttpOnly` | JavaScript cannot read the cookie. Protects against XSS exfiltration of the userId. |
| `Secure` | Cookie only sent over HTTPS. Prevents interception on insecure connections. |
| `SameSite=Lax` | Not sent on cross-origin POST requests. Primary CSRF defence. |
| `Path=/api` | Cookie only sent to API routes, not for static asset requests. Reduces unnecessary header size. |
| `Max-Age=31536000` | 1 year persistence. User's data survives browser restarts. |

**Flow:**
1. First request arrives with no cookie.
2. Worker generates UUID, creates the Durable Object, sets the cookie in the response.
3. All subsequent requests include the cookie automatically.
4. The userId never appears in request bodies, URL parameters, or client-side JS.

**What this doesn't do:** It does not authenticate the user. Anyone who obtains the cookie value (e.g., through a network MITM, which TLS prevents, or a same-origin XSS, which CSP prevents) can impersonate the user. For V1's threat model (low-sensitivity data, no accounts), this is acceptable.

**Migration path:** When Gaff3r adds real authentication (Cloudflare Access, magic link email, or OAuth), the cookie-based identity remains as the session mechanism. The userId in the DO gets linked to an authenticated identity, and the cookie is regenerated on login to prevent session fixation.

### Session fixation prevention

If auth is added later, regenerate the session cookie (gafferId) on every authentication event. This prevents an attacker from fixing a known session ID before the user logs in.

---

## 6. Error Handling & Information Disclosure

Unhandled errors must never leak internal details to the client. Stack traces, SQL errors, model names, file paths, and API error messages are all information disclosure vectors.

### Global error handler

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handleRequest(request, env);
    } catch (err) {
      // Log full error server-side (visible in Workers dashboard)
      console.error("Unhandled error:", err);

      // Return generic message to client
      return withSecurityHeaders(
        Response.json(
          { error: "Something went wrong. Please try again." },
          { status: 500 }
        )
      );
    }
  }
};
```

### Error response rules

| Internal Error | Client Sees |
|---|---|
| D1 SQL error (malformed query, missing column) | "Unable to retrieve data" |
| Workers AI timeout or rate limit | "Analysis temporarily unavailable" |
| FPL API returns 500 or malformed JSON | "Match data temporarily unavailable" |
| Zod validation failure on external API response | "Match data temporarily unavailable" |
| Zod validation failure on user request | "Invalid request: [field-level message]" (safe to expose) |
| Unhandled exception | "Something went wrong" |

The only errors where specificity is acceptable are user input validation errors (telling the user their message is too long or their request body is malformed). Everything else gets a generic message.

### No error details in production

Even in JSON error responses, never include:
- Stack traces
- SQL query text
- File paths or module names
- API keys or partial keys
- Environment variable names
- Model identifiers (e.g., `@cf/meta/llama-3.3-70b-instruct-fp8-fast`)
- Rate limit quota details (tells an attacker exactly how many requests they have left)

---

## 7. Request Validation

Every request that reaches a handler must have been validated. Validation happens in the gate chain, before any business logic executes.

### Body size limits

```typescript
const MAX_BODY_SIZES: Record<string, number> = {
  "/api/chat": 5_000,        // 5KB: message + userId
  "/api/link-pl": 1_000,     // 1KB: userId + linkCode
  "/api/resolve": 500,       // 500B: userId only
};

async function bodySizeGate(ctx: GateContext): Promise<GateResult> {
  const limit = MAX_BODY_SIZES[ctx.path] || 10_000;
  const contentLength = ctx.request.headers.get("content-length");

  if (contentLength && parseInt(contentLength) > limit) {
    return { pass: false, reason: "Request too large", logType: "schema_validation_failed" };
  }
  return { pass: true };
}
```

### Schema validation with Zod

Every endpoint has a Zod schema. The schema gate rejects requests that don't conform before any handler logic runs.

```typescript
import { z } from "zod";

const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
});

const linkPLSchema = z.object({
  linkCode: z.string().min(20).max(64).regex(/^[a-zA-Z0-9_-]+$/),
});
```

**String field constraints:**
- `message`: 1-2,000 characters. Nobody writes a legitimate football query longer than a few sentences.
- `linkCode`: 20-64 characters, alphanumeric + hyphens/underscores only. No special characters.
- All string fields trimmed before validation.

### HTTP method restriction

The Worker router should return `405 Method Not Allowed` for unsupported methods:

```typescript
function methodGate(allowed: string[]): Gate<GateContext> {
  return async (ctx) => {
    if (!allowed.includes(ctx.request.method)) {
      return { pass: false, reason: `Method ${ctx.request.method} not allowed`, logType: "schema_validation_failed" };
    }
    return { pass: true };
  };
}

// Usage
const chatGates = buildGateChain(
  methodGate(["POST"]),
  corsGate(env),
  bodySizeGate,
  contentTypeGate,
  rateLimitGate(env),
  schemaGate(chatRequestSchema),
);
```

The response should include an `Allow` header listing permitted methods.

---

## 8. Rate Limiting

Rate limiting protects against abuse of the Workers AI inference (which has cost implications) and external API calls (which have rate limits of their own).

### Configuration

| Endpoint | Window | Max Requests | Key |
|---|---|---|---|
| `POST /api/chat` | 60 seconds | 10 | userId |
| `GET /api/predictions` | 60 seconds | 30 | userId |
| `GET /api/accuracy` | 60 seconds | 30 | userId |
| `POST /api/resolve` | 60 seconds | 5 | userId |
| `GET /api/fixtures` | 60 seconds | 30 | userId |
| `POST /api/link-pl` | 60 seconds | 3 | userId |

### Implementation on Durable Objects

Store request counts in the user's DO. Each request increments a counter keyed by `{endpoint}:{minute_bucket}`. If the counter exceeds the limit, reject.

```typescript
async function checkRateLimit(
  state: DurableObjectState,
  endpoint: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const bucket = Math.floor(Date.now() / windowMs);
  const key = `rl:${endpoint}:${bucket}`;
  const count = (await state.storage.get<number>(key)) || 0;

  if (count >= limit) return false;

  await state.storage.put(key, count + 1, { expirationTtl: windowMs / 1000 + 10 });
  return true;
}
```

### Two-layer rate limiting

**Layer 1: Worker-level** (per-userId, per-endpoint). Catches scripted abuse from a single userId.

**Layer 2: AI Gateway** (per-account, on LLM calls). Catches aggregate abuse across all users. If total Workers AI calls exceed the account budget, AI Gateway blocks further inference. This is a cost control, not a per-user control.

### Violation logging

Every rate limit rejection produces a security log entry. The log captures the userId, endpoint, and timestamp. Repeated violations from the same userId within a short window may indicate automated abuse.

---

## 9. Secrets Management

### Cloudflare Workers secrets

All API keys and sensitive configuration stored via `wrangler secret put`. Never in `wrangler.toml`, source code, or client-side bundles.

| Secret | What It Is |
|---|---|
| `FOOTBALL_DATA_API_KEY` | football-data.org API key |
| `API_FOOTBALL_KEY` | RapidAPI key for API-Football (if used) |
| `PL_SHARED_SECRET` | Shared secret for Predictions League server-to-server auth (if applicable) |

### What doesn't need a secret

- FPL API: public endpoints, no key needed
- Club Elo: public CSV/API, no key needed
- Workers AI: accessed via binding, no key needed
- D1: accessed via binding, no key needed
- Vectorize: accessed via binding, no key needed

### Rules

- No `.env` files in the repository (add `.env` to `.gitignore`)
- No API keys in `wrangler.toml` (it's committed to version control)
- No secrets logged via `console.log` (a stray `console.log(env)` would dump all secrets to Workers logs)
- No secrets in error responses (a caught error from football-data.org should not forward their error message, which might echo the API key in the URL)

---

## 10. Dependency Security

### Lockfile discipline

`package-lock.json` committed to version control for both `worker/` and `frontend/`. This ensures reproducible installs and prevents silent version drift.

### Version pinning

Use exact versions or tilde ranges (patch-only updates) in `package.json`:

```json
{
  "dependencies": {
    "zod": "~3.23.0",
    "hono": "~4.4.0"
  }
}
```

Avoid caret `^` ranges which allow minor version updates. Minor versions can introduce breaking changes or new dependencies.

### Audit

Run `npm audit` as part of any CI pipeline. For local development, run periodically. Critical and high vulnerabilities in production dependencies should block deployment.

### Minimal dependency surface

Gaff3r's Worker should have very few dependencies. Prefer native APIs over npm packages:

| Need | Prefer | Avoid |
|---|---|---|
| HTTP requests | Native `fetch()` | `axios`, `node-fetch` |
| Cryptographic operations | Workers `crypto` API | `bcrypt`, `crypto-js` |
| JSON schema validation | `zod` (lightweight, TypeScript-native) | `ajv` (heavier) |
| HTTP routing | `hono` (Cloudflare-optimised) or vanilla routing | `express` (Node-specific) |

Every dependency is attack surface. The fewer packages in the dependency tree, the smaller the supply chain risk.

### Subresource Integrity

If the frontend loads any scripts or stylesheets from CDNs, include `integrity` attributes:

```html
<script src="https://cdn.jsdelivr.net/npm/recharts@2/..."
        integrity="sha384-{hash}" crossorigin="anonymous"></script>
```

Vite can generate SRI hashes at build time via `vite-plugin-sri`. If all resources are bundled (no CDN), SRI is unnecessary.

---

## 11. Frontend Rendering Safety

### React's default protections

React escapes all string content rendered via JSX by default. `<div>{userContent}</div>` is safe because React converts special characters to HTML entities. This prevents basic XSS.

### Dangerous patterns to avoid

**Never use `dangerouslySetInnerHTML`.** If the chat interface needs to render formatted LLM output (bold, italic, lists), use a markdown renderer with HTML stripping, not raw HTML injection.

**Markdown renderer configuration:**

```typescript
import ReactMarkdown from "react-markdown";

// Allow only structural markdown, strip all HTML
<ReactMarkdown
  allowedElements={["p", "strong", "em", "ul", "ol", "li", "h3", "h4", "br"]}
  unwrapDisallowed={true}
>
  {llmResponse}
</ReactMarkdown>
```

This allows the LLM to use bold, italic, headers, and lists, but strips any HTML tags (`<script>`, `<img onerror>`, `<a href="javascript:">`) from the output.

**Structured data rendering:** The PredictionCard component parses JSON from the LLM's JSON Mode response. Render all fields as text content through React components. Never interpolate JSON string fields into HTML attributes or use them in `style` objects without validation.

### URL handling

If the frontend ever renders clickable links (e.g., links to match pages), validate that URLs use `https:` protocol only. Never render `javascript:` or `data:` URLs from any external source.

---

## 12. Logging Hygiene

### What to log

- Security gate rejections (type, action taken, endpoint, timestamp)
- Rate limit violations (userId, endpoint, timestamp)
- External API failures (service name, HTTP status, timestamp)
- Worker errors (error class, message, timestamp)

### What to never log

- Full user chat messages (contain personal queries, potential PII)
- PL link codes
- API keys or partial API keys
- Cookie values or session identifiers
- Matched injection patterns (the pattern identifier is fine, the matched content is not)
- Raw SQL queries generated by text-to-SQL (could contain user input)

### Implementation

Use structured JSON logging. Each log entry has a `type` field (enum) and a `details` object. No freeform strings.

```typescript
function securityLog(db: D1Database, entry: {
  type: string;
  action_taken: "blocked" | "sanitised" | "allowed";
  details: Record<string, unknown>;
}): void {
  db.prepare(
    "INSERT INTO security_log (timestamp, type, action_taken, details) VALUES (?, ?, ?, ?)"
  ).bind(
    new Date().toISOString(),
    entry.type,
    entry.action_taken,
    JSON.stringify(entry.details)
  ).run();
}
```

---

## 13. Implementation: The Security Headers Module

A single module that applies all standard security headers to every response:

```typescript
// worker/src/utils/security-headers.ts

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "connect-src 'self' https://cf-ai-gaffer.*.workers.dev",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function safeError(status: number, message: string): Response {
  return withSecurityHeaders(
    Response.json({ error: message }, { status })
  );
}
```

---

## 14. Implementation: The Gate Chain

The composable middleware pattern from the security patterns reference, adapted for Cloudflare Workers:

```typescript
// worker/src/utils/gate-chain.ts

type GateResult =
  | { pass: true }
  | { pass: false; reason: string; logType: string };

type Gate = (ctx: GateContext) => Promise<GateResult>;

interface GateContext {
  request: Request;
  env: Env;
  path: string;
  userId?: string;
}

function buildGateChain(...gates: Gate[]) {
  return async (ctx: GateContext): Promise<GateResult> => {
    for (const gate of gates) {
      const result = await gate(ctx);
      if (!result.pass) return result;
    }
    return { pass: true };
  };
}
```

**Standard gates for every endpoint:**

```
1. methodGate          -- reject unexpected HTTP methods
2. corsGate            -- validate Origin header
3. bodySizeGate        -- reject oversized request bodies
4. contentTypeGate     -- require application/json on POST
5. rateLimitGate       -- per-userId rate limit check
6. schemaGate          -- Zod validation on request body
7. [handler executes]
8. outputSanitiseGate  -- scan response for injection patterns (chat only)
```

Gates 1-6 run before the handler. Gate 8 runs after. Every gate rejection is logged to the security_log table.

---

## 15. Checklist

Apply on initial scaffold. Revisit when adding new endpoints or features.

### Headers and transport
- [ ] All six security headers set on every Worker response
- [ ] `_headers` file in frontend public/ with matching headers
- [ ] CSP configured and tested (no inline scripts, no external scripts without SRI)
- [ ] CORS restricted to Pages production domain (+ preview URLs in dev)
- [ ] HTTPS enforced (Cloudflare default, HSTS header as belt-and-suspenders)

### Request handling
- [ ] Gate chain on every route (method, CORS, body size, content-type, rate limit, schema)
- [ ] Zod schemas defined for every POST endpoint
- [ ] Body size limits configured per endpoint
- [ ] 405 returned for unsupported methods with `Allow` header
- [ ] Content-Type: application/json required on all POST requests

### Authentication and sessions
- [ ] userId generated server-side as HttpOnly cookie
- [ ] Cookie attributes: Secure, SameSite=Lax, Path=/api, Max-Age=31536000
- [ ] userId never appears in request bodies, URL parameters, or client-side JS

### Error handling
- [ ] Global try/catch in Worker fetch handler
- [ ] Generic error messages returned to client (no stack traces, no SQL errors, no model names)
- [ ] Full errors logged server-side via console.error

### Rate limiting
- [ ] Per-userId limits on all endpoints (10/min chat, 30/min reads, 5/min resolve)
- [ ] AI Gateway rate limiting as second layer on LLM calls
- [ ] Rate limit violations logged with userId and endpoint

### Secrets
- [ ] All API keys via wrangler secret put
- [ ] No secrets in wrangler.toml, source code, or .env files committed to git
- [ ] .env in .gitignore

### Dependencies
- [ ] package-lock.json committed for both worker/ and frontend/
- [ ] Exact or tilde version pinning in package.json
- [ ] npm audit passing (no critical/high vulnerabilities)
- [ ] Minimal dependency surface (native APIs preferred)

### Frontend
- [ ] No dangerouslySetInnerHTML anywhere
- [ ] Markdown renderer configured to strip HTML (allowedElements whitelist)
- [ ] All dynamic content rendered as React text nodes, not raw HTML
- [ ] SRI hashes on any CDN-loaded scripts

### Logging
- [ ] Security log table in D1
- [ ] Structured JSON entries with type and action_taken
- [ ] No user messages, link codes, API keys, or cookie values in logs

---

*Document Version: 1.0*
*Author: Divine*
*Created: March 2026*
*Project: Gaff3r*
*Scope: Standard web security controls*
