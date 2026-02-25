'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ padding: '2rem', fontFamily: 'monospace', background: '#111', color: '#fff' }}>
        <h2>Something went wrong!</h2>
        <pre style={{ whiteSpace: 'pre-wrap', color: '#ff6b6b' }}>
          {error.message}
        </pre>
        <pre style={{ whiteSpace: 'pre-wrap', color: '#888', fontSize: '12px' }}>
          {error.stack}
        </pre>
        <button
          onClick={() => reset()}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: '#ff1e1e',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
