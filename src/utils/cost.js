// Token pricing in USD per million tokens
export const MODEL_PRICING = {
  'claude-sonnet-4-6': { input: 3.0,  output: 15.0  },
  'claude-opus-4-6':   { input: 15.0, output: 75.0  },
  'claude-haiku-4-5':  { input: 0.80, output: 4.0   },
  'gpt-4o':            { input: 2.50, output: 10.0  },
  'gpt-4o-mini':       { input: 0.15, output: 0.60  },
  'gemini-2.0-flash':  { input: 0.10, output: 0.40  },
  'deepseek-v3':       { input: 0.27, output: 1.10  },
};

const DEFAULT_PRICING = MODEL_PRICING['claude-sonnet-4-6'];

/**
 * Estimate USD cost from token counts + model name.
 */
export function estimateCost(tokensInput, tokensOutput, modelName) {
  let pricing = DEFAULT_PRICING;
  if (modelName) {
    const key = Object.keys(MODEL_PRICING).find(k => modelName.toLowerCase().includes(k));
    if (key) pricing = MODEL_PRICING[key];
  }
  return (tokensInput / 1_000_000) * pricing.input
       + (tokensOutput / 1_000_000) * pricing.output;
}

/**
 * Map cumulative USD spend to lobster fatness (0.6 = slim, 1.5 = very fat).
 * Scale: $0 → slim 0.6, $50 → fat 1.5（终身累计）.
 */
export function costToFatness(usdTotal) {
  return Math.min(1.5, Math.max(0.6, 0.6 + (usdTotal / 50) * 0.9));
}
