'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useMemo, useState } from 'react';
import { writingStyles } from '../../styles.js';
import { getAssistantText } from '../lib/getAssistantText.js';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import SettingsPanel from './components/SettingsPanel';

const SETTINGS_KEY = 'selfimpragent-settings';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_MODEL = 'claude-sonnet';

function loadSettings() {
  if (typeof window === 'undefined') return { temperature: DEFAULT_TEMPERATURE, maxTokens: DEFAULT_MAX_TOKENS, model: DEFAULT_MODEL };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { temperature: DEFAULT_TEMPERATURE, maxTokens: DEFAULT_MAX_TOKENS, model: DEFAULT_MODEL };
    const parsed = JSON.parse(raw);
    const validModels = ['claude-sonnet', 'gpt', 'mistral'];
    return {
      temperature: typeof parsed.temperature === 'number' ? parsed.temperature : DEFAULT_TEMPERATURE,
      maxTokens: typeof parsed.maxTokens === 'number' ? parsed.maxTokens : DEFAULT_MAX_TOKENS,
      model: validModels.includes(parsed.model) ? parsed.model : DEFAULT_MODEL,
    };
  } catch {
    return { temperature: DEFAULT_TEMPERATURE, maxTokens: DEFAULT_MAX_TOKENS, model: DEFAULT_MODEL };
  }
}

export default function Chat() {
  const [selectedStyle, setSelectedStyle] = useState(writingStyles[0].id);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const [maxTokens, setMaxTokens] = useState(DEFAULT_MAX_TOKENS);
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);

  useEffect(() => {
    const s = loadSettings();
    setTemperature(s.temperature);
    setMaxTokens(s.maxTokens);
    setSelectedModel(s.model);
    setHasLoadedSettings(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedSettings || typeof window === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ temperature, maxTokens, model: selectedModel }));
    } catch {
      /* ignore */
    }
  }, [temperature, maxTokens, selectedModel, hasLoadedSettings]);
  

  const stylePrompt = writingStyles.find((s) => s.id === selectedStyle)?.prompt || '';
  const { messages, sendMessage, status } = useChat({ body: { stylePrompt } });

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
      <SettingsPanel
        temperature={temperature}
        maxTokens={maxTokens}
        selectedModel={selectedModel}
        onTemperatureChange={setTemperature}
        onMaxTokensChange={setMaxTokens}
        onModelChange={setSelectedModel}
      />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0 }}>
        <InputPanel
          input={input}
          selectedStyle={selectedStyle}
          isLoading={isLoading}
          output={output}
          copied={copied}
          onInputChange={setInput}
          onStyleChange={setSelectedStyle}
          onSubmit={handleSubmit}
          onCopy={handleCopy}
        />
        <OutputPanel output={output} />
      </div>
    </div>
  );
}
