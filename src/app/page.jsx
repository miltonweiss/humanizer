'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getAssistantText } from '../lib/getAssistantText.js';
import BottomBar from './components/BottomBar';
import { HUMANIZE_FORM_ID } from './components/InputPanel';
import SettingsPanel from './components/SettingsPanel';

const SETTINGS_KEY = 'selfimpragent-settings';
const REWRITE_TYPE_KEY = 'selfimpragent-rewrite-type';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MODEL = 'claude-sonnet';
const VALID_REWRITE_TYPES = ['light-rewrite', 'clean', 'linebreak', 'list', 'all'];
const DEFAULT_REWRITE_TYPE = 'clean';

function loadSettings() {
  if (typeof window === 'undefined') return { temperature: DEFAULT_TEMPERATURE, model: DEFAULT_MODEL };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { temperature: DEFAULT_TEMPERATURE, model: DEFAULT_MODEL };
    const parsed = JSON.parse(raw);
    const validModels = ['claude-sonnet', 'gpt', 'mistral'];
    return {
      temperature: typeof parsed.temperature === 'number' ? parsed.temperature : DEFAULT_TEMPERATURE,
      model: validModels.includes(parsed.model) ? parsed.model : DEFAULT_MODEL,
    };
  } catch {
    return { temperature: DEFAULT_TEMPERATURE, model: DEFAULT_MODEL };
  }
}

function loadRewriteType() {
  if (typeof window === 'undefined') return DEFAULT_REWRITE_TYPE;
  try {
    const raw = localStorage.getItem(REWRITE_TYPE_KEY);
    if (!raw) return DEFAULT_REWRITE_TYPE;
    const parsed = raw;
    return VALID_REWRITE_TYPES.includes(parsed) ? parsed : DEFAULT_REWRITE_TYPE;
  } catch {
    return DEFAULT_REWRITE_TYPE;
  }
}

export default function Chat() {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);

  useEffect(() => {
    const s = loadSettings();
    setTemperature(s.temperature);
    setSelectedModel(s.model);
    setHasLoadedSettings(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedSettings || typeof window === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ temperature, model: selectedModel }));
    } catch {
      /* ignore */
    }
  }, [temperature, selectedModel, hasLoadedSettings]);
  

  const [lastOutput, setLastOutput] = useState('');
  const [rewriteType, setRewriteType] = useState(DEFAULT_REWRITE_TYPE);
  const [hasLoadedRewriteType, setHasLoadedRewriteType] = useState(false);
  const [customRewriteLoading, setCustomRewriteLoading] = useState(false);

  useEffect(() => {
    setRewriteType(loadRewriteType());
    setHasLoadedRewriteType(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedRewriteType || typeof window === 'undefined') return;
    try {
      localStorage.setItem(REWRITE_TYPE_KEY, rewriteType);
    } catch {
      /* ignore */
    }
  }, [rewriteType, hasLoadedRewriteType]);

  const settingsRef = useRef({ model: selectedModel, temperature });
  settingsRef.current = { model: selectedModel, temperature };

  const { messages, setMessages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest: ({ id, messages: msgs, trigger, messageId }) => ({
        body: {
          id,
          messages: msgs,
          trigger,
          messageId,
          model: settingsRef.current.model,
          temperature: settingsRef.current.temperature,
        },
      }),
    }),
  });

  const latestAssistantMessage = useMemo(
    () => [...messages].reverse().find((m) => m.role === 'assistant'),
    [messages]
  );
  const outputFromMessages = useMemo(() => getAssistantText(latestAssistantMessage), [latestAssistantMessage]);
  const output = outputFromMessages || lastOutput;

  useEffect(() => {
    if (status === 'ready' && messages.length > 0) {
      const latest = [...messages].reverse().find((m) => m.role === 'assistant');
      if (latest) {
        const text = getAssistantText(latest);
        setLastOutput(text);
        setInput(text);
        setMessages([]);
      }
    }
  }, [status, messages, setMessages]);

  const isLoading = status === 'streaming' || status === 'submitted' || customRewriteLoading;

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

  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (prevStatusRef.current !== 'streaming' && status === 'streaming') {
      setLastOutput('');
    }
    prevStatusRef.current = status;
  }, [status]);

  async function handleSubmit(e) {
    e.preventDefault();
    const text = output || input;
    if (!text.trim() || isLoading) return;

    if (rewriteType === 'light-rewrite') {
      sendMessage({ text });
      return;
    }

    setCustomRewriteLoading(true);
    setLastOutput('');
    try {
      const res = await fetch(`/api/rewrite/${rewriteType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({}));
      const result = data.text ?? '';
      setLastOutput(result);
      setInput(result);
    } catch {
      setLastOutput(text);
      setInput(text);
    } finally {
      setCustomRewriteLoading(false);
    }
  }

  function handleContentChange(value) {
    setInput(value);
    if (lastOutput && !isLoading) setLastOutput(value);
  }

  const textValue = output || input;

  return (
    <div className="background" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* App header */}
      <header className="app-header">
        <span className="app-wordmark">Rewrite</span>
        <SettingsPanel
          temperature={temperature}
          selectedModel={selectedModel}
          onTemperatureChange={setTemperature}
          onModelChange={setSelectedModel}
        />
      </header>

      <form
        id={HUMANIZE_FORM_ID}
        onSubmit={handleSubmit}
        style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', paddingTop: '44px' }}>
          <textarea
            className={`text-primary text-content${isLoading ? ' loading-shimmer' : ''}`}
            value={textValue}
            onChange={(e) => handleContentChange(e.target.value)}
            readOnly={isLoading}
            placeholder="Paste your text here…"
            style={{
              width: '100%',
              height: '100%',
              resize: 'none',
              border: 'none',
              outline: 'none',
              padding: 'clamp(1.5rem, 4vw, 3rem)',
              paddingTop: 'clamp(1.5rem, 4vw, 2.5rem)',
              paddingBottom: '5.5rem',
              fontSize: 'clamp(0.9375rem, 1.5vw, 1.0625rem)',
              lineHeight: 1.65,
              color: 'var(--text-primary)',
              background: 'transparent',
              caretColor: 'var(--accent)',
              maxWidth: '72ch',
              marginLeft: 'auto',
              marginRight: 'auto',
              display: 'block',
            }}
          />
        </div>
      </form>
      <BottomBar
        input={input}
        output={output}
        isLoading={isLoading}
        copied={copied}
        formId={HUMANIZE_FORM_ID}
        onCopy={handleCopy}
        rewriteType={rewriteType}
        onRewriteTypeChange={setRewriteType}
      />
    </div>
  );
}
