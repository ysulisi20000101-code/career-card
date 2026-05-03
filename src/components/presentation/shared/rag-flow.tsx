"use client";

interface RagBlock {
  title: string;
  items: string;
  highlighted?: boolean;
}

interface RagFlowProps {
  blocks: RagBlock[];
  footer?: string;
  className?: string;
}

export function RagFlow({ blocks, footer, className }: RagFlowProps) {
  return (
    <div className={className}>
      <div className="rag-flow">
        {blocks.map((block, i) => (
          <span key={i}>
            {i > 0 && <span className="rag-arrow">→</span>}
            <span
              className="rag-block"
              style={
                block.highlighted
                  ? { borderColor: "rgba(107,94,160,.25)", background: "rgba(107,94,160,.05)" }
                  : undefined
              }
            >
              <div
                className="rag-title"
                style={block.highlighted ? { color: "var(--violet)" } : undefined}
              >
                {block.title}
              </div>
              <div className="rag-items">{block.items}</div>
            </span>
          </span>
        ))}
      </div>
      {footer && (
        <div style={{ textAlign: "center", fontSize: 10, color: "var(--t3)", marginTop: 8 }}>
          {footer}
        </div>
      )}
    </div>
  );
}
