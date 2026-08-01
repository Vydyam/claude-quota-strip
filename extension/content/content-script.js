// extension/content/content-script.js
// Bridge: receives page events → forwards to service worker + manages toolbar

// ── Toolbar ──────────────────────────────────────────────────────────────────

function pctColor(pct) {
  if (pct >= 80) return '#ef4444';
  if (pct >= 50) return '#f97316';
  return '#22c55e';
}

function formatReset(unixOrISO) {
  if (!unixOrISO) return '';
  const ms = typeof unixOrISO === 'number'
    ? unixOrISO * 1000
    : new Date(unixOrISO).getTime();
  const diff = ms - Date.now();
  if (diff <= 0) return 'resetting…';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function injectToolbar() {
  if (document.getElementById('ctt-toolbar')) return;

  // Inject CSS
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = chrome.runtime.getURL('content/toolbar.css');
  document.head.appendChild(style);

  // Inject toolbar HTML
  const bar = document.createElement('div');
  bar.id = 'ctt-toolbar';
  bar.innerHTML = `
    <span class="ctt-logo">⚡</span>
    <span class="ctt-divider"></span>

    <span class="ctt-pill">
      <span class="ctt-label">Session</span>
      <span class="ctt-value" id="ctt-session-val" style="color:#333">—</span>
      <span class="ctt-track">
        <span class="ctt-fill" id="ctt-session-bar" style="width:0%;background:#333"></span>
      </span>
      <span class="ctt-reset" id="ctt-session-reset"></span>
    </span>

    <span class="ctt-divider"></span>

    <span class="ctt-pill">
      <span class="ctt-label">Weekly</span>
      <span class="ctt-value" id="ctt-weekly-val" style="color:#333">—</span>
      <span class="ctt-track">
        <span class="ctt-fill" id="ctt-weekly-bar" style="width:0%;background:#333"></span>
      </span>
      <span class="ctt-reset" id="ctt-weekly-reset"></span>
    </span>

    <span class="ctt-divider"></span>
    <span class="ctt-turns" id="ctt-turns">0 turns</span>

    <span class="ctt-spacer"></span>
    <span class="ctt-model" id="ctt-model">—</span>
  `;

  document.body.prepend(bar);

  // Push claude.ai content down so toolbar doesn't overlap
  document.body.style.marginTop = '30px';
}

function updateToolbar(session) {
  const sp = session.sessionPercent ?? 0;
  const wp = session.weeklyPercent ?? 0;

  const el = (id) => document.getElementById(id);

  if (!el('ctt-session-val')) return;

  el('ctt-session-val').textContent = `${sp}%`;
  el('ctt-session-val').style.color = pctColor(sp);
  el('ctt-session-bar').style.width = `${Math.min(sp, 100)}%`;
  el('ctt-session-bar').style.background = pctColor(sp);
  el('ctt-session-reset').textContent = formatReset(session.sessionResetsAt)
    ? `· resets ${formatReset(session.sessionResetsAt)}` : '';

  el('ctt-weekly-val').textContent = `${wp}%`;
  el('ctt-weekly-val').style.color = pctColor(wp);
  el('ctt-weekly-bar').style.width = `${Math.min(wp, 100)}%`;
  el('ctt-weekly-bar').style.background = pctColor(wp);
  el('ctt-weekly-reset').textContent = formatReset(session.weeklyResetsAt)
    ? `· resets ${formatReset(session.weeklyResetsAt)}` : '';

  el('ctt-turns').textContent = `${session.turns} turn${session.turns !== 1 ? 's' : ''}`;
  el('ctt-model').textContent = session.model || '—';
}

// ── Init ─────────────────────────────────────────────────────────────────────

// Inject toolbar once DOM is ready
if (document.body) {
  injectToolbar();
} else {
  document.addEventListener('DOMContentLoaded', injectToolbar);
}

// Load last known session on page load
chrome.runtime.sendMessage({ type: 'GET_SESSIONS' }, (sessions) => {
  if (!sessions) return;
  const entries = Object.values(sessions).sort((a, b) => b.lastUpdated - a.lastUpdated);
  if (entries.length > 0) updateToolbar(entries[0]);
});

// ── Event bridge ─────────────────────────────────────────────────────────────

window.addEventListener('__ctt_usage', (e) => {
  console.log('[CTT] Usage received from injector:', e.detail);

  chrome.runtime.sendMessage({ type: 'TOKEN_USAGE', payload: e.detail }, (session) => {
    if (session) updateToolbar(session);
  });
});

console.log('[CTT] Content script bridge active');