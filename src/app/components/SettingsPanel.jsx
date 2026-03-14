'use client';

import { useRef, useEffect } from 'react';
import { writingStyles } from '../../../styles.js';
import { GearIcon, ClaudeIcon, GPTIcon, MistralIcon} from './icons';

export default function SettingsPanel({ temperature, maxTokens, selectedModel, selectedStyle, onTemperatureChange, onMaxTokensChange, onModelChange, onStyleChange }) {
  
  return (
    <>
      <button
        className="fixed top-4 clean-bg border-none!important p-2 right-4"
        popoverTarget="popover-settings"
        style={{ anchorName: '--anchor-settings' }}
      >
        <GearIcon />
      </button>

      <ul
        className="dropdown px-2 foreground dropdown-end gap-4 menu w-64 rounded-box bg-base-100 shadow-sm"
        popover="auto"
        id="popover-settings"
        style={{ positionAnchor: '--anchor-settings' }}
      >
        <li className="flex flex-col gap-1 py-2">
          <div className="flex justify-between items-baseline">
            <label>Temperature</label>
            <span className="text-sm tabular-nums opacity-80">{temperature.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={temperature}
            onChange={(e) => onTemperatureChange(Number(e.target.value))}
            className="range range-xs"
          />
        </li>
        <li className="flex flex-col gap-1 py-2">
          <div className="flex justify-between items-baseline">
            <label>Max Tokens</label>
            <span className="text-sm tabular-nums opacity-80">{maxTokens}</span>
          </div>
          <input
            type="range"
            min={500}
            max={5000}
            step={100}
            value={maxTokens}
            onChange={(e) => onMaxTokensChange(Number(e.target.value))}
            className="range range-xs"
          />
        </li>
        <li className="flex flex-col gap-1 py-2">
          <select value={selectedModel} onChange={(e) => onModelChange(e.target.value)} className="select foreforeground select-sm">
            <option disabled={true}>Model</option>
            <option value="claude-sonnet">Claude Sonnet 4.6</option>
            <option value="gpt">GPT-5.3</option>
            <option value="mistral">Mistral Mini Creative</option>
          </select>
        </li>
        <li className="flex flex-col gap-1 py-2">
          <select value={selectedStyle} onChange={(e) => onStyleChange(e.target.value)} className="select foreforeground select-sm">
            <option disabled={true}>Style</option>
            {writingStyles.map((style) => (
              <option key={style.id} value={style.id}>
                {style.label}
              </option>
            ))}
          </select>
        </li>
      </ul>
    </>
  );
}
