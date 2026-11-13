/**
 * SecurePass - Security Posture Audit & Threat Telemetry Module
 */

const AuditModule = {
  init() {
    this.subscribeToStore();
  },

  subscribeToStore() {
    Store.subscribe('audit', (auditState) => {
      this.renderAudit(auditState);
    });
  },

  async loadAudit() {
    if (!Store.getState('auth').isUnlocked) return;
    const res = await API.getAudit();
    if (res.success) {
      Store.dispatch('SET_AUDIT_DATA', {
        overallHealth: res.overall_health,
        counts: res.counts,
        duplicatedGroups: res.duplicated_groups,
        credentials: res.credentials
      });
    } else {
      UI.toast(res.error || 'Failed to compile security audit.', 'error');
    }
  },

  renderAudit(data) {
    const healthNum = document.getElementById('audit-health-score');
    const healthBar = document.getElementById('audit-health-bar');
    const healthStatusText = document.getElementById('audit-health-status-text');

    if (healthNum) healthNum.textContent = `${data.overallHealth}%`;

    if (healthBar) {
      healthBar.style.width = `${data.overallHealth}%`;
      if (data.overallHealth >= 80) healthBar.style.backgroundColor = 'var(--accent-emerald)';
      else if (data.overallHealth >= 55) healthBar.style.backgroundColor = 'var(--accent-amber)';
      else healthBar.style.backgroundColor = 'var(--accent-rose)';
    }

    if (healthStatusText) {
      if (data.overallHealth >= 80) {
        healthStatusText.innerHTML = '<span style="color: var(--accent-emerald);">Optimal Security Posture</span>';
      } else if (data.overallHealth >= 55) {
        healthStatusText.innerHTML = '<span style="color: var(--accent-amber);">Elevated Risk Profile</span>';
      } else {
        healthStatusText.innerHTML = '<span style="color: var(--accent-rose);">Critical Vulnerabilities Detected</span>';
      }
    }

    // Counts
    const counts = data.counts || {};
    const setStat = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val ?? 0;
    };

    setStat('audit-stat-total', data.credentials ? data.credentials.length : 0);
    setStat('audit-stat-strong', counts.strong);
    setStat('audit-stat-moderate', counts.moderate);
    setStat('audit-stat-weak', counts.weak);
    setStat('audit-stat-reused', counts.reused);
    setStat('audit-stat-compromised', counts.compromised);

    // Reused Passwords Breakdown
    const duplicateContainer = document.getElementById('audit-duplicates-list');
    if (duplicateContainer) {
      if (!data.duplicatedGroups || data.duplicatedGroups.length === 0) {
        duplicateContainer.innerHTML = `
          <div style="color: var(--accent-emerald); font-size: 0.875rem; padding: 12px; background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 6px;">
            <i class="fas fa-check-circle"></i> Zero password reuse detected across vault accounts.
          </div>
        `;
      } else {
        let html = '';
        data.duplicatedGroups.forEach(group => {
          html += `
            <div style="background: rgba(244, 63, 94, 0.08); border: 1px solid rgba(244, 63, 94, 0.25); border-radius: 8px; padding: 14px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: 600; color: var(--accent-rose); font-size: 0.875rem;">
                  <i class="fas fa-triangle-exclamation"></i> Reused Secret: Shared by ${group.occurrences} accounts
                </span>
                <span class="badge badge-rose">${group.occurrences} Accounts</span>
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${group.accounts.map(acc => `<span class="badge badge-slate" style="font-family: var(--font-mono);">${UI.escape(acc)}</span>`).join('')}
              </div>
            </div>
          `;
        });
        duplicateContainer.innerHTML = html;
      }
    }

    // Security Inventory Table
    const tbody = document.getElementById('audit-table-body');
    if (tbody) {
      tbody.innerHTML = '';
      if (!data.credentials || data.credentials.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">No credentials available to audit.</td></tr>`;
      } else {
        data.credentials.forEach(entry => {
          const tr = document.createElement('tr');
          let badgeClass = 'badge-slate';
          if (entry.strength_score >= 80) badgeClass = 'badge-emerald';
          else if (entry.strength_score >= 50) badgeClass = 'badge-amber';
          else badgeClass = 'badge-rose';

          tr.innerHTML = `
            <td style="font-weight: 600; color: var(--text-primary);">${UI.escape(entry.service)}</td>
            <td style="font-family: var(--font-mono);">${UI.escape(entry.username)}</td>
            <td><span class="badge badge-slate">${UI.escape(entry.category || 'General')}</span></td>
            <td><span class="badge ${badgeClass}">${UI.escape(entry.strength_tier || 'Analyzed')}</span></td>
            <td style="font-family: var(--font-mono); font-weight: 600;">${entry.strength_score}/100</td>
          `;
          tbody.appendChild(tr);
        });
      }
    }
  }
};

window.AuditModule = AuditModule;

// Backward-compatibility wrapper for window.Audit
window.Audit = {
  loadAudit: () => AuditModule.loadAudit(),
  renderAudit: (data) => AuditModule.renderAudit(data)
};
