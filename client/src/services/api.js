const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

/**
 * Resilient fetch with customizable timeout and retry logic.
 * Essential for cloud hosts like Render free tier where cold starts take ~20-40 seconds.
 */
async function resilientFetch(url, options = {}, retries = 2, delayMs = 1500) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    // 40 second timeout to allow cold-start server boot
    const timeoutId = setTimeout(() => controller.abort(), 40000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;

      if (attempt === retries) {
        break;
      }

      // Exponential backoff wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  throw lastError;
}

export const api = {
  async getSalonLiveStatus() {
    const res = await resilientFetch(`${API_BASE_URL}/api/salon/live-status`);
    if (!res.ok) throw new Error('Failed to fetch live salon status');
    return res.json();
  },

  async getServices() {
    const res = await resilientFetch(`${API_BASE_URL}/api/services`);
    if (!res.ok) throw new Error('Failed to fetch services');
    return res.json();
  },

  async getBarbers() {
    const res = await resilientFetch(`${API_BASE_URL}/api/barbers`);
    if (!res.ok) throw new Error('Failed to fetch barbers');
    return res.json();
  },

  async joinQueue(payload) {
    const res = await resilientFetch(`${API_BASE_URL}/api/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }, 0);

    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async getTicketStatus(ticketId) {
    const res = await resilientFetch(`${API_BASE_URL}/api/queue/${ticketId}`);
    if (!res.ok) throw new Error('Failed to fetch ticket status');
    return res.json();
  },

  async cancelTicket(ticketId) {
    const res = await resilientFetch(`${API_BASE_URL}/api/queue/${ticketId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, 0);
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async updateTicketStatus(ticketId, status, barberName = null) {
    const res = await resilientFetch(`${API_BASE_URL}/api/queue/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, barberName }),
    }, 0);
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async getQueue(status = '') {
    const query = status ? `?status=${status}` : '';
    const res = await resilientFetch(`${API_BASE_URL}/api/queue${query}`);
    if (!res.ok) throw new Error('Failed to fetch queue list');
    return res.json();
  },

  async callNext(barberId) {
    const res = await resilientFetch(`${API_BASE_URL}/api/queue/call-next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ barberId }),
    }, 0);
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async addWalkin(payload) {
    const res = await resilientFetch(`${API_BASE_URL}/api/queue/walkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }, 0);
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async markNoShow(ticketId) {
    const res = await resilientFetch(`${API_BASE_URL}/api/queue/${ticketId}/no-show`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, 0);
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async updateBarberStatus(barberId, status, isOnDuty) {
    const res = await resilientFetch(`${API_BASE_URL}/api/barbers/${barberId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, isOnDuty }),
    }, 0);
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async toggleBarberBreak(barberName) {
    const res = await resilientFetch(`${API_BASE_URL}/api/barbers/${encodeURIComponent(barberName)}/toggle-break`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, 0);
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async startService(ticketId) {
    const res = await resilientFetch(`${API_BASE_URL}/api/queue/${ticketId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, 0);
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async completeService(ticketId) {
    const res = await resilientFetch(`${API_BASE_URL}/api/queue/${ticketId}/done`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, 0);
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async getBarber(identifier) {
    const res = await resilientFetch(`${API_BASE_URL}/api/barbers/${encodeURIComponent(identifier)}`);
    if (!res.ok) throw new Error('Failed to fetch barber details');
    return res.json();
  },

  // --- Admin & Owner Controls ---
  async verifyAdminPin(pin) {
    const res = await resilientFetch(`${API_BASE_URL}/api/admin/verify-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin }),
    }, 0);
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async getAdminSettings() {
    const res = await resilientFetch(`${API_BASE_URL}/api/admin/settings`);
    if (!res.ok) throw new Error('Failed to fetch admin settings');
    return res.json();
  },

  async getAdminStats() {
    const res = await resilientFetch(`${API_BASE_URL}/api/admin/stats`);
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return res.json();
  },

  async toggleQueue(isQueueOpen) {
    const res = await resilientFetch(`${API_BASE_URL}/api/admin/queue-toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isQueueOpen }),
    }, 0);
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async getAllServices() {
    const res = await resilientFetch(`${API_BASE_URL}/api/services?all=true`);
    if (!res.ok) throw new Error('Failed to fetch all services');
    return res.json();
  },

  async addService(payload) {
    const res = await resilientFetch(`${API_BASE_URL}/api/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }, 0);
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async updateService(id, payload) {
    const res = await resilientFetch(`${API_BASE_URL}/api/services/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }, 0);
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async deleteService(id) {
    const res = await resilientFetch(`${API_BASE_URL}/api/services/${id}`, {
      method: 'DELETE',
    }, 0);
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async getAllBarbers() {
    const res = await resilientFetch(`${API_BASE_URL}/api/barbers?all=true`);
    if (!res.ok) throw new Error('Failed to fetch all barbers');
    return res.json();
  },

  async addBarber(payload) {
    const res = await resilientFetch(`${API_BASE_URL}/api/barbers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }, 0);
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async updateBarber(id, payload) {
    const res = await resilientFetch(`${API_BASE_URL}/api/barbers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }, 0);
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },

  async deleteBarber(id) {
    const res = await resilientFetch(`${API_BASE_URL}/api/barbers/${id}`, {
      method: 'DELETE',
    }, 0);
    const data = await res.json();
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  },
};
