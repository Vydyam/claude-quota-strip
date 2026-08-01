function formatResetTime(unixOrISO) {
  if (!unixOrISO) return '—';
  const ms = typeof unixOrISO === 'number' ? unixOrISO * 1000 : new Date(unixOrISO).getTime();
  const diff = ms - Date.now();
  if (diff <= 0) return 'resetting...';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h/24)}d`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function pctColor(pct) {
  if (pct >= 80) return '#ef4444';
  if (pct >= 50) return '#f97316';
  return '#22c55e';
}

function renderSessions(sessions) {
  const list = document.getElementById('sessions-list');
  const noData = document.getElementById('no-data');
  const totalCostEl = document.getElementById('total-cost');

  const entries = Object.values(sessions).sort((a, b) => b.lastUpdated - a.lastUpdated);

  if (entries.length === 0) {
    noData.style.display = 'block';
    list.innerHTML = '';
    totalCostEl.textContent = '';
    return;
  }

  noData.style.display = 'none';

  // Show latest session's usage in footer
  const latest = entries[0];
  totalCostEl.textContent = `Session: ${latest.sessionPercent ?? '—'}% · Weekly: ${latest.weeklyPercent ?? '—'}%`;

  list.innerHTML = entries.map(s => `
    <div class="session-card">
      <div class="session-id">
        ${s.id.slice(0, 8)}…
        <span style="float:right;color:#333">${s.model || ''}</span>
      </div>
      <div class="metrics">
        <div class="metric" style="border-color:${pctColor(s.sessionPercent||0)}22">
          <div class="label">Session Used</div>
          <div class="value" style="color:${pctColor(s.sessionPercent||0)}">
            ${s.sessionPercent ?? '—'}%
          </div>
          <div style="font-size:10px;color:#444;margin-top:2px">
            resets in ${formatResetTime(s.sessionResetsAt)}
          </div>
        </div>
        <div class="metric">
          <div class="label">Weekly Used</div>
          <div class="value" style="color:${pctColor(s.weeklyPercent||0)}">
            ${s.weeklyPercent ?? '—'}%
          </div>
          <div style="font-size:10px;color:#444;margin-top:2px">
            resets in ${formatResetTime(s.weeklyResetsAt)}
          </div>
        </div>
      </div>
      <span class="turns-badge">${s.turns} turn${s.turns !== 1 ? 's' : ''}</span>
    </div>
  `).join('');
}

chrome.runtime.sendMessage({ type: 'GET_SESSIONS' }, (sessions) => {
  renderSessions(sessions || {});
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SESSION_UPDATED') {
    chrome.runtime.sendMessage({ type: 'GET_SESSIONS' }, (sessions) => {
      renderSessions(sessions || {});
    });
  }
});

document.getElementById('btn-clear').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'CLEAR_SESSIONS' }, () => renderSessions({}));
});