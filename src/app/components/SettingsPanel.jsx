'use client';

import { useRef, useState, useEffect } from 'react';
import { GearIcon } from './icons';

const MODEL_OPTIONS = [
  { value: 'claude-sonnet', label: 'Claude Sonnet 4.6' },
  { value: 'gpt', label: 'GPT-5.3' },
  { value: 'mistral', label: 'Mistral Mini Creative' },
];

export default function SettingsPanel({ temperature, selectedModel, onTemperatureChange, onModelChange }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        className="clean-bg"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          padding: 0,
          color: open ? 'var(--text-primary)' : 'var(--text-muted)',
          transition: 'color 0.15s ease, opacity 0.15s ease',
          border: '1px solid var(--border-default)',
        }}
        title="Settings"
      >
        <GearIcon size={15} />
      </button>

      {open && (
        <div
          ref={panelRef}
          className="settings-card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '240px',
            padding: '1rem',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem',
          }}
        >
          {/* Temperature */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                Temperature
              </label>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--accent)',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.01em',
                }}
              >
                {temperature.toFixed(2)}
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={temperature}
                onChange={(e) => onTemperatureChange(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '3px',
                  appearance: 'none',
                  background: `linear-gradient(to right, var(--accent) ${temperature * 100}%, var(--border-default) ${temperature * 100}%)`,
                  borderRadius: '100px',
                  outline: 'none',
                  cursor: 'pointer',
                  border: 'none',
                  padding: 0,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Precise</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Creative</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '-0.1rem 0' }} />

          {/* Model */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label
              style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
              Model
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {MODEL_OPTIONS.map((opt) => {
                const isSelected = selectedModel === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onModelChange(opt.value)}
                    className="dropdown-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.45rem 0.6rem',
                      border: 'none',
                      background: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: isSelected ? 500 : 400,
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {opt.label}
                    </span>
                    {isSelected && (
                      <span
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: 'var(--accent)',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
