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
  if (diff <= 0) return 'now';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function buildToolbarHTML() {
  return `
    <div id="ctt-toolbar">
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
      <a class="ctt-btn ctt-btn-star"
         href="https://github.com/Vydyam/claude-token-tracker"
         target="_blank"
         title="Star on GitHub">
        ⭐ Star
      </a>
      <span class="ctt-divider"></span>
      <a class="ctt-btn ctt-btn-bug"
         href="https://github.com/Vydyam/claude-token-tracker/issues/new?template=bug_report.md"
         target="_blank"
         title="Report a bug">
        🐛 Bug
      </a>
    </div>
  `;
}

// Find claude.ai's input container and inject toolbar just above it
function findInputArea() {
  const fieldset = document.querySelector('fieldset');
  if (fieldset) return fieldset;
  return null;
}

function injectToolbar() {
  if (document.getElementById('ctt-toolbar')) return false;

  const fieldset = findInputArea();
  if (!fieldset) {
    console.log('[CTT] fieldset not found yet, retrying...');
    return false;
  }

  // Remove grandparent's top padding that creates the gap
  fieldset.parentElement.style.paddingTop = '0';
  fieldset.parentElement.style.gap = '0';
  fieldset.parentElement.parentElement.style.paddingTop = '0';

  const wrapper = document.createElement('div');
  wrapper.innerHTML = buildToolbarHTML();
  const toolbar = wrapper.firstElementChild;

  // Insert directly before the fieldset
  fieldset.parentElement.insertBefore(toolbar, fieldset);
  console.log('[CTT] Toolbar injected above fieldset');
  return true;
}

// Keep trying until the input area appears (claude.ai loads dynamically)
function tryInjectToolbar() {
  if (injectToolbar()) return;

  const observer = new MutationObserver(() => {
    if (injectToolbar()) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Watch for theme changes on <html> element
const themeObserver = new MutationObserver(() => {
  const toolbar = document.getElementById('ctt-toolbar');
  if (!toolbar) return;
  const isLight = document.documentElement.classList.contains('light')
    || document.documentElement.getAttribute('data-theme') === 'light'
    || window.matchMedia('(prefers-color-scheme: light)').matches;

  toolbar.setAttribute('data-theme', isLight ? 'light' : 'dark');
});

themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['class', 'data-theme']
});

// Also listen for system theme changes
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
  const toolbar = document.getElementById('ctt-toolbar');
  if (toolbar) toolbar.setAttribute('data-theme', e.matches ? 'light' : 'dark');
});

function updateToolbar(session) {
  const sp = session.sessionPercent ?? 0;
  const wp = session.weeklyPercent ?? 0;
  console.log('[CTT] updateToolbar:', sp, wp, pctColor(sp), pctColor(wp));
  const el = (id) => document.getElementById(id);
  if (!el('ctt-session-val')) return;

  el('ctt-session-val').textContent = `${sp}%`;
  el('ctt-session-val').style.color = pctColor(sp);
  el('ctt-session-bar').style.width = `${Math.min(sp, 100)}%`;
  el('ctt-session-bar').style.background = pctColor(sp);
  el('ctt-session-reset').textContent = formatReset(session.sessionResetsAt)
    ? `${formatReset(session.sessionResetsAt)}` : '';

  el('ctt-weekly-val').textContent = `${wp}%`;
  el('ctt-weekly-val').style.color = pctColor(wp);
  el('ctt-weekly-bar').style.width = `${Math.min(wp, 100)}%`;
  el('ctt-weekly-bar').style.background = pctColor(wp);
  el('ctt-weekly-reset').textContent = formatReset(session.weeklyResetsAt)
    ? `${formatReset(session.weeklyResetsAt)}` : '';

  el('ctt-turns').textContent = `${session.turns} turn${session.turns !== 1 ? 's' : ''}`;
  //el('ctt-model').textContent = session.model || '—';
}

// ── Init ─────────────────────────────────────────────────────────────────────

tryInjectToolbar();

// Restore toolbar if claude.ai re-renders the DOM
const reinjector = new MutationObserver(() => {
  if (!document.getElementById('ctt-toolbar')) {
    injectToolbar();
  }
});
reinjector.observe(document.body, { childList: true, subtree: true });

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