/**
 * SecurePass - Unslop Background Engine
 * Replaces generic AI glowing blobs/lasers with calm, studio-grade visual textures
 */

const BackgroundEngine = {
  canvas: null,
  ctx: null,
  animationId: null,
  width: 0,
  height: 0,
  mouse: { x: -1000, y: -1000, radius: 100 },

  accentColor: '#38bdf8',
  accentRgb: [56, 189, 248],

  // Particles for subtle network
  particles: [],
  particleCount: 35,

  // Telemetry stream data
  matrixColumns: [],
  matrixFontSize: 13,
  matrixGlyphs: '0123456789abcdefABCDEF$:;.*',

  init() {
    this.canvas = document.getElementById('bg-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.resize();

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener('mouseout', () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });

    Store.subscribe('background', (bgState) => {
      this.syncSelects(bgState.activeMode);
      this.reinitMode(bgState.activeMode);
    });

    if (window.ThemeManager) {
      this.onThemeChanged(ThemeManager.getCurrentThemeData());
    }

    this.bindEvents();
    const currentMode = Store.getState('background').activeMode || 'grid';
    this.reinitMode(currentMode);
    this.start();
  },

  bindEvents() {
    document.querySelectorAll('.bg-style-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        this.setMode(e.target.value);
      });
    });
  },

  setMode(mode, notify = true) {
    if (!['grid', 'minimal', 'mesh', 'matrix'].includes(mode)) return;
    Store.dispatch('SET_BACKGROUND', mode);

    if (notify) {
      const modeNames = {
        grid: 'Studio Grid',
        minimal: 'Minimal Matte',
        mesh: 'Subtle Network',
        matrix: 'Quiet Telemetry'
      };
      UI.toast(`Background: ${modeNames[mode]}`, 'info', 1600);
    }
  },

  syncSelects(mode) {
    document.querySelectorAll('.bg-style-select').forEach(sel => {
      sel.value = mode;
    });
  },

  onThemeChanged(themeData) {
    if (!themeData) return;
    this.accentColor = themeData.accent;
    this.accentRgb = this.hexToRgb(themeData.accent) || [56, 189, 248];
  },

  hexToRgb(hex) {
    const clean = hex.replace('#', '');
    if (clean.length === 6) {
      const num = parseInt(clean, 16);
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    } else if (clean.length === 3) {
      const r = parseInt(clean[0] + clean[0], 16);
      const g = parseInt(clean[1] + clean[1], 16);
      const b = parseInt(clean[2] + clean[2], 16);
      return [r, g, b];
    }
    return null;
  },

  resize() {
    if (!this.canvas) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    const mode = Store.getState('background').activeMode;
    this.reinitMode(mode);
  },

  reinitMode(mode) {
    if (mode === 'mesh') {
      this.initParticles();
    } else if (mode === 'matrix') {
      this.initMatrix();
    }
  },

  initParticles() {
    this.particles = [];
    const count = Math.min(45, Math.floor((this.width * this.height) / 32000));
    this.particleCount = Math.max(20, count);

    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.5 + 0.8,
        baseAlpha: Math.random() * 0.25 + 0.15
      });
    }
  },

  initMatrix() {
    const cols = Math.floor(this.width / (this.matrixFontSize * 1.6));
    this.matrixColumns = [];
    for (let i = 0; i < cols; i++) {
      this.matrixColumns.push({
        y: Math.random() * -100,
        speed: Math.random() * 0.8 + 0.6
      });
    }
  },

  start() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    const loop = () => {
      this.render();
      this.animationId = requestAnimationFrame(loop);
    };
    loop();
  },

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const mode = Store.getState('background').activeMode || 'grid';
    const [r, g, b] = this.accentRgb;

    ctx.clearRect(0, 0, this.width, this.height);

    if (mode === 'grid') {
      this.renderStudioGrid(ctx, r, g, b);
    } else if (mode === 'matrix') {
      this.renderTelemetry(ctx, r, g, b);
    } else if (mode === 'mesh') {
      this.renderSubtleMesh(ctx, r, g, b);
    }
    // 'minimal' stays pure clear canvas
  },

  renderStudioGrid(ctx, r, g, b) {
    const spacing = 32;
    const dotSize = 1;

    ctx.fillStyle = `rgba(255, 255, 255, 0.045)`;

    // Quiet, crisp dot-grid
    for (let x = 0; x < this.width; x += spacing) {
      for (let y = 0; y < this.height; y += spacing) {
        ctx.fillRect(x, y, dotSize, dotSize);
      }
    }

    // Subtle proximity highlight around cursor
    if (this.mouse.x > 0 && this.mouse.y > 0) {
      const radius = 120;
      const grad = ctx.createRadialGradient(
        this.mouse.x, this.mouse.y, 10,
        this.mouse.x, this.mouse.y, radius
      );
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.06)`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(this.mouse.x - radius, this.mouse.y - radius, radius * 2, radius * 2);
    }
  },

  renderSubtleMesh(ctx, r, g, b) {
    const maxDist = 110;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.height + 10;
      if (p.y > this.height + 10) p.y = -10;

      // Draw particle dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.baseAlpha})`;
      ctx.fill();

      // Connecting lines
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const ndx = p.x - p2.x;
        const ndy = p.y - p2.y;
        const nDist = Math.sqrt(ndx * ndx + ndy * ndy);

        if (nDist < maxDist) {
          const lineAlpha = (1 - nDist / maxDist) * 0.08;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${lineAlpha})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }
  },

  renderTelemetry(ctx, r, g, b) {
    ctx.font = `${this.matrixFontSize}px "JetBrains Mono", monospace`;
    const stepX = this.matrixFontSize * 1.6;

    for (let i = 0; i < this.matrixColumns.length; i++) {
      const col = this.matrixColumns[i];
      const char = this.matrixGlyphs[Math.floor(Math.random() * this.matrixGlyphs.length)];
      const x = i * stepX;
      const y = col.y;

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.12)`;
      ctx.fillText(char, x, y);

      col.y += col.speed * 2;
      if (col.y > this.height + 20 && Math.random() > 0.98) {
        col.y = -10;
      }
    }
  }
};

window.BackgroundEngine = BackgroundEngine;
// Backward compatibility alias
window.Background = BackgroundEngine;
