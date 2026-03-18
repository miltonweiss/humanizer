'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronUpIcon, CopyIcon, Chip, DotCircleIcon, LineBreakIcon, ListIcon, AllIcon } from './icons';

const AI_REWRITE_TYPES = [
  {
    id: 'light-rewrite',
    label: 'Rewrite',
    description: 'AI: clarity, readability & slight humanization',
    icon: Chip,
  },
];

const CODE_REWRITE_TYPES = [
  {
    id: 'clean',
    label: 'Whitespace Cleaner',
    description: 'Removes double spaces, weird unicode, fixes tabs & line breaks',
    icon: DotCircleIcon,
  },
  {
    id: 'linebreak',
    label: 'Line Break Fixer',
    description: 'Merges artificial line breaks, preserves real paragraphs',
    icon: LineBreakIcon,
  },
  {
    id: 'list',
    label: 'List Normalizer',
    description: 'Converts bullets to consistent format, fixes indentation',
    icon: ListIcon,
  },
  {
    id: 'all',
    label: 'All Formatting',
    description: 'Clean + Line Breaks + Lists in one pass',
    icon: AllIcon,
  },
];

const ALL_REWRITE_TYPES = [...AI_REWRITE_TYPES, ...CODE_REWRITE_TYPES];

export default function BottomBar({
  input,
  output,
  isLoading,
  copied,
  formId,
  onCopy,
  rewriteType,
  onRewriteTypeChange,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedRewrite = ALL_REWRITE_TYPES.find((t) => t.id === rewriteType) || ALL_REWRITE_TYPES[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  function selectType(type) {
    setDropdownOpen(false);
    onRewriteTypeChange?.(type.id);
  }

  const canSubmit = !!input?.trim() && !isLoading;
  const hasOutput = !!output?.trim();
  const SelectedIcon = selectedRewrite.icon;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 40,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          pointerEvents: 'all',
        }}
      >
        {/* Rewrite pill */}
        <div
          ref={dropdownRef}
          style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
        >
          {/* Dropdown above */}
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 10px)',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--foreground)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.3rem',
                minWidth: '240px',
                zIndex: 100,
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1px',
              }}
            >
              {AI_REWRITE_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = selectedRewrite.id === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => selectType(type)}
                    className="dropdown-item"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.55rem 0.75rem',
                      border: 'none',
                      background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ opacity: isActive ? 1 : 0.55, flexShrink: 0, color: isActive ? 'var(--accent)' : 'var(--text-primary)', display: 'flex', alignItems: 'center' }}><Icon /></span>
                    <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: isActive ? 500 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', letterSpacing: '-0.01em' }}>{type.label}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem', lineHeight: 1.3 }}>{type.description}</span>
                    </span>
                    {isActive && <span style={{ marginLeft: 'auto', width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
                  </button>
                );
              })}
              <div
                style={{
                  height: '1px',
                  background: 'var(--border-default)',
                  margin: '0.35rem 0.5rem',
                  flexShrink: 0,
                }}
              />
              {CODE_REWRITE_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = selectedRewrite.id === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => selectType(type)}
                    className="dropdown-item"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.55rem 0.75rem',
                      border: 'none',
                      background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ opacity: isActive ? 1 : 0.55, flexShrink: 0, color: isActive ? 'var(--accent)' : 'var(--text-primary)', display: 'flex', alignItems: 'center' }}><Icon /></span>
                    <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: isActive ? 500 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', letterSpacing: '-0.01em' }}>{type.label}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem', lineHeight: 1.3 }}>{type.description}</span>
                    </span>
                    {isActive && <span style={{ marginLeft: 'auto', width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Pill container */}
          <div
            className="toolbar-pill"
            style={{
              display: 'flex',
              alignItems: 'stretch',
              opacity: canSubmit ? 1 : 0.38,
              transition: 'opacity 0.2s ease',
            }}
          >
            {/* Main rewrite button */}
            <button
              type="submit"
              form={formId}
              disabled={!canSubmit}
              title={selectedRewrite.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1rem 0.55rem 1.1rem',
                border: 'none',
                background: 'transparent',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-pill) 0 0 var(--radius-pill)',
              }}
            >
              {isLoading ? (
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    border: '1.5px solid var(--accent)',
                    borderTopColor: 'transparent',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
              ) : (
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                  <SelectedIcon />
                </span>
              )}
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                }}
              >
                {isLoading ? 'Rewriting…' : selectedRewrite.label}
              </span>
            </button>

            {/* Divider */}
            <div
              style={{
                width: '1px',
                background: 'var(--border-default)',
                alignSelf: 'stretch',
                margin: '8px 0',
                flexShrink: 0,
              }}
            />

            {/* Chevron toggle */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setDropdownOpen((o) => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.55rem 0.75rem',
                border: 'none',
                background: 'transparent',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                color: 'var(--text-muted)',
                borderRadius: '0 var(--radius-pill) var(--radius-pill) 0',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <span
                style={{
                  display: 'flex',
                  transition: 'transform 0.2s ease',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <ChevronUpIcon />
              </span>
            </button>
          </div>
        </div>

        {/* Copy pill */}
        <button
          type="button"
          onClick={onCopy}
          disabled={!hasOutput}
          className="toolbar-pill"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 0.9rem',
            border: 'none',
            background: 'var(--foreground)',
            cursor: hasOutput ? 'pointer' : 'not-allowed',
            color: copied ? 'var(--accent)' : 'var(--text-secondary)',
            opacity: hasOutput ? 1 : 0.38,
            transition: 'opacity 0.2s ease, color 0.15s ease',
            fontWeight: 500,
            fontSize: '0.8125rem',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
          }}
          title={copied ? 'Copied!' : 'Copy to clipboard'}
        >
          {copied ? (
            <span className="fade-in-scale" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Copied</span>
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <CopyIcon />
            </span>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
