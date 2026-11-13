/**
 * SecurePass - Sidebar & Navigation Component
 * Coordinates feature tabs, status badges, mobile layout, and breadcrumbs
 */

const SidebarComponent = {
  tabTitles: {
    vault: 'Password Vault',
    analyzer: 'Cryptographic Strength Analyzer',
    generator: 'CSPRNG Key & Password Generator',
    audit: 'Vault Security Posture & Telemetry'
  },

  init() {
    this.bindEvents();
    this.subscribeToStore();
  },

  bindEvents() {
    // Feature navigation buttons
    document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        if (target) {
          Store.dispatch('SET_ACTIVE_TAB', target);
          this.closeMobileMenu();
        }
      });
    });

    // Mobile menu toggle
    const mobileBtn = document.getElementById('mobile-menu-toggle-btn');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => {
        Store.dispatch('TOGGLE_MOBILE_MENU');
      });
    }
  },

  subscribeToStore() {
    // 1. UI changes (active tab, mobile menu)
    Store.subscribe('ui', (uiState) => {
      this.renderActiveTab(uiState.activeTab);
      this.renderMobileMenu(uiState.isMobileMenuOpen);
    });

    // 2. Auth status (update Decrypted / Encrypted pills and lock buttons)
    Store.subscribe('auth', (authState) => {
      this.renderAuthStatus(authState.isUnlocked);
    });

    // 3. Vault changes (update credential count badge)
    Store.subscribe('vault', (vaultState) => {
      const badge = document.getElementById('sidebar-badge-vault');
      if (badge) {
        badge.textContent = vaultState.credentials.length;
      }
    });

    // 4. Audit changes (update audit percentage badge)
    Store.subscribe('audit', (auditState) => {
      const badge = document.getElementById('sidebar-badge-audit');
      if (badge) {
        badge.textContent = `${auditState.overallHealth}%`;
      }
    });
  },

  renderActiveTab(tabId) {
    // Update active nav button
    document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update visible tab panel
    document.querySelectorAll('.tab-panel').forEach(panel => {
      if (panel.id === `panel-${tabId}`) {
        panel.style.display = 'block';
      } else {
        panel.style.display = 'none';
      }
    });

    // Update topbar breadcrumb
    const breadcrumb = document.getElementById('topbar-breadcrumb');
    if (breadcrumb) {
      breadcrumb.textContent = this.tabTitles[tabId] || 'Security Management';
    }

    // Trigger lazy audit refresh when activating audit tab
    if (tabId === 'audit' && Store.getState('auth').isUnlocked) {
      if (window.AuditModule && typeof window.AuditModule.loadAudit === 'function') {
        window.AuditModule.loadAudit();
      }
    }
  },

  renderAuthStatus(isUnlocked) {
    const sidebarStatus = document.getElementById('sidebar-status-pill');
    const topbarStatus = document.getElementById('topbar-status-pill');
    const topbarLockBtn = document.getElementById('btn-topbar-lock');
    const sidebarLockBtn = document.getElementById('btn-sidebar-lock');

    if (isUnlocked) {
      const decryptedHtml = '<span class="spec-pulse-dot"></span><span>Decrypted</span>';
      if (sidebarStatus) {
        sidebarStatus.className = 'status-indicator-pill';
        sidebarStatus.innerHTML = decryptedHtml;
      }
      if (topbarStatus) {
        topbarStatus.className = 'status-indicator-pill';
        topbarStatus.innerHTML = decryptedHtml;
      }
      if (topbarLockBtn) topbarLockBtn.style.display = 'inline-flex';
      if (sidebarLockBtn) sidebarLockBtn.style.display = 'flex';
    } else {
      const encryptedHtml = '<i class="fas fa-lock" style="font-size: 0.65rem;"></i><span>Encrypted</span>';
      if (sidebarStatus) {
        sidebarStatus.className = 'status-indicator-pill locked';
        sidebarStatus.innerHTML = encryptedHtml;
      }
      if (topbarStatus) {
        topbarStatus.className = 'status-indicator-pill locked';
        topbarStatus.innerHTML = encryptedHtml;
      }
      if (topbarLockBtn) topbarLockBtn.style.display = 'none';
    }
  },

  renderMobileMenu(isOpen) {
    const sidebar = document.getElementById('app-sidebar');
    if (!sidebar) return;
    if (isOpen) {
      sidebar.classList.add('mobile-open');
    } else {
      sidebar.classList.remove('mobile-open');
    }
  },

  closeMobileMenu() {
    Store.setState('ui', { isMobileMenuOpen: false });
  }
};

window.SidebarComponent = SidebarComponent;
