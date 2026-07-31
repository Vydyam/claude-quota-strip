// src/tracker.js
// Core token aggregation logic

export const PRICING = {
  'claude-opus-4-5':    { input: 15.00, output: 75.00 },
  'claude-sonnet-4-5':  { input: 3.00,  output: 15.00 },
  'claude-haiku-4-5':   { input: 0.80,  output: 4.00  },
  'default':            { input: 3.00,  output: 15.00  },
};

export function createSession(sessionId, timestamp) {
  return {
    id: sessionId,
    startedAt: timestamp,
    lastUpdated: timestamp,
    turns: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    estimatedCostUSD: 0,
    model: 'default',
    history: [],
  };
}

export function updateSession(session, { input_tokens, output_tokens, model, timestamp }) {
  const resolvedModel = model || session.model || 'default';
  const pricing = PRICING[resolvedModel] || PRICING['default'];

  const turnCost =
    (input_tokens / 1_000_000) * pricing.input +
    (output_tokens / 1_000_000) * pricing.output;

  session.turns += 1;
  session.totalInputTokens += input_tokens;
  session.totalOutputTokens += output_tokens;
  session.estimatedCostUSD += turnCost;
  session.model = resolvedModel;
  session.lastUpdated = timestamp;
  session.history.push({ input_tokens, output_tokens, turnCost, timestamp });

  return session;
}

export function formatCost(usd) {
  return usd < 0.01 ? `$${usd.toFixed(4)}` : `$${usd.toFixed(3)}`;
}

export function totalTokens(session) {
  return session.totalInputTokens + session.totalOutputTokens;
}