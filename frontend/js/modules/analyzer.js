/**
 * SecurePass - Real-Time Cryptographic Strength Analyzer Module
 * Entropy calculation, search-space computation, and adversary crack matrix
 */

const AnalyzerModule = {
  init() {
    this.bindEvents();
    this.subscribeToStore();
  },

  bindEvents() {
    const input = document.getElementById('analyzer-password-input');
    if (input) {
      input.addEventListener('input', UI.debounce((e) => {
        this.analyze(e.target.value);
      }, 120));
    }
  },

  subscribeToStore() {
    Store.subscribe('analyzer', (analyzerState) => {
      this.renderAnalysis(analyzerState);
    });
  },

  async analyze(password) {
    if (!password) {
      Store.setState('analyzer', {
        input: '',
        score: 0,
        entropy: 0,
        tier: 'Awaiting Input',
        crackTimes: null,
        breakdown: null,
        issues: ['Enter a password to inspect potential flaws.'],
        good: []
      });
      return;
    }

    const data = await API.analyzePassword(password);
    Store.setState('analyzer', {
      input: password,
      score: data.score,
      entropy: data.entropy,
      tier: data.tier,
      crackTimes: data.crack_times,
      breakdown: data.breakdown,
      issues: data.issues || [],
      good: data.good || []
    });
  },

  renderAnalysis(data) {
    const scoreNum = document.getElementById('analyzer-score-num');
    const scoreBar = document.getElementById('analyzer-score-bar');
    const entropyVal = document.getElementById('analyzer-entropy-val');
    const searchSpaceVal = document.getElementById('analyzer-search-space-val');
    const tierBadge = document.getElementById('analyzer-tier-badge');

    // Score & Gauge
    if (scoreNum) scoreNum.textContent = `${data.score}/100`;
    if (scoreBar) {
      scoreBar.style.width = `${data.score}%`;
      if (data.score >= 80) scoreBar.style.backgroundColor = 'var(--accent-emerald)';
      else if (data.score >= 50) scoreBar.style.backgroundColor = 'var(--accent-amber)';
      else scoreBar.style.backgroundColor = 'var(--accent-rose)';
    }

    // Entropy & Search Space
    if (entropyVal) entropyVal.textContent = `${data.entropy} bits`;
    if (searchSpaceVal) searchSpaceVal.textContent = data.breakdown ? `${data.breakdown.charset_size ** data.breakdown.length}` : '0';

    // Tier badge
    if (tierBadge) {
      tierBadge.textContent = data.tier || 'Awaiting Input';
      tierBadge.className = 'badge';
      if (data.score >= 80) tierBadge.classList.add('badge-emerald');
      else if (data.score >= 50) tierBadge.classList.add('badge-amber');
      else if (data.score > 0) tierBadge.classList.add('badge-rose');
      else tierBadge.classList.add('badge-slate');
    }

    // Diversity chips
    const bd = data.breakdown || {};
    this.updateChip('chip-len-16', bd.length >= 16);
    this.updateChip('chip-len-12', bd.length >= 12);
    this.updateChip('chip-lower', bd.has_lower);
    this.updateChip('chip-upper', bd.has_upper);
    this.updateChip('chip-digit', bd.has_digits);
    this.updateChip('chip-symbol', bd.has_symbols);

    // Adversary Crack-Time Matrix
    const ct = data.crackTimes || {
      online_throttled: 'Instant',
      online_unthrottled: 'Instant',
      offline_gpu: 'Instant',
      supercomputer: 'Instant'
    };

    const setMatrixCard = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setMatrixCard('crack-online-throttled', ct.online_throttled);
    setMatrixCard('crack-online-unthrottled', ct.online_unthrottled);
    setMatrixCard('crack-offline-gpu', ct.offline_gpu);
    setMatrixCard('crack-supercomputer', ct.supercomputer);

    // Vulnerabilities & Strengths list
    const issuesContainer = document.getElementById('analyzer-issues-list');
    if (issuesContainer) {
      if (data.issues.length === 0) {
        issuesContainer.innerHTML = '<span style="color: var(--accent-emerald); font-size: 0.825rem;"><i class="fas fa-check-circle"></i> No critical vulnerabilities detected.</span>';
      } else {
        issuesContainer.innerHTML = data.issues.map(iss => `
          <div style="color: var(--accent-rose); font-size: 0.8rem; margin-bottom: 6px; display: flex; align-items: flex-start; gap: 6px;">
            <i class="fas fa-circle-exclamation" style="margin-top: 2px;"></i>
            <span>${UI.escape(iss)}</span>
          </div>
        `).join('');
      }
    }

    const strengthsContainer = document.getElementById('analyzer-strengths-list');
    if (strengthsContainer) {
      if (data.good.length === 0) {
        strengthsContainer.innerHTML = '<span style="color: var(--text-muted); font-size: 0.825rem;">Enter a password to inspect positive traits.</span>';
      } else {
        strengthsContainer.innerHTML = data.good.map(g => `
          <div style="color: var(--accent-emerald); font-size: 0.8rem; margin-bottom: 6px; display: flex; align-items: flex-start; gap: 6px;">
            <i class="fas fa-circle-check" style="margin-top: 2px;"></i>
            <span>${UI.escape(g)}</span>
          </div>
        `).join('');
      }
    }
  },

  updateChip(chipId, isPassed) {
    const chip = document.getElementById(chipId);
    if (!chip) return;
    const label = chip.getAttribute('data-label') || '';
    if (isPassed) {
      chip.className = 'check-chip passed';
      chip.innerHTML = `<i class="fas fa-check"></i> ${label}`;
    } else {
      chip.className = 'check-chip failed';
      chip.innerHTML = `<i class="fas fa-times"></i> ${label}`;
    }
  }
};

window.AnalyzerModule = AnalyzerModule;

// Backward-compatibility wrapper for window.Analyzer
window.Analyzer = {
  init: () => AnalyzerModule.init(),
  analyze: (pwd) => AnalyzerModule.analyze(pwd)
};
