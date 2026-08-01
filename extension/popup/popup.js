// extension/popup/popup.js

function pctColor(pct) {
  if (pct >= 80) return '#ef4444';
  if (pct >= 50) return '#f97316';
  return '#22c55e';
}

function formatReset(unixOrISO) {
  if (!unixOrISO) return '—';
  const ms = typeof unixOrISO === 'number'
    ? unixOrISO * 1000
    : new Date(unixOrISO).getTime();
  const diff = ms - Date.now();
  if (diff <= 0) return 'resetting…';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function usageBar(pct) {
  const color = pctColor(pct);
  return `
    <div class="progress-track">
      <div class="progress-fill" style="width:${Math.min(pct,100)}%;background:${color}"></div>
    </div>
  `;
}

function renderSessions(sessions) {
  const list = document.getElementById('sessions-list');
  const noData = document.getElementById('no-data');
  const footerStat = document.getElementById('footer-stat');

  const entries = Object.values(sessions)
    .sort((a, b) => b.lastUpdated - a.lastUpdated);

  if (entries.length === 0) {
    noData.style.display = 'block';
    list.innerHTML = '';
    footerStat.innerHTML = '—';
    return;
  }

  noData.style.display = 'none';

  const latest = entries[0];
  footerStat.innerHTML = `
    <strong style="color:${pctColor(latest.sessionPercent||0)}">
      ${latest.sessionPercent ?? '—'}%
    </strong> session · 
    <strong style="color:${pctColor(latest.weeklyPercent||0)}">
      ${latest.weeklyPercent ?? '—'}%
    </strong> weekly
  `;

  list.innerHTML = entries.map(s => {
    const sp = s.sessionPercent ?? 0;
    const wp = s.weeklyPercent ?? 0;
    return `
    <div class="session-card">
      <div class="session-meta">
        <span class="session-id">${s.id.slice(0,8)}…</span>
        <span class="session-model">${s.model || 'unknown'}</span>
      </div>

      <div class="usage-bars">
        <div class="usage-row">
          <div class="usage-label-row">
            <span class="usage-label">Session</span>
            <span class="usage-value" style="color:${pctColor(sp)}">${sp}%</span>
          </div>
          ${usageBar(sp)}
          <div class="usage-reset">Resets in ${formatReset(s.sessionResetsAt)}</div>
        </div>

        <div class="divider"></div>

        <div class="usage-row">
          <div class="usage-label-row">
            <span class="usage-label">Weekly</span>
            <span class="usage-value" style="color:${pctColor(wp)}">${wp}%</span>
          </div>
          ${usageBar(wp)}
          <div class="usage-reset">Resets in ${formatReset(s.weeklyResetsAt)}</div>
        </div>
      </div>

      <div class="turns-row">
        <span class="badge"><span>${s.turns}</span> turn${s.turns !== 1 ? 's' : ''}</span>
        <span class="badge">${timeAgo(s.lastUpdated)}</span>
      </div>
    </div>
  `}).join('');
}

// Load on open
chrome.runtime.sendMessage({ type: 'GET_SESSIONS' }, (sessions) => {
  renderSessions(sessions || {});
});

// Live updates
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SESSION_UPDATED') {
    chrome.runtime.sendMessage({ type: 'GET_SESSIONS' }, (sessions) => {
      renderSessions(sessions || {});
    });
  }
});

// Clear
document.getElementById('btn-clear').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'CLEAR_SESSIONS' }, () => renderSessions({}));
});