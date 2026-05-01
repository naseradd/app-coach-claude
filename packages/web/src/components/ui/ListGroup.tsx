import { Children, type ReactNode } from 'react';

interface Props {
  header?: string;
  children: ReactNode;
  className?: string;
}

export function ListGroup({ header, children, className }: Props) {
  const items = Children.toArray(children);
  return (
    <div className={className} style={{ display: 'grid', gap: 8 }}>
      {header ? (
        <div
          className="t-subhead"
          style={{
            color: 'var(--ink-3)',
            textTransform: 'lowercase',
            letterSpacing: 0,
            padding: '0 4px',
          }}
        >
          {header}
        </div>
      ) : null}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 18,
          overflow: 'hidden',
        }}
      >
        {items.map((child, i) => (
          <div key={i}>
            {i > 0 ? (
              <div
                style={{
                  height: 1,
                  background: 'var(--separator)',
                  marginLeft: 16,
                }}
              />
            ) : null}
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
