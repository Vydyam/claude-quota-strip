const STORAGE_KEY = 'ctt_sessions';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'TOKEN_USAGE') {
    handleUsage(msg.payload);
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

function handleUsage(payload) {
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
    s.model = model;
    s.sessionPercent = sessionPercent;
    s.sessionResetsAt = sessionResetsAt;
    s.weeklyPercent = weeklyPercent;
    s.weeklyResetsAt = weeklyResetsAt;
    s.history.push({ sessionPercent, weeklyPercent, timestamp });

    chrome.storage.local.set({ [STORAGE_KEY]: sessions }, () => {
      chrome.runtime.sendMessage({
        type: 'SESSION_UPDATED',
        session: s
      }).catch(() => {});
    });
  });
}