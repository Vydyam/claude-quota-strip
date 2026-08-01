const STORAGE_KEY = 'ctt_sessions';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'TOKEN_USAGE') {
    handleUsage(msg.payload, sendResponse);
    return true;
  }
  if (msg.type === 'GET_SESSIONS') {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      sendResponse(result[STORAGE_KEY] || {});
    });
    return true;
  }
  if (msg.type === 'CLEAR_SESSIONS') {
    chrome.storage.local.remove(STORAGE_KEY, () => sendResponse({ ok: true }));
    return true;
  }
});

function handleUsage(payload, sendResponse) {
  const { sessionId, model, timestamp, sessionPercent,
          sessionResetsAt, weeklyPercent, weeklyResetsAt } = payload;

  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const sessions = result[STORAGE_KEY] || {};

    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        id: sessionId,
        startedAt: timestamp,
        turns: 0,
        model,
        history: [],
      };
    }

    const s = sessions[sessionId];
    s.turns += 1;
    s.lastUpdated = timestamp;
    s.model = model || s.model;
    s.sessionPercent = sessionPercent;
    s.sessionResetsAt = sessionResetsAt;
    s.weeklyPercent = weeklyPercent;
    s.weeklyResetsAt = weeklyResetsAt;
    s.history.push({ sessionPercent, weeklyPercent, timestamp });

    chrome.storage.local.set({ [STORAGE_KEY]: sessions }, () => {
      // Return session to content script for toolbar update
      sendResponse(s);
      // Also notify popup if open
      chrome.runtime.sendMessage({ type: 'SESSION_UPDATED', session: s }).catch(() => {});
    });
  });
}

const PRICING = {
  'claude-opus-4-5':   { input: 15.00, output: 75.00 },
  'claude-sonnet-4-6': { input: 3.00,  output: 15.00 },
  'claude-haiku-4-5':  { input: 0.80,  output: 4.00  },
  'default':           { input: 3.00,  output: 15.00  },
};