// extension/background/service-worker.js
// Central coordinator — receives usage events, persists sessions, notifies popup

const STORAGE_KEY = 'ctt_sessions';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'TOKEN_USAGE') {
    handleTokenUsage(msg.payload);
  }
  if (msg.type === 'GET_SESSIONS') {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      sendResponse(result[STORAGE_KEY] || {});
    });
    return true; // keep channel open for async response
  }
  if (msg.type === 'CLEAR_SESSIONS') {
    chrome.storage.local.remove(STORAGE_KEY, () => sendResponse({ ok: true }));
    return true;
  }
});

async function handleTokenUsage({ sessionId, input_tokens, output_tokens, model, timestamp }) {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const sessions = result[STORAGE_KEY] || {};

    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        id: sessionId,
        startedAt: timestamp,
        turns: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        estimatedCostUSD: 0,
        model: model || 'default',
        history: [],
      };
    }

    const s = sessions[sessionId];
    const pricing = PRICING[model] || PRICING['default'];
    const turnCost =
      (input_tokens / 1_000_000) * pricing.input +
      (output_tokens / 1_000_000) * pricing.output;

    s.turns += 1;
    s.totalInputTokens += input_tokens;
    s.totalOutputTokens += output_tokens;
    s.estimatedCostUSD += turnCost;
    s.model = model || s.model;
    s.lastUpdated = timestamp;
    s.history.push({ input_tokens, output_tokens, turnCost, timestamp });

    chrome.storage.local.set({ [STORAGE_KEY]: sessions }, () => {
      // Notify popup if open
      chrome.runtime.sendMessage({ type: 'SESSION_UPDATED', session: s }).catch(() => {});
    });
  });
}

const PRICING = {
  'claude-opus-4-5':   { input: 15.00, output: 75.00 },
  'claude-sonnet-4-5': { input: 3.00,  output: 15.00 },
  'claude-haiku-4-5':  { input: 0.80,  output: 4.00  },
  'default':           { input: 3.00,  output: 15.00  },
};