import { useState } from 'react';
import './CostEstimator.css';

// Prices in USD per million tokens
const MODELS = [
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', inputPMT: 3.0,  outputPMT: 15.0  },
  { id: 'claude-opus-4-6',   name: 'Claude Opus 4.6',   inputPMT: 15.0, outputPMT: 75.0  },
  { id: 'claude-haiku-4-5',  name: 'Claude Haiku 4.5',  inputPMT: 0.80, outputPMT: 4.0   },
  { id: 'gpt-4o',            name: 'GPT-4o',             inputPMT: 2.50, outputPMT: 10.0  },
  { id: 'gpt-4o-mini',       name: 'GPT-4o-mini',        inputPMT: 0.15, outputPMT: 0.60  },
  { id: 'gemini-2.0-flash',  name: 'Gemini 2.0 Flash',   inputPMT: 0.10, outputPMT: 0.40  },
  { id: 'deepseek-v3',       name: 'DeepSeek V3',        inputPMT: 0.27, outputPMT: 1.10  },
];

function calcCost(inputTokens, outputTokens, model) {
  return (inputTokens / 1_000_000) * model.inputPMT
       + (outputTokens / 1_000_000) * model.outputPMT;
}

function fmtCost(usd) {
  if (usd < 0.001) return '<$0.001';
  if (usd < 1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

// Equivalent daily cost comparisons (USD)
const COMPARISONS = [
  { label: '一杯奶茶', usd: 4.5 },
  { label: '麦当劳午饭', usd: 6.5 },
  { label: '外卖晚餐', usd: 12 },
  { label: 'Netflix 月费', usd: 15.49 },
  { label: '一次打车', usd: 18 },
];

export default function CostEstimator({ tokensInput, tokensOutput, detectedModel }) {
  const defaultModel = MODELS.find(m => detectedModel && detectedModel.includes(m.id.split('-')[1]))
    || MODELS[0];
  const [selectedId, setSelectedId] = useState(defaultModel.id);
  const model = MODELS.find(m => m.id === selectedId) || MODELS[0];
  const cost = calcCost(tokensInput, tokensOutput, model);

  const comparison = COMPARISONS.find(c => cost <= c.usd * 0.1) || COMPARISONS[COMPARISONS.length - 1];

  return (
    <div className="cost-estimator">
      <div className="ce-header">
        <span className="ce-title">💰 今日账单</span>
        <select
          className="ce-model-select"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          {MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="ce-cost">
        <span className="ce-amount">{fmtCost(cost)}</span>
        <span className="ce-usd">USD</span>
      </div>

      <div className="ce-breakdown">
        <div className="ce-row">
          <span>Input  {(tokensInput / 1000).toFixed(1)}K</span>
          <span>{fmtCost((tokensInput / 1_000_000) * model.inputPMT)}</span>
        </div>
        <div className="ce-row">
          <span>Output {(tokensOutput / 1000).toFixed(1)}K</span>
          <span>{fmtCost((tokensOutput / 1_000_000) * model.outputPMT)}</span>
        </div>
      </div>

      {cost > 0 && (
        <div className="ce-compare">
          龙虾今天花了 {fmtCost(cost)}，
          {cost < 0.01 ? '几乎免费 ✨' : `相当于${comparison.label}的 ${Math.round((cost / comparison.usd) * 100)}%`}
        </div>
      )}
    </div>
  );
}
