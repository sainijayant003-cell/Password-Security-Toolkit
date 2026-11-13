/**
 * SecurePass - Reactive State Store
 * Centralized Single Source of Truth with Event-Driven Pub/Sub
 */

class SecurePassStore {
  constructor() {
    this._state = {
      auth: {
        isUnlocked: false,
        vaultExists: false,
        isCreateMode: false,
        cipherInfo: null
      },
      vault: {
        credentials: [],
        selectedCategory: 'all',
        searchQuery: '',
        revealedIds: new Set(),
        activeEditId: null
      },
      theme: {
        activeTheme: 'unslop-studio'
      },
      background: {
        activeMode: 'grid'
      },
      analyzer: {
        input: '',
        score: 0,
        entropy: 0,
        tier: 'Awaiting Input',
        crackTimes: null,
        breakdown: null,
        issues: [],
        good: []
      },
      generator: {
        mode: 'password', // 'password' | 'multiword'
        length: 20,
        includeUpper: true,
        includeLower: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeAmbiguous: false,
        wordCount: 4,
        separator: '-',
        includeNumbersInPhrase: true,
        count: 1,
        results: []
      },
      audit: {
        overallHealth: 100,
        counts: {
          strong: 0,
          moderate: 0,
          weak: 0,
          compromised: 0,
          reused: 0
        },
        duplicatedGroups: [],
        credentials: []
      },
      ui: {
        activeTab: 'vault',
        isStandaloneMode: false,
        isMobileMenuOpen: false,
        activeModal: null
      }
    };

    this._subscribers = new Map();
  }

  init() {
    // Restore persistent user preferences
    const savedTheme = localStorage.getItem('securepass_theme');
    if (savedTheme) {
      this._state.theme.activeTheme = savedTheme;
    }

    const savedBg = localStorage.getItem('securepass_bg');
    if (savedBg) {
      this._state.background.activeMode = savedBg;
    }
  }

  /**
   * Retrieves state of a given slice or whole state
   * @param {string} [slice] - 'auth' | 'vault' | 'theme' | 'background' | 'analyzer' | 'generator' | 'audit' | 'ui'
   */
  getState(slice) {
    if (!slice) return this._state;
    return this._state[slice];
  }

  /**
   * Updates state slice and notifies subscribers
   * @param {string} slice - State slice identifier
   * @param {Object} partialState - New values to merge
   */
  setState(slice, partialState) {
    if (!this._state[slice]) {
      console.warn(`[SecurePass Store] Unknown state slice: ${slice}`);
      return;
    }

    const prevState = { ...this._state[slice] };
    this._state[slice] = { ...this._state[slice], ...partialState };

    this._notify(slice, this._state[slice], prevState);
  }

  /**
   * Subscribes a listener to changes in a state slice
   * @param {string} slice - State slice identifier
   * @param {Function} callback - Callback function(newState, prevState)
   * @returns {Function} Unsubscribe function
   */
  subscribe(slice, callback) {
    if (!this._subscribers.has(slice)) {
      this._subscribers.set(slice, new Set());
    }
    this._subscribers.get(slice).add(callback);

    return () => {
      const set = this._subscribers.get(slice);
      if (set) set.delete(callback);
    };
  }

  _notify(slice, newState, prevState) {
    if (this._subscribers.has(slice)) {
      this._subscribers.get(slice).forEach(cb => {
        try {
          cb(newState, prevState);
        } catch (err) {
          console.error(`[SecurePass Store] Error in subscriber for ${slice}:`, err);
        }
      });
    }

    // Global wildcard subscriber
    if (this._subscribers.has('*')) {
      this._subscribers.get('*').forEach(cb => cb(slice, newState, prevState));
    }
  }

  /**
   * Reducer / Dispatcher for explicit state transitions
   */
  dispatch(action, payload) {
    switch (action) {
      case 'SET_AUTH_STATUS':
        this.setState('auth', {
          isUnlocked: payload.is_unlocked,
          vaultExists: payload.vault_exists,
          cipherInfo: payload.cipher_info
        });
        break;

      case 'SET_CREATE_MODE':
        this.setState('auth', { isCreateMode: payload });
        break;

      case 'SET_CREDENTIALS':
        this.setState('vault', { credentials: payload });
        break;

      case 'SET_CATEGORY':
        this.setState('vault', { selectedCategory: payload });
        break;

      case 'SET_SEARCH_QUERY':
        this.setState('vault', { searchQuery: payload });
        break;

      case 'TOGGLE_REVEAL_SECRET': {
        const currentRevealed = new Set(this._state.vault.revealedIds);
        if (currentRevealed.has(payload)) {
          currentRevealed.delete(payload);
        } else {
          currentRevealed.add(payload);
        }
        this.setState('vault', { revealedIds: currentRevealed });
        break;
      }

      case 'CLEAR_REVEALED_SECRETS':
        this.setState('vault', { revealedIds: new Set() });
        break;

      case 'SET_THEME':
        this.setState('theme', { activeTheme: payload });
        localStorage.setItem('securepass_theme', payload);
        break;

      case 'SET_BACKGROUND':
        this.setState('background', { activeMode: payload });
        localStorage.setItem('securepass_bg', payload);
        break;

      case 'SET_ACTIVE_TAB':
        this.setState('ui', { activeTab: payload });
        break;

      case 'SET_STANDALONE_MODE':
        this.setState('ui', { isStandaloneMode: payload });
        break;

      case 'TOGGLE_MOBILE_MENU':
        this.setState('ui', { isMobileMenuOpen: !this._state.ui.isMobileMenuOpen });
        break;

      case 'SET_AUDIT_DATA':
        this.setState('audit', payload);
        break;

      default:
        console.warn(`[SecurePass Store] Unhandled action: ${action}`, payload);
    }
  }
}

// Global Store Instance
window.Store = new SecurePassStore();
