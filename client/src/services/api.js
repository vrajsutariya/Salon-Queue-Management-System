const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const api = {
  async getSalonLiveStatus() {
    const res = await fetch(`${API_BASE_URL}/api/salon/live-status`);
    if (!res.ok) throw new Error('Failed to fetch live salon status');
    return res.json();
  },

  async getServices() {
    const res = await fetch(`${API_BASE_URL}/api/services`);
    if (!res.ok) throw new Error('Failed to fetch services');
    return res.json();
  },

  async getBarbers() {
    const res = await fetch(`${API_BASE_URL}/api/barbers`);
    if (!res.ok) throw new Error('Failed to fetch barbers');
    return res.json();
  },

  async joinQueue(payload) {
    const res = await fetch(`${API_BASE_URL}/api/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async getTicketStatus(ticketId) {
    const res = await fetch(`${API_BASE_URL}/api/queue/${ticketId}`);
    if (!res.ok) throw new Error('Failed to fetch ticket status');
    return res.json();
  },
};
