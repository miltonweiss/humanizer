import PanelHeader from './PanelHeader';
import { writingStyles } from '../../../styles.js';

export default function InputPanel({
  input,
  selectedStyle,
  isLoading,
  output,
  copied,
  onInputChange,
  onStyleChange,
  onSubmit,
  onCopy,
}) {
  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border-default)',
        minHeight: 0,
      }}
    >
      <PanelHeader label="Input" />

      <textarea
        className="background text-primary text-content"
        style={{
          flex: 1,
          resize: 'none',
          border: 'none',
          outline: 'none',
          padding: '1.25rem',
          fontSize: '0.9375rem',
          lineHeight: 1.65,
          color: 'var(--text-primary)',
          background: 'var(--background)',
        }}
        value={input}
        placeholder="Paste your AI-sounding text here…"
        onChange={(e) => onInputChange(e.currentTarget.value)}
      />

      <div
        style={{
          padding: '0.75rem 1.25rem',
          borderTop: '1px solid var(--border-default)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <select
          className="select accent-btn appearance-none"
          onChange={(e) => onStyleChange(e.target.value)}
          value={selectedStyle}
          style={{ flex: 1, padding: '0.5rem 1.25rem', minWidth: 0, fontSize: '0.9rem' }}
        >
          <option disabled>Pick a Style</option>
          {writingStyles.map((style) => (
            <option key={style.id} value={style.id}>
              {style.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="accent-btn btn"
          disabled={!input.trim() || isLoading}
          style={{
            flex: 1,
            padding: '0.5rem 1.25rem',
            minWidth: 0,
            fontSize: '0.9rem',
            opacity: !input.trim() || isLoading ? 0.45 : 1,
            cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Humanizing…' : 'Humanize'}
        </button>

        <button
          type="button"
          onClick={onCopy}
          disabled={!output.trim()}
          className="accent-btn btn"
          style={{
            flex: 1,
            padding: '0.5rem 1.25rem',
            minWidth: 0,
            fontSize: '0.9rem',
            opacity: !output.trim() ? 0.45 : 1,
            cursor: !output.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {copied ? '✓ Copied' : 'Copy Text'}
        </button>
      </div>
    </form>
  );
}
