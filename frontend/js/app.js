/**
 * SecurePass - Main Application Bootstrap
 * Orchestrates Store, Components, Feature Modules, and Global Keyboard Shortcuts
 */

const App = {
  async init() {
    // 1. Initialize Central State Store
    Store.init();

    // 2. Initialize Visual & Layout Components
    ThemeManager.init();
    BackgroundEngine.init();
    SidebarComponent.init();

    // 3. Initialize Feature Modules
    await AuthModule.init();
    VaultModule.init();
    AnalyzerModule.init();
    GeneratorModule.init();
    AuditModule.init();

    // 4. Global Keyboard Shortcuts
    this.bindKeyboardShortcuts();

    // 5. Initial Hash Routing
    const hash = window.location.hash.replace('#', '');
    if (['vault', 'analyzer', 'generator', 'audit'].includes(hash)) {
      Store.dispatch('SET_ACTIVE_TAB', hash);
    } else {
      Store.dispatch('SET_ACTIVE_TAB', 'vault');
    }
  },

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Escape to close all modals and mobile menu
      if (e.key === 'Escape') {
        UI.closeAllModals();
        SidebarComponent.closeMobileMenu();
      }

      // Ctrl+K to focus vault search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        Store.dispatch('SET_ACTIVE_TAB', 'vault');
        const searchInput = document.getElementById('vault-search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // Ctrl+N for new credential
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        if (Store.getState('auth').isUnlocked) {
          e.preventDefault();
          VaultModule.openAddModal();
        }
      }
    });

    // Close modals on clicking backdrop
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('open');
        }
      });
    });
  },

  exploreStandalone() {
    AuthModule.exploreStandalone();
  },

  returnToLogin() {
    AuthModule.returnToLogin();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;
