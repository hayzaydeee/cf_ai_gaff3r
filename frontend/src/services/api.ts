// Backend API client
// TODO: Phase 3 implementation

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:8787'
  : '/api';

export const api = {
  // GET /api/gameweek/current
  async getCurrentGameweek() {
    const res = await fetch(`${API_BASE}/api/gameweek/current`);
    return res.json();
  },

  // GET /api/fixtures/:gw
  async getFixtures(gw: number) {
    const res = await fetch(`${API_BASE}/api/fixtures/${gw}`);
    return res.json();
  },

  // POST /api/chat
  async sendMessage(message: string, gameweek: number, fixtureId?: number) {
    const userId = getUserId();
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ message, gameweek, fixtureId, userId }),
    });
    return res.json();
  },

  // GET /api/predictions
  async getPredictions(status?: string) {
    const userId = getUserId();
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const res = await fetch(`${API_BASE}/api/predictions?${params}`, {
      headers: { 'x-user-id': userId },
    });
    return res.json();
  },

  // GET /api/stats
  async getStats() {
    const userId = getUserId();
    const res = await fetch(`${API_BASE}/api/stats`, {
      headers: { 'x-user-id': userId },
    });
    return res.json();
  },
};

function getUserId(): string {
  let userId = localStorage.getItem('gaff3r-user-id');
  if (!userId) {
    userId = `usr_${crypto.randomUUID()}`;
    localStorage.setItem('gaff3r-user-id', userId);
  }
  return userId;
}
