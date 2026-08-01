// extension/content/content-script.js
// Runs in ISOLATED world — bridges page events to chrome.runtime

window.addEventListener('__ctt_usage', (e) => {
  console.log('[CTT] Usage received from injector:', e.detail);
  chrome.runtime.sendMessage({
    type: 'TOKEN_USAGE',
    payload: e.detail,
  });
});

console.log('[CTT] Content script bridge active');