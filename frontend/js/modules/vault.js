/**
 * SecurePass - Vault Credentials Management Module
 * Table rendering, category filtering, search, and credential CRUD
 */

const VaultModule = {
  revealTimers: new Map(),

  init() {
    this.subscribeToStore();
    this.bindEvents();
  },

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('vault-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', UI.debounce((e) => {
        Store.dispatch('SET_SEARCH_QUERY', e.target.value.trim());
        this.loadCredentials();
      }, 150));
    }

    // Category pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const cat = pill.getAttribute('data-cat');
        this.setCategory(cat);
      });
    });
  },

  subscribeToStore() {
    Store.subscribe('vault', (vaultState) => {
      this.renderCredentials(vaultState.credentials, vaultState.revealedIds);
      this.updateCounts(vaultState.credentials.length);
    });
  },

  async loadCredentials() {
    if (!Store.getState('auth').isUnlocked) return;

    const { searchQuery, selectedCategory } = Store.getState('vault');
    const res = await API.getPasswords(searchQuery, selectedCategory);
    if (res.success) {
      Store.dispatch('SET_CREDENTIALS', res.credentials);
    }
  },

  renderCredentials(credentials, revealedIds) {
    const tbody = document.getElementById('credentials-table-body');
    const emptyState = document.getElementById('vault-empty-state');
    const tableContainer = document.getElementById('vault-table-container');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!credentials || credentials.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (tableContainer) tableContainer.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';

    credentials.forEach(entry => {
      const isRevealed = revealedIds.has(entry.id);
      const tr = document.createElement('tr');

      let badgeClass = 'badge-slate';
      if (entry.strength_score >= 80) badgeClass = 'badge-emerald';
      else if (entry.strength_score >= 50) badgeClass = 'badge-amber';
      else badgeClass = 'badge-rose';

      tr.innerHTML = `
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${UI.escape(entry.service)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">ID: ${UI.escape(entry.id)}</div>
        </td>
        <td>
          <div style="font-family: var(--font-mono);">${UI.escape(entry.username)}</div>
        </td>
        <td>
          <span class="badge badge-slate">${UI.escape(entry.category || 'General')}</span>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span id="pwd-val-${entry.id}" class="${isRevealed ? 'password-revealed' : 'password-mask'}">
              ${isRevealed ? UI.escape(entry.password) : '••••••••••••••••'}
            </span>
            <button class="btn btn-ghost btn-sm" onclick="VaultModule.toggleReveal('${entry.id}')" title="${isRevealed ? 'Mask secret' : 'Reveal secret (15s)'}">
              <i class="fas ${isRevealed ? 'fa-eye-slash' : 'fa-eye'}"></i>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="UI.copyToClipboard('${UI.escape(entry.password).replace(/'/g, "\\'")}', 'Password')" title="Copy to clipboard">
              <i class="fas fa-copy"></i>
            </button>
          </div>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge ${badgeClass}">${UI.escape(entry.strength_tier || 'Analyzed')}</span>
            <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary);">${entry.entropy_bits || 0} bits</span>
          </div>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="VaultModule.openEditModal('${entry.id}')" title="Edit credential">
              <i class="fas fa-pen"></i>
            </button>
            <button class="btn btn-danger btn-sm" onclick="VaultModule.deleteEntry('${entry.id}')" title="Delete credential">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  updateCounts(count) {
    const countEl = document.getElementById('vault-credential-count');
    if (countEl) {
      countEl.textContent = `${count} credential${count === 1 ? '' : 's'} stored`;
    }
  },

  toggleReveal(id) {
    Store.dispatch('TOGGLE_REVEAL_SECRET', id);

    const isNowRevealed = Store.getState('vault').revealedIds.has(id);
    if (isNowRevealed) {
      // Clear existing timer if any
      if (this.revealTimers.has(id)) {
        clearTimeout(this.revealTimers.get(id));
      }
      // Auto-hide after 15 seconds
      const timer = setTimeout(() => {
        if (Store.getState('vault').revealedIds.has(id)) {
          Store.dispatch('TOGGLE_REVEAL_SECRET', id);
        }
        this.revealTimers.delete(id);
      }, 15000);
      this.revealTimers.set(id, timer);
    } else {
      if (this.revealTimers.has(id)) {
        clearTimeout(this.revealTimers.get(id));
        this.revealTimers.delete(id);
      }
    }
  },

  setCategory(cat) {
    Store.dispatch('SET_CATEGORY', cat);
    document.querySelectorAll('.filter-pill').forEach(pill => {
      if (pill.getAttribute('data-cat') === cat) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
    this.loadCredentials();
  },

  openAddModal() {
    if (!Store.getState('auth').isUnlocked) {
      UI.toast('Please unlock your vault first.', 'warning');
      return;
    }
    document.getElementById('modal-entry-title').textContent = 'Add Security Credential';
    document.getElementById('form-service').value = '';
    document.getElementById('form-username').value = '';
    document.getElementById('form-password').value = '';
    document.getElementById('form-category').value = 'General';
    delete document.getElementById('entry-modal').dataset.editId;
    UI.openModal('entry-modal');
  },

  openEditModal(id) {
    const credentials = Store.getState('vault').credentials;
    const entry = credentials.find(c => c.id === id);
    if (!entry) return;

    document.getElementById('modal-entry-title').textContent = 'Edit Security Credential';
    document.getElementById('form-service').value = entry.service;
    document.getElementById('form-username').value = entry.username;
    document.getElementById('form-password').value = entry.password;
    document.getElementById('form-category').value = entry.category || 'General';
    document.getElementById('entry-modal').dataset.editId = id;
    UI.openModal('entry-modal');
  },

  async handleSaveEntry(e) {
    e.preventDefault();
    const service = document.getElementById('form-service').value.trim();
    const username = document.getElementById('form-username').value.trim();
    const password = document.getElementById('form-password').value.trim();
    const category = document.getElementById('form-category').value;
    const editId = document.getElementById('entry-modal').dataset.editId;

    if (!service || !username || !password) {
      UI.toast('All credential fields are required.', 'error');
      return;
    }

    const res = await API.addPassword(service, username, password, category, editId || null);
    if (res.success) {
      UI.toast(editId ? 'Credential updated.' : 'Credential secured in vault.', 'success');
      UI.closeModal('entry-modal');
      await this.loadCredentials();
      if (window.AuditModule) AuditModule.loadAudit();
    } else {
      UI.toast(res.error || 'Failed to persist credential.', 'error');
    }
  },

  async deleteEntry(id) {
    const confirmed = confirm('Are you sure you want to permanently delete this credential from the encrypted vault?');
    if (!confirmed) return;

    const res = await API.deletePassword(id);
    if (res.success) {
      UI.toast('Credential purged.', 'info');
      await this.loadCredentials();
      if (window.AuditModule) AuditModule.loadAudit();
    } else {
      UI.toast(res.error || 'Failed to delete credential.', 'error');
    }
  },

  async exportBackup() {
    if (!Store.getState('auth').isUnlocked) {
      UI.toast('Please unlock your vault before exporting.', 'warning');
      return;
    }
    const res = await API.exportVault();
    if (res.success) {
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename || `securepass-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      UI.toast('Encrypted backup successfully exported.', 'success');
    } else {
      UI.toast(res.error || 'Export failed.', 'error');
    }
  }
};

window.VaultModule = VaultModule;

// Backward-compatibility wrapper for window.Vault
window.Vault = {
  get state() {
    const auth = Store.getState('auth');
    const vault = Store.getState('vault');
    return {
      isUnlocked: auth.isUnlocked,
      vaultExists: auth.vaultExists,
      isCreateMode: auth.isCreateMode,
      credentials: vault.credentials,
      selectedCategory: vault.selectedCategory,
      searchQuery: vault.searchQuery,
      revealedIds: vault.revealedIds
    };
  },
  init: () => VaultModule.init(),
  refreshStatus: () => AuthModule.refreshStatus(),
  toggleCreateMode: () => AuthModule.toggleCreateMode(),
  togglePasswordVisibility: (id, btn) => AuthModule.togglePasswordVisibility(id, btn),
  handleAuth: (e) => AuthModule.handleAuth(e),
  lock: () => AuthModule.lock(),
  loadCredentials: () => VaultModule.loadCredentials(),
  toggleReveal: (id) => VaultModule.toggleReveal(id),
  setCategory: (cat) => VaultModule.setCategory(cat),
  handleSearch: (e) => {
    Store.dispatch('SET_SEARCH_QUERY', e.target.value.trim());
    VaultModule.loadCredentials();
  },
  openAddModal: () => VaultModule.openAddModal(),
  openEditModal: (id) => VaultModule.openEditModal(id),
  handleSaveEntry: (e) => VaultModule.handleSaveEntry(e),
  deleteEntry: (id) => VaultModule.deleteEntry(id),
  exportBackup: () => VaultModule.exportBackup()
};
