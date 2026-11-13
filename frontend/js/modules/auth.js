/**
 * SecurePass - Authentication & Master Key Module
 * Manages zero-knowledge login portal, vault creation, and session states
 */

const AuthModule = {
  init() {
    this.subscribeToStore();
    this.refreshStatus();
  },

  subscribeToStore() {
    Store.subscribe('auth', (authState) => {
      this.renderViewVisibility(authState.isUnlocked);
      this.configurePortalCard(authState);
    });

    Store.subscribe('ui', (uiState) => {
      const authState = Store.getState('auth');
      this.renderViewVisibility(authState.isUnlocked);
    });
  },

  async refreshStatus() {
    const data = await API.getStatus();
    if (data.success) {
      Store.dispatch('SET_AUTH_STATUS', data);
      if (data.is_unlocked && window.VaultModule) {
        VaultModule.loadCredentials();
      }
    }
  },

  renderViewVisibility(isUnlocked) {
    const loginView = document.getElementById('view-login');
    const dashboardView = document.getElementById('view-dashboard');
    const isStandalone = Store.getState('ui').isStandaloneMode;

    if (isUnlocked || isStandalone) {
      if (loginView) loginView.style.display = 'none';
      if (dashboardView) dashboardView.style.display = 'flex';
    } else {
      if (loginView) loginView.style.display = 'flex';
      if (dashboardView) dashboardView.style.display = 'none';
    }

    // Vault panel prompt when viewing standalone while locked
    const lockedPrompt = document.getElementById('vault-locked-state');
    const unlockedContent = document.getElementById('vault-unlocked-state');
    if (isUnlocked) {
      if (lockedPrompt) lockedPrompt.style.display = 'none';
      if (unlockedContent) unlockedContent.style.display = 'block';
    } else {
      if (lockedPrompt) lockedPrompt.style.display = 'block';
      if (unlockedContent) unlockedContent.style.display = 'none';
    }
  },

  configurePortalCard(authState) {
    const titleEl = document.getElementById('login-title');
    const subtitleEl = document.getElementById('login-subtitle');
    const confirmGroup = document.getElementById('login-confirm-group');
    const submitBtn = document.getElementById('login-submit-btn');
    const switchLink = document.getElementById('login-mode-switch-link');

    const shouldShowCreate = !authState.vaultExists || authState.isCreateMode;

    if (shouldShowCreate) {
      if (titleEl) titleEl.innerHTML = 'Initialize <span class="accent">Master Vault</span>';
      if (subtitleEl) subtitleEl.textContent = 'Create a secure master password. PBKDF2 derives the AES-256 key with 100,000 iterations.';
      if (confirmGroup) confirmGroup.style.display = 'block';
      if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Initialize Master Vault';
      if (switchLink) {
        if (authState.vaultExists) {
          switchLink.textContent = 'Already have a vault? Unlock existing';
          switchLink.style.display = 'inline';
        } else {
          switchLink.style.display = 'none';
        }
      }
    } else {
      if (titleEl) titleEl.innerHTML = 'Unlock <span class="accent">SecurePass</span>';
      if (subtitleEl) subtitleEl.textContent = 'Enter your master password to decrypt credentials into isolated memory.';
      if (confirmGroup) confirmGroup.style.display = 'none';
      if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-key"></i> Decrypt & Unlock';
      if (switchLink) {
        switchLink.textContent = 'Need to initialize a new vault? Create here';
        switchLink.style.display = 'inline';
      }
    }
  },

  toggleCreateMode() {
    const isCreate = Store.getState('auth').isCreateMode;
    Store.dispatch('SET_CREATE_MODE', !isCreate);
  },

  togglePasswordVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (btnEl) btnEl.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
      input.type = 'password';
      if (btnEl) btnEl.innerHTML = '<i class="fas fa-eye"></i>';
    }
  },

  async handleAuth(e) {
    if (e) e.preventDefault();
    const masterInput = document.getElementById('login-master-password') || document.getElementById('auth-master-password');
    const confirmInput = document.getElementById('login-confirm-password') || document.getElementById('auth-confirm-password');

    const master = masterInput ? masterInput.value.trim() : '';
    const confirm = confirmInput ? confirmInput.value.trim() : '';

    if (!master) {
      UI.toast('Master password is required.', 'error');
      return;
    }

    const authState = Store.getState('auth');
    const isCreating = !authState.vaultExists || authState.isCreateMode;

    if (isCreating) {
      if (master !== confirm) {
        UI.toast('Master passwords do not match.', 'error');
        return;
      }
      if (master.length < 8) {
        UI.toast('Master password must be at least 8 characters.', 'error');
        return;
      }

      const res = await API.createVault(master, confirm);
      if (res.success) {
        UI.toast('Vault successfully initialized with 100,000 PBKDF2 iterations.', 'success');
        if (masterInput) masterInput.value = '';
        if (confirmInput) confirmInput.value = '';
        Store.dispatch('SET_CREATE_MODE', false);
        Store.dispatch('SET_STANDALONE_MODE', false);
        await this.refreshStatus();
      } else {
        UI.toast(res.error || 'Initialization failed.', 'error');
      }
    } else {
      const res = await API.unlockVault(master);
      if (res.success) {
        UI.toast(`Vault decrypted. ${res.total_credentials} credentials loaded.`, 'success');
        if (masterInput) masterInput.value = '';
        if (confirmInput) confirmInput.value = '';
        Store.dispatch('SET_STANDALONE_MODE', false);
        await this.refreshStatus();
      } else {
        UI.toast(res.error || 'Authentication rejected: Invalid master key.', 'error');
      }
    }
  },

  async lock() {
    const res = await API.lockVault();
    if (res.success) {
      Store.dispatch('SET_AUTH_STATUS', { is_unlocked: false, vault_exists: true });
      Store.dispatch('SET_CREDENTIALS', []);
      Store.dispatch('CLEAR_REVEALED_SECRETS');
      Store.dispatch('SET_STANDALONE_MODE', false);
      UI.toast('Vault locked. In-memory keys scrubbed.', 'info');
    }
  },

  exploreStandalone() {
    Store.dispatch('SET_STANDALONE_MODE', true);
    Store.dispatch('SET_ACTIVE_TAB', 'analyzer');
    UI.toast('Standalone Mode: Analyzer and Key Generator are ready.', 'info', 2500);
  },

  returnToLogin() {
    Store.dispatch('SET_STANDALONE_MODE', false);
  }
};

window.AuthModule = AuthModule;
