import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSessionUserId } from '../../auth';

// Mock better-auth so we don't need real CF bindings
vi.mock('better-auth', () => ({
  betterAuth: vi.fn(() => ({
    api: {
      getSession: vi.fn(),
    },
  })),
}));

vi.mock('better-auth/plugins', () => ({
  magicLink: vi.fn(() => ({})),
}));

vi.mock('kysely-d1', () => ({
  D1Dialect: vi.fn(),
}));

vi.mock('@sendgrid/mail', () => ({
  default: { setApiKey: vi.fn(), send: vi.fn() },
}));

// ── Helpers ──

function makeEnv(overrides: Record<string, unknown> = {}): any {
  return {
    DB: {},
    BETTER_AUTH_URL: 'http://localhost:8787',
    BETTER_AUTH_SECRET: 'test-secret',
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
    SENDGRID_API_KEY: 'test-key',
    ...overrides,
  };
}

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/', { headers });
}

// ── Tests ──

describe('getSessionUserId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns user ID when session is valid', async () => {
    const { betterAuth } = await import('better-auth');
    (betterAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue({ user: { id: 'user_abc123' } }),
      },
    });

    const userId = await getSessionUserId(makeRequest(), makeEnv());
    expect(userId).toBe('user_abc123');
  });

  it('returns null when no session exists', async () => {
    const { betterAuth } = await import('better-auth');
    (betterAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue(null),
      },
    });

    const userId = await getSessionUserId(makeRequest(), makeEnv());
    expect(userId).toBeNull();
  });

  it('returns null when session has no user', async () => {
    const { betterAuth } = await import('better-auth');
    (betterAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue({ user: null }),
      },
    });

    const userId = await getSessionUserId(makeRequest(), makeEnv());
    expect(userId).toBeNull();
  });

  it('returns null when getSession throws', async () => {
    const { betterAuth } = await import('better-auth');
    (betterAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      api: {
        getSession: vi.fn().mockRejectedValue(new Error('DB error')),
      },
    });

    const userId = await getSessionUserId(makeRequest(), makeEnv());
    expect(userId).toBeNull();
  });

  it('returns null when session cookie is missing (no Authorization header)', async () => {
    const { betterAuth } = await import('better-auth');
    (betterAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue(undefined),
      },
    });

    const userId = await getSessionUserId(makeRequest(), makeEnv());
    expect(userId).toBeNull();
  });
});
