// extension/popup/popup.js

function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

function formatCost(usd) {
  return usd < 0.01 ? `$${usd.toFixed(4)}` : `$${usd.toFixed(3)}`;
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function renderSessions(sessions) {
  const list = document.getElementById('sessions-list');
  const noData = document.getElementById('no-data');
  const totalCostEl = document.getElementById('total-cost');

  const entries = Object.values(sessions).sort((a, b) => b.lastUpdated - a.lastUpdated);

  if (entries.length === 0) {
    noData.style.display = 'block';
    list.innerHTML = '';
    totalCostEl.textContent = 'Total: $0.0000';
    return;
  }

  noData.style.display = 'none';

  const totalCost = entries.reduce((sum, s) => sum + (s.estimatedCostUSD || 0), 0);
  totalCostEl.textContent = `Total: ${formatCost(totalCost)}`;

  list.innerHTML = entries.map(s => `
    <div class="session-card">
      <div class="session-id">
        Session: ${s.id.slice(0, 8)}…
        <span style="float:right; color:#333">${timeAgo(s.lastUpdated)}</span>
      </div>
      <div class="metrics">
        <div class="metric highlight">
          <div class="label">Input Tokens</div>
          <div class="value">${formatNumber(s.totalInputTokens)}</div>
        </div>
        <div class="metric">
          <div class="label">Output Tokens</div>
          <div class="value">${formatNumber(s.totalOutputTokens)}</div>
        </div>
        <div class="metric">
          <div class="label">Total Tokens</div>
          <div class="value">${formatNumber(s.totalInputTokens + s.totalOutputTokens)}</div>
        </div>
        <div class="metric cost">
          <div class="label">Est. Cost</div>
          <div class="value">${formatCost(s.estimatedCostUSD || 0)}</div>
        </div>
      </div>
      <span class="turns-badge">${s.turns} turn${s.turns !== 1 ? 's' : ''} · ${s.model}</span>
    </div>
  `).join('');
}

// Load sessions on open
chrome.runtime.sendMessage({ type: 'GET_SESSIONS' }, (sessions) => {
  renderSessions(sessions || {});
});

// Live updates while popup is open
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SESSION_UPDATED') {
    chrome.runtime.sendMessage({ type: 'GET_SESSIONS' }, (sessions) => {
      renderSessions(sessions || {});
    });
  }
});

// Clear button
document.getElementById('btn-clear').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'CLEAR_SESSIONS' }, () => {
    renderSessions({});
  });
});