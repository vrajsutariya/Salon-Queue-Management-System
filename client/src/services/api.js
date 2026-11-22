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

  async cancelTicket(ticketId) {
    const res = await fetch(`${API_BASE_URL}/api/queue/${ticketId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async updateTicketStatus(ticketId, status, barberName = null) {
    const res = await fetch(`${API_BASE_URL}/api/queue/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, barberName }),
    });
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async getQueue(status = '') {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE_URL}/api/queue${query}`);
    if (!res.ok) throw new Error('Failed to fetch queue list');
    return res.json();
  },

  async callNext(barberId) {
    const res = await fetch(`${API_BASE_URL}/api/queue/call-next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ barberId }),
    });
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async addWalkin(payload) {
    const res = await fetch(`${API_BASE_URL}/api/queue/walkin`, {
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

  async markNoShow(ticketId) {
    const res = await fetch(`${API_BASE_URL}/api/queue/${ticketId}/no-show`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async updateBarberStatus(barberId, status, isOnDuty) {
    const res = await fetch(`${API_BASE_URL}/api/barbers/${barberId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, isOnDuty }),
    });
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },
};
