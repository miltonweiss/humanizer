'use client';

import { useChat } from '@ai-sdk/react';
import { UIMessage } from 'ai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { writingStyles } from '../../styles.js';

type RewriteOperation = 'humanize' | 'shorten' | 'expand' | 'professional' | 'casual' | 'regenerate';
type RewriteLength = 'shorter' | 'same' | 'longer';

type RewriteOptions = {
  tone?: string;
  length: RewriteLength;
  preserveFormatting: boolean;
};

type HistoryItem = {
  id: string;
  input: string;
  output: string;
  operation: RewriteOperation;
  selectedStyle: string;
  rewriteOptions: RewriteOptions;
  createdAt: string;
};

type WritingStyle = {
  id: string;
  label: string;
  prompt: string;
};

type ToastVariant = 'success' | 'error' | 'info';
type ToastItem = { id: string; message: string; variant: ToastVariant };

const HISTORY_STORAGE_KEY = 'humanizer.history.v1';
const HISTORY_LIMIT = 20;
const TOAST_DURATION_MS = 2600;
let generatedIdCounter = 0;

const TONE_OPTIONS = [
  { value: '', label: 'Auto' },
  { value: 'natural', label: 'Natural' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'confident', label: 'Confident' },
  { value: 'empathetic', label: 'Empathetic' },
];

const LENGTH_OPTIONS: Array<{ value: RewriteLength; label: string }> = [
  { value: 'shorter', label: 'Shorter' },
  { value: 'same', label: 'Same' },
  { value: 'longer', label: 'Longer' },
];

function getAssistantText(message: UIMessage | undefined) {
  if (!message) return '';
  if (Array.isArray(message.parts)) {
    return message.parts.filter((p) => p.type === 'text').map((p) => p.text ?? '').join('');
  }
  return '';
}

function createStableId(prefix: string) {
  generatedIdCounter += 1;
  return `${prefix}-${generatedIdCounter}`;
}

function isHistoryItem(value: unknown): value is HistoryItem {
  if (!value || typeof value !== 'object') return false;
  const c = value as Partial<HistoryItem>;
  return typeof c.id === 'string' && typeof c.input === 'string' && typeof c.output === 'string' &&
    typeof c.operation === 'string' && typeof c.selectedStyle === 'string' &&
    !!c.rewriteOptions && typeof c.createdAt === 'string';
}

function clampHistory(items: HistoryItem[]) { return items.slice(0, HISTORY_LIMIT); }

function readHistoryFromStorage(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return clampHistory(parsed.filter(isHistoryItem));
  } catch { return []; }
}

export default function Chat() {
  const styleList = writingStyles as WritingStyle[];
  const [selectedStyle, setSelectedStyle] = useState(styleList[0]?.id ?? '');
  const [input, setInput] = useState('');
  const [tone, setTone] = useState('');
  const [lengthTarget, setLengthTarget] = useState<RewriteLength>('same');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(() => readHistoryFromStorage());
  const [copied, setCopied] = useState(false);
  const [restoredOutput, setRestoredOutput] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [lastOperation, setLastOperation] = useState<RewriteOperation>('humanize');
  const [showHistory, setShowHistory] = useState(false);

  const requestMetaRef = useRef<{
    input: string;
    operation: RewriteOperation;
    selectedStyle: string;
    rewriteOptions: RewriteOptions;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(clampHistory(historyItems)));
  }, [historyItems]);

  const pushToast = useCallback((message: string, variant: ToastVariant) => {
    const id = createStableId('toast');
    setToasts((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_DURATION_MS);
  }, []);

  const { messages, sendMessage, status, setMessages, error } = useChat({
    onFinish: ({ message }) => {
      const finishedOutput = getAssistantText(message).trim();
      if (!finishedOutput || !requestMetaRef.current) return;
      const meta = requestMetaRef.current;
      setRestoredOutput('');
      const nextItem: HistoryItem = {
        id: createStableId('history'),
        input: meta.input,
        output: finishedOutput,
        operation: meta.operation,
        selectedStyle: meta.selectedStyle,
        rewriteOptions: meta.rewriteOptions,
        createdAt: new Date().toISOString(),
      };
      setHistoryItems((prev) => clampHistory([nextItem, ...prev]));
    },
    onError: (chatError) => pushToast(chatError.message || 'Rewrite failed.', 'error'),
  });

  const latestAssistantMessage = useMemo(
    () => [...messages].reverse().find((m) => m.role === 'assistant'),
    [messages]
  );
  const liveOutput = useMemo(() => getAssistantText(latestAssistantMessage).trim(), [latestAssistantMessage]);
  const output = restoredOutput.trim() ? restoredOutput : liveOutput;
  const isLoading = status === 'streaming' || status === 'submitted';
  const stylePrompt = styleList.find((s) => s.id === selectedStyle)?.prompt ?? '';

  const rewriteOptions = useMemo<RewriteOptions>(() => ({
    length: lengthTarget,
    preserveFormatting: true,
    ...(tone ? { tone } : {}),
  }), [lengthTarget, tone]);

  async function runRewrite(operation: RewriteOperation, overrides?: Partial<RewriteOptions>) {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;
    const opts = { ...rewriteOptions, ...overrides };
    requestMetaRef.current = { input: trimmedInput, operation, selectedStyle, rewriteOptions: opts };
    setLastOperation(operation);
    setRestoredOutput('');
    setMessages([]);
    await sendMessage({ text: trimmedInput }, { body: { stylePrompt, operation, rewriteOptions: opts } });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runRewrite('humanize');
  }

  async function handleCopy() {
    if (!output.trim()) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      pushToast('Copied.', 'success');
      window.setTimeout(() => setCopied(false), 1400);
    } catch { pushToast('Copy failed.', 'error'); }
  }

  function handleUseOutputAsInput() {
    if (!output.trim()) return;
    setInput(output);
  }

  function handleRestoreHistoryItem(item: HistoryItem) {
    setInput(item.input);
    setRestoredOutput(item.output);
    setSelectedStyle(item.selectedStyle);
    setTone(item.rewriteOptions.tone ?? '');
    setLengthTarget(item.rewriteOptions.length ?? 'same');
    setShowHistory(false);
    pushToast('Restored.', 'info');
  }

  const outputState = useMemo(() => {
    if (isLoading) return 'loading';
    if (error) return 'error';
    if (!output.trim()) return 'empty';
    return 'ready';
  }, [error, isLoading, output]);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <span className="app-wordmark">Humanizer</span>
        <div className="header-right">
          <button type="button" className="ghost" onClick={() => setShowHistory((v) => !v)}>
            History {historyItems.length > 0 ? `· ${historyItems.length}` : ''}
          </button>
        </div>
      </header>

      {/* Main two-column layout */}
      <main className="workspace">
        {/* LEFT — Input */}
        <form className="pane pane-input" onSubmit={handleSubmit}>
          <textarea
            className="draft-area"
            value={input}
            placeholder="Paste your draft here…"
            onChange={(e) => setInput(e.currentTarget.value)}
          />

          {/* Controls row */}
          <div className="controls-row">
            <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.currentTarget.value)} className="ctrl-select">
              {styleList.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>

            <select value={tone} onChange={(e) => setTone(e.currentTarget.value)} className="ctrl-select">
              {TONE_OPTIONS.map((o) => <option key={o.value || 'auto'} value={o.value}>{o.label}</option>)}
            </select>

            <select value={lengthTarget} onChange={(e) => setLengthTarget(e.currentTarget.value as RewriteLength)} className="ctrl-select">
              {LENGTH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <button type="submit" className="run-btn" disabled={!input.trim() || isLoading}>
              {isLoading ? 'Rewriting…' : 'Humanize'}
            </button>
          </div>
        </form>

        {/* RIGHT — Output */}
        <section className="pane pane-output">
          <div className="output-body">
            {outputState === 'loading' && (
              <div className="state-block loading-state">
                <div className="sk" /><div className="sk sk-short" /><div className="sk" />
              </div>
            )}
            {outputState === 'error' && (
              <div className="state-block">
                <p className="state-label error-label">Rewrite failed</p>
                <p className="state-sub">{error?.message}</p>
                <button type="button" className="ghost-sm" onClick={() => runRewrite(lastOperation)}>Retry</button>
              </div>
            )}
            {outputState === 'empty' && (
              <div className="state-block">
                <p className="state-label">Output will appear here</p>
                <p className="state-sub">Run a rewrite to see the result</p>
              </div>
            )}
            {outputState === 'ready' && (
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
              </div>
            )}
          </div>

          {output.trim() && (
            <div className="output-actions">
              <button type="button" className="ghost-sm" onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button type="button" className="ghost-sm" onClick={handleUseOutputAsInput}>
                Use as input
              </button>
            </div>
          )}
        </section>
      </main>

      {/* History drawer */}
      {showHistory && (
        <aside className="history-drawer">
          <div className="drawer-head">
            <span>Recent rewrites</span>
            <button type="button" className="ghost-sm" onClick={() => setShowHistory(false)}>Close</button>
          </div>
          {historyItems.length === 0
            ? <p className="empty-history">No history yet.</p>
            : historyItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="history-row"
                onClick={() => handleRestoreHistoryItem(item)}
              >
                <span className="history-op">{item.operation}</span>
                <span className="history-preview">{item.input.slice(0, 80)}…</span>
              </button>
            ))
          }
          {historyItems.length > 0 && (
            <button type="button" className="ghost-sm danger-sm" onClick={() => { setHistoryItems([]); localStorage.removeItem(HISTORY_STORAGE_KEY); }}>
              Clear all
            </button>
          )}
        </aside>
      )}

      {/* Toasts */}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.variant}`}>{t.message}</div>
        ))}
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .app {
          display: flex;
          flex-direction: column;
          height: 100dvh;
          background: var(--color-background-primary);
          font-family: var(--font-sans);
          color: var(--color-text-primary);
        }

        /* ── Header ─────────────────────────────────────── */
        .app-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          height: 52px;
          border-bottom: 0.5px solid var(--color-border-tertiary);
          flex-shrink: 0;
        }
        .app-wordmark {
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.04em;
          color: var(--color-text-primary);
        }
        .header-right { display: flex; gap: 8px; align-items: center; }

        /* ── Workspace ───────────────────────────────────── */
        .workspace {
          display: grid;
          grid-template-columns: 1fr 1fr;
          flex: 1;
          min-height: 0;
        }

        /* ── Panes ───────────────────────────────────────── */
        .pane {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .pane-input {
          border-right: 0.5px solid var(--color-border-tertiary);
        }

        /* ── Textarea ────────────────────────────────────── */
        .draft-area {
          flex: 1;
          resize: none;
          border: none;
          outline: none;
          background: transparent;
          padding: 1.5rem;
          font-family: var(--font-sans);
          font-size: 15px;
          line-height: 1.7;
          color: var(--color-text-primary);
          min-height: 0;
        }
        .draft-area::placeholder { color: var(--color-text-tertiary); }

        /* ── Controls row ────────────────────────────────── */
        .controls-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0.75rem 1rem;
          border-top: 0.5px solid var(--color-border-tertiary);
          flex-shrink: 0;
          flex-wrap: wrap;
        }
        .ctrl-select {
          height: 32px;
          padding: 0 8px;
          font-size: 13px;
          background: var(--color-background-secondary);
          border: 0.5px solid var(--color-border-tertiary);
          border-radius: var(--border-radius-md);
          color: var(--color-text-primary);
          cursor: pointer;
          outline: none;
        }
        .ctrl-select:focus { border-color: var(--color-border-secondary); }

        .run-btn {
          margin-left: auto;
          height: 32px;
          padding: 0 16px;
          font-size: 13px;
          font-weight: 500;
          background: var(--color-text-primary);
          color: var(--color-background-primary);
          border: none;
          border-radius: var(--border-radius-md);
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .run-btn:disabled { opacity: 0.35; cursor: default; }
        .run-btn:not(:disabled):hover { opacity: 0.8; }

        /* ── Output pane ─────────────────────────────────── */
        .pane-output {
          background: var(--color-background-secondary);
          position: relative;
        }
        .output-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          min-height: 0;
        }
        .output-actions {
          display: flex;
          gap: 8px;
          padding: 0.75rem 1rem;
          border-top: 0.5px solid var(--color-border-tertiary);
          flex-shrink: 0;
        }

        /* ── Markdown output ─────────────────────────────── */
        .markdown-body {
          font-size: 15px;
          line-height: 1.7;
          color: var(--color-text-primary);
        }
        .markdown-body p { margin-bottom: 1rem; }
        .markdown-body p:last-child { margin-bottom: 0; }

        /* ── States ──────────────────────────────────────── */
        .state-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-top: 0.5rem;
        }
        .state-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-secondary);
        }
        .error-label { color: var(--color-text-danger); }
        .state-sub { font-size: 13px; color: var(--color-text-tertiary); }

        /* Skeleton */
        .loading-state { gap: 10px; }
        .sk {
          height: 14px;
          border-radius: 4px;
          background: var(--color-border-tertiary);
          animation: pulse 1.4s ease-in-out infinite;
        }
        .sk-short { width: 55%; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        /* ── Buttons ─────────────────────────────────────── */
        .ghost {
          background: transparent;
          border: 0.5px solid var(--color-border-tertiary);
          border-radius: var(--border-radius-md);
          padding: 0 12px;
          height: 32px;
          font-size: 13px;
          color: var(--color-text-secondary);
          cursor: pointer;
        }
        .ghost:hover { border-color: var(--color-border-secondary); color: var(--color-text-primary); }

        .ghost-sm {
          background: transparent;
          border: none;
          padding: 0;
          font-size: 13px;
          color: var(--color-text-secondary);
          cursor: pointer;
        }
        .ghost-sm:hover { color: var(--color-text-primary); }
        .danger-sm { color: var(--color-text-danger) !important; }

        /* ── History drawer ──────────────────────────────── */
        .history-drawer {
          position: fixed;
          top: 52px;
          right: 0;
          bottom: 0;
          width: 320px;
          background: var(--color-background-primary);
          border-left: 0.5px solid var(--color-border-tertiary);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          z-index: 50;
        }
        .drawer-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 0.5px solid var(--color-border-tertiary);
          font-size: 13px;
          font-weight: 500;
          flex-shrink: 0;
        }
        .history-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 0.75rem 1.25rem;
          text-align: left;
          background: transparent;
          border: none;
          border-bottom: 0.5px solid var(--color-border-tertiary);
          cursor: pointer;
          width: 100%;
        }
        .history-row:hover { background: var(--color-background-secondary); }
        .history-op {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-text-tertiary);
        }
        .history-preview { font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; }
        .empty-history { padding: 1.25rem; font-size: 13px; color: var(--color-text-tertiary); }

        /* ── Toasts ──────────────────────────────────────── */
        .toast-stack {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 100;
          pointer-events: none;
        }
        .toast {
          padding: 8px 16px;
          border-radius: var(--border-radius-md);
          font-size: 13px;
          font-weight: 500;
          background: var(--color-background-primary);
          border: 0.5px solid var(--color-border-tertiary);
          color: var(--color-text-secondary);
          white-space: nowrap;
        }
        .toast-success { color: var(--color-text-success); border-color: var(--color-border-success); }
        .toast-error { color: var(--color-text-danger); border-color: var(--color-border-danger); }

        /* ── Responsive ──────────────────────────────────── */
        @media (max-width: 768px) {
          .workspace { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
          .pane-input { border-right: none; border-bottom: 0.5px solid var(--color-border-tertiary); }
          .history-drawer { width: 100%; left: 0; }
        }
      `}</style>
    </div>
  );
}