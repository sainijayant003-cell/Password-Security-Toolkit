/**
 * SecurePass - Theme Manager Component
 * Unslop Design System: High-Craft Restrained Color Palettes
 */

const ThemeManager = {
  themes: [
    {
      id: 'unslop-studio',
      name: 'Unslop Studio',
      accent: '#38bdf8',
      accentGlow: 'rgba(56, 189, 248, 0.14)',
      description: 'Minimalist Zinc & Monochrome Studio Palette'
    },
    {
      id: 'graphite-slate',
      name: 'Graphite Slate',
      accent: '#0ea5e9',
      accentGlow: 'rgba(14, 165, 233, 0.14)',
      description: 'Deep industrial slate with electric cyan'
    },
    {
      id: 'terminal-emerald',
      name: 'Terminal Emerald',
      accent: '#10b981',
      accentGlow: 'rgba(16, 185, 129, 0.14)',
      description: 'Matte obsidian with phosphor terminal green'
    },
    {
      id: 'midnight-navy',
      name: 'Midnight Navy',
      accent: '#38bdf8',
      accentGlow: 'rgba(56, 189, 248, 0.14)',
      description: 'Deep intelligence navy & celestial blue'
    },
    {
      id: 'onyx-crimson',
      name: 'Onyx Crimson',
      accent: '#f43f5e',
      accentGlow: 'rgba(244, 63, 94, 0.14)',
      description: 'Tactile carbon with surgical ruby'
    },
    {
      id: 'industrial-amber',
      name: 'Industrial Amber',
      accent: '#f59e0b',
      accentGlow: 'rgba(245, 158, 11, 0.14)',
      description: 'Studio charcoal & bronze amber'
    }
  ],

  init() {
    // Subscribe to store theme slice
    Store.subscribe('theme', (themeState) => {
      this.applyTheme(themeState.activeTheme);
    });

    // Apply initial theme from store
    const initialTheme = Store.getState('theme').activeTheme || 'unslop-studio';
    this.applyTheme(initialTheme);
    this.bindEvents();
  },

  bindEvents() {
    document.querySelectorAll('.theme-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const themeId = chip.getAttribute('data-theme');
        if (themeId) this.setTheme(themeId);
      });
    });
  },

  setTheme(themeId, notify = true) {
    // Map legacy ids if needed
    const mappedId = this.mapLegacyId(themeId);
    const theme = this.themes.find(t => t.id === mappedId) || this.themes[0];

    Store.dispatch('SET_THEME', theme.id);
    if (notify) {
      UI.toast(`Theme: ${theme.name}`, 'info', 1600);
    }
  },

  mapLegacyId(id) {
    const map = {
      'cyber-slate': 'unslop-studio',
      'matrix-emerald': 'terminal-emerald',
      'midnight-blue': 'midnight-navy',
      'crimson-protocol': 'onyx-crimson',
      'synthwave-neon': 'onyx-crimson',
      'solar-amber': 'industrial-amber'
    };
    return map[id] || id;
  },

  applyTheme(themeId) {
    const mappedId = this.mapLegacyId(themeId);
    const theme = this.themes.find(t => t.id === mappedId) || this.themes[0];
    document.documentElement.setAttribute('data-theme', theme.id);

    // Update active class on theme chips
    document.querySelectorAll('.theme-chip').forEach(el => {
      const chipTheme = el.getAttribute('data-theme');
      if (chipTheme === theme.id || this.mapLegacyId(chipTheme) === theme.id) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Notify background engine
    if (window.BackgroundEngine && typeof window.BackgroundEngine.onThemeChanged === 'function') {
      window.BackgroundEngine.onThemeChanged(theme);
    }
  },

  getCurrentThemeData() {
    const currentId = Store.getState('theme').activeTheme;
    const mappedId = this.mapLegacyId(currentId);
    return this.themes.find(t => t.id === mappedId) || this.themes[0];
  }
};

window.ThemeManager = ThemeManager;
// Backward compatibility alias
window.Theme = ThemeManager;
