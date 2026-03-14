import PanelHeader from './PanelHeader';

const HUMANIZE_FORM_ID = 'humanize-form';

export default function InputPanel({
  input,
  onInputChange,
  onSubmit,
}) {
  return (
    <form
      id={HUMANIZE_FORM_ID}
      className="panel "
      onSubmit={onSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border-default)',
        minHeight: 0,
      }}
    >
      <PanelHeader label="Write" />

      <textarea
        className="panel-input-bg  text-primary text-content"
        style={{
          flex: 1,
          resize: 'none',
          border: 'none',
          outline: 'none',
          padding: '1.25rem',
          fontSize: '0.9375rem',
          lineHeight: 1.5,
          color: 'var(--text-primary)',
        }}
        value={input}
        placeholder="Paste your AI-sounding text here…"
        onChange={(e) => onInputChange(e.currentTarget.value)}
      />
    </form>
  );
}

export { HUMANIZE_FORM_ID };
