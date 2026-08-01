// extension/content/injector.js
// Runs in MAIN world — has direct access to page's fetch before claude.ai loads

(function() {
  'use strict';

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const response = await nativeFetch.apply(this, args);

    if (url.includes('/completion')) {
      interceptCompletion(response.clone(), url);
    }
    return response;
  };

  async function interceptCompletion(response, url) {
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

            if (json.type === 'message_start' && json.message?.model) {
              window.__ctt_model = json.message.model;
            }

            if (json.type === 'message_limit' && json.message_limit) {
              const limit = json.message_limit;
              const sessionId = (url.match(/\/chat_conversations\/([a-zA-Z0-9\-]+)/) || [])[1]
                || (location.pathname.match(/\/chat\/([a-zA-Z0-9\-]+)/) || [])[1]
                || 'unknown';

              console.log('[CTT] resolved percent:', limit.resolved?.limit?.percent);
              console.log('[CTT] 5h utilization*100:', Math.round(limit.windows?.['5h']?.utilization * 100));
              console.log('[CTT] 7d utilization*100:', Math.round(limit.windows?.['7d']?.utilization * 100));

              window.dispatchEvent(new CustomEvent('__ctt_usage', {
                detail: {
                  sessionId,
                  model: window.__ctt_model || 'claude-sonnet-4-6',
                  timestamp: Date.now(),
                  sessionPercent: limit.resolved?.limit?.percent
                    ?? (limit.windows?.['5h']
                      ? Math.round(limit.windows['5h'].utilization * 100)
                      : 0),
                  sessionResetsAt: limit.windows?.['5h']?.resets_at
                    || limit.resolved?.limit?.resets_at,
                  sessionStatus: limit.windows?.['5h']?.status || 'unknown',
                  weeklyPercent: limit.windows?.['7d']
                    ? Math.round(limit.windows['7d'].utilization * 100)
                    : 0,
                  weeklyResetsAt: limit.windows?.['7d']?.resets_at,
                }
              }));
            }
          } catch(_) {}
        }
      }
    } catch(e) {}
  }

  console.log('[CTT] Injector active in MAIN world');
})();