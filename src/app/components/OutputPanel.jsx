import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PanelHeader from './PanelHeader';

export default function OutputPanel({ output }) {
  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <PanelHeader label="Output" />

      <div
        className="markdown-body panel-output-bg pb-20 prose-reset"
        style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}
      >
        {output.trim() ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
        ) : (
          <div
            className=" pb-20"
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
  );
}
