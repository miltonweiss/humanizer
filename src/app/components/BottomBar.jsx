import { PenIcon, CopyIcon } from './icons';
export default function BottomBar({
  input,
  output,
  isLoading,
  copied,
  formId,
  onCopy,
}) {
  return (
    <div
      style={{
        padding: '0.75rem 1.25rem',
        height: '50px',
        background: 'transparent',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        position: 'fixed',
        bottom: 10,
        left: 0,
        right: 0,
        justifyContent: 'space-between',
      }}
    >
      <button
        type="submit"
        form={formId}
        className="clean-bg border-none!important hover:opacity-90!important "
        disabled={!input?.trim() || isLoading}
        style={{
          
          padding: '0.5rem 1.25rem',
          minWidth: 0,
          fontSize: '0.9rem',
          opacity: !input?.trim() || isLoading ? 0.45 : 1,
          cursor: !input?.trim() || isLoading ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? '...' : <PenIcon />}
      </button>

      <button
        type="button"
        onClick={onCopy}
        disabled={!output?.trim()}
        className="clean-bg border-none!important p-2"
        style={{
          
          padding: '0.5rem 1.25rem',
          minWidth: 0,
          fontSize: '0.9rem',
          opacity: !output?.trim() ? 0.45 : 1,
          cursor: !output?.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        {copied ? '✓' : <CopyIcon />}
      </button>
    </div>
  );
}
