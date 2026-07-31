// extension/content/content-script.js
// Injected into claude.ai — intercepts fetch to capture token usage

(function () {
  'use strict';

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

    // Only intercept Claude completion endpoints
    if (url.includes('/api/organizations') && url.includes('completion')) {
      parseStream(response.clone(), url);
    }

    return response;
  };

  async function parseStream(response, url) {
    try {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const json = JSON.parse(line.slice(6));

            // Capture token usage from stream events
            if (json.type === 'message_start' && json.message?.usage) {
              dispatchUsage(json.message.usage, json.message.model, url);
            }
            if (json.type === 'message_delta' && json.usage) {
              dispatchUsage(json.usage, null, url);
            }
          } catch (_) {}
        }
      }
    } catch (err) {
      console.warn('[CTT] Stream parse error:', err);
    }
  }

  function dispatchUsage(usage, model, url) {
    // Extract session ID from URL or pathname
    const sessionId = extractSessionId(url) || extractSessionId(window.location.pathname);

    window.dispatchEvent(new CustomEvent('ctt:usage', {
      detail: {
        input_tokens: usage.input_tokens || 0,
        output_tokens: usage.output_tokens || 0,
        model: model || null,
        sessionId: sessionId || 'unknown',
        timestamp: Date.now(),
      }
    }));
  }

  function extractSessionId(str) {
    // claude.ai URLs contain /chat/<uuid>
    const match = str?.match(/\/chat\/([a-zA-Z0-9\-]+)/);
    return match ? match[1] : null;
  }

  // Forward custom events to background service worker
  window.addEventListener('ctt:usage', (e) => {
    chrome.runtime.sendMessage({
      type: 'TOKEN_USAGE',
      payload: e.detail,
    });
  });

  console.log('[CTT] Claude Token Tracker active');
})();