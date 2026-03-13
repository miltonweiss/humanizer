'use client';

import { useChat } from '@ai-sdk/react';
import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { writingStyles } from '../../styles.js';


function getAssistantText(message) {
  if (!message) return '';
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text ?? '')
      .join('');
  }
  if (typeof message.content === 'string') return message.content;
  return '';
}

export default function Chat() {
  const [selectedStyle, setSelectedStyle] = useState(writingStyles[0].id);
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const stylePrompt = writingStyles.find(s => s.id === selectedStyle)?.prompt || "";
  const { messages, sendMessage, status } = useChat({
    body: { stylePrompt },
  });
  const latestAssistantMessage = useMemo(
    () => [...messages].reverse().find((m) => m.role === 'assistant'),
    [messages]
  );

  const output = useMemo(() => getAssistantText(latestAssistantMessage), [latestAssistantMessage]);

  const isLoading = status === 'streaming' || status === 'submitted';

  async function handleCopy() {
    if (!output.trim()) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
  }

  return (
    <div className="background" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* 50/50 split */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0 }}>
        {/* LEFT — Input */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--border-default)',
            minHeight: 0,
          }}
        >
          <div
            className=""
            style={{
              padding: '0.625rem 1.25rem',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Input
            </span>
          </div>

          <textarea
            className="background text-primary"
            style={{
              flex: 1,
              resize: 'none',
              border: 'none',
              outline: 'none',
              padding: '1.25rem',
              fontSize: '0.9375rem',
              lineHeight: 1.65,
              fontFamily: 'inherit',
              color: 'var(--text-primary)',
              background: 'var(--background)',
            }}
            value={input}
            placeholder="Paste your AI-sounding text here…"
            onChange={(e) => setInput(e.currentTarget.value)}
          />

          <div
            style={{
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid var(--border-default)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexDirection: 'row',
            }}
          >
            <select
              className="select accent-btn appearance-none"
              onChange={(e) => setSelectedStyle(e.target.value)}
              value={selectedStyle}
              style={{ flex: 1, padding: '0.5rem 1.25rem', minWidth: 0 }}
            >
              <option disabled={true}>Pick a Style</option>
              {writingStyles.map(style => (
                <option key={style.id} value={style.id}>
                  {style.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="accent-btn"
              disabled={!input.trim() || isLoading}
              style={{
                flex: 1,
                padding: '0.5rem 1.25rem',
                minWidth: 0,
                opacity: !input.trim() || isLoading ? 0.45 : 1,
                cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Humanizing…' : 'Humanize'}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!output.trim()}
              className="accent-btn"
              style={{
                flex: 1,
                padding: '0.5rem 1.25rem',
                minWidth: 0,
                opacity: !output.trim() ? 0.45 : 1,
                cursor: !output.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {copied ? '✓ Copied' : 'Copy Text'}
            </button>
          </div>
        </form>

        {/* RIGHT — Output */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            style={{
              padding: '0.625rem 1.25rem',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Output
            </span>
          </div>

          <div
            className="markdown-body prose-reset"
            style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}
          >
            {output.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                  userSelect: 'none',
                }}
              >
                Output appears here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
