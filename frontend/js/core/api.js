/**
 * SecurePass - REST API Client Module
 * Communicates with modular Flask backend endpoints
 */

const API = {
  async getStatus() {
    try {
      const res = await fetch('/api/status');
      return await res.json();
    } catch (err) {
      console.error('API Error [getStatus]:', err);
      return { success: false, error: 'Cryptographic engine unreachable.' };
    }
  },

  async createVault(master_password, confirm_password) {
    try {
      const res = await fetch('/api/vault/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ master_password, confirm_password })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: 'Network error during vault initialization.' };
    }
  },

  async unlockVault(master_password) {
    try {
      const res = await fetch('/api/vault/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ master_password })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: 'Network error during master authentication.' };
    }
  },

  async lockVault() {
    try {
      const res = await fetch('/api/vault/lock', { method: 'POST' });
      return await res.json();
    } catch (err) {
      return { success: false, error: 'Failed to lock vault.' };
    }
  },

  async getPasswords(query = '', category = 'all') {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (category && category !== 'all') params.append('category', category);

      const url = `/api/passwords${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      return await res.json();
    } catch (err) {
      return { success: false, error: 'Network error retrieving credentials.' };
    }
  },

  async addPassword(service, username, password, category = 'General', id = null) {
    try {
      const payload = { service, username, password, category };
      if (id) payload.id = id;

      const res = await fetch('/api/passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: 'Network error saving credential.' };
    }
  },

  async deletePassword(id) {
    try {
      const res = await fetch('/api/passwords/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: 'Network error purging credential.' };
    }
  },

  async exportVault() {
    try {
      const res = await fetch('/api/passwords/export');
      return await res.json();
    } catch (err) {
      return { success: false, error: 'Network error generating vault export.' };
    }
  },

  async analyzePassword(password) {
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      return await res.json();
    } catch (err) {
      return { score: 0, entropy: 0, issues: ['Network error analyzing secret.'], good: [] };
    }
  },

  async generatePasswords(options = {}) {
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      return await res.json();
    } catch (err) {
      return { success: false, passwords: [] };
    }
  },

  async getAudit() {
    try {
      const res = await fetch('/api/vault/audit');
      return await res.json();
    } catch (err) {
      return { success: false, error: 'Network error compiling security audit.' };
    }
  }
};

window.API = API;
