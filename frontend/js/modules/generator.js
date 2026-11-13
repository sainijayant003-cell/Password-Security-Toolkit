/**
 * SecurePass - Cryptographic Key & Diceware Generator Module
 */

const GeneratorModule = {
  init() {
    this.bindEvents();
    this.generate();
  },

  bindEvents() {
    // Length slider
    const slider = document.getElementById('gen-length-slider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        document.getElementById('gen-length-val').textContent = e.target.value;
      });
    }

    // Words slider
    const wordSlider = document.getElementById('gen-words-slider');
    if (wordSlider) {
      wordSlider.addEventListener('input', (e) => {
        document.getElementById('gen-words-val').textContent = e.target.value;
      });
    }
  },

  setMode(mode) {
    Store.setState('generator', { mode });

    const btnPwd = document.getElementById('btn-mode-password');
    const btnPhrase = document.getElementById('btn-mode-multiword') || document.getElementById('btn-mode-passphrase');
    const optPwd = document.getElementById('gen-mode-password-options');
    const optPhrase = document.getElementById('gen-mode-multiword-options') || document.getElementById('gen-mode-passphrase-options');

    if (mode === 'password') {
      if (btnPwd) btnPwd.classList.add('active');
      if (btnPhrase) btnPhrase.classList.remove('active');
      if (optPwd) optPwd.style.display = 'block';
      if (optPhrase) optPhrase.style.display = 'none';
    } else {
      if (btnPwd) btnPwd.classList.remove('active');
      if (btnPhrase) btnPhrase.classList.add('active');
      if (optPwd) optPwd.style.display = 'none';
      if (optPhrase) optPhrase.style.display = 'block';
    }

    this.generate();
  },

  setLengthPreset(len) {
    const slider = document.getElementById('gen-length-slider');
    if (slider) {
      slider.value = len;
      document.getElementById('gen-length-val').textContent = len;
      this.generate();
    }
  },

  async generate() {
    const mode = Store.getState('generator').mode;
    let payload = { mode };

    const count = parseInt(document.getElementById('gen-count-select')?.value || 1, 10);
    payload.count = count;

    if (mode === 'password') {
      payload.length = parseInt(document.getElementById('gen-length-slider')?.value || 20, 10);
      payload.include_upper = document.getElementById('gen-check-upper')?.checked ?? true;
      payload.include_lower = document.getElementById('gen-check-lower')?.checked ?? true;
      payload.include_numbers = document.getElementById('gen-check-numbers')?.checked ?? true;
      payload.include_symbols = document.getElementById('gen-check-symbols')?.checked ?? true;
      payload.exclude_ambiguous = document.getElementById('gen-check-ambiguous')?.checked ?? false;
    } else {
      payload.word_count = parseInt(document.getElementById('gen-words-slider')?.value || 4, 10);
      payload.separator = document.getElementById('gen-separator-select')?.value || '-';
      payload.include_numbers_in_phrase = document.getElementById('gen-phrase-numbers')?.checked ?? true;
    }

    const res = await API.generatePasswords(payload);
    if (res.success && res.passwords) {
      Store.setState('generator', { results: res.passwords });
      this.renderResults(res.passwords);
    }
  },

  renderResults(passwords) {
    const container = document.getElementById('gen-results-container');
    if (!container) return;

    container.innerHTML = passwords.map((item, idx) => {
      let badgeClass = 'badge-slate';
      if (item.score >= 80) badgeClass = 'badge-emerald';
      else if (item.score >= 50) badgeClass = 'badge-amber';
      else badgeClass = 'badge-rose';

      return `
        <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div style="flex: 1; min-width: 260px;">
            <div style="font-family: var(--font-mono); font-size: 1.05rem; font-weight: 600; color: var(--accent-cyan); word-break: break-all;">
              ${UI.escape(item.password)}
            </div>
            <div style="display: flex; gap: 8px; align-items: center; margin-top: 6px;">
              <span class="badge ${badgeClass}">${UI.escape(item.tier)}</span>
              <span style="font-family: var(--font-mono); font-size: 0.775rem; color: var(--text-muted);">${item.entropy} bits entropy</span>
              <span style="font-size: 0.775rem; color: var(--text-muted);">&bull; GPU crack: ${UI.escape(item.crack_time)}</span>
            </div>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="UI.copyToClipboard('${UI.escape(item.password).replace(/'/g, "\\'")}', 'Password')">
              <i class="fas fa-copy"></i> Copy
            </button>
            <button class="btn btn-primary btn-sm" onclick="GeneratorModule.transferToVault('${UI.escape(item.password).replace(/'/g, "\\'")}')">
              <i class="fas fa-plus"></i> Save to Vault
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  transferToVault(pwd) {
    if (!Store.getState('auth').isUnlocked) {
      UI.toast('Please unlock your vault first to save this key.', 'warning');
      return;
    }
    VaultModule.openAddModal();
    const pwdInput = document.getElementById('form-password');
    if (pwdInput) pwdInput.value = pwd;
  },

  generateSync() {
    // Quick synchronous fallback generator for modal
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*()_+';
    let res = '';
    for (let i = 0; i < 20; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }
};

window.GeneratorModule = GeneratorModule;

// Backward-compatibility wrapper for window.Generator
window.Generator = {
  init: () => GeneratorModule.init(),
  setMode: (m) => GeneratorModule.setMode(m),
  setLengthPreset: (l) => GeneratorModule.setLengthPreset(l),
  generate: () => GeneratorModule.generate(),
  transferToVault: (pwd) => GeneratorModule.transferToVault(pwd),
  generateSync: () => GeneratorModule.generateSync()
};
