'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[global-error.tsx]', error);
    }
  }, [error]);

  return (
    <html lang="vi">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          padding: '1rem',
          margin: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '1.5rem',
            maxWidth: '28rem',
            padding: '6rem 0',
          }}
        >
          <p
            style={{ fontSize: '2.25rem', fontWeight: 700, color: '#dc2626', margin: 0 }}
            aria-hidden="true"
          >
            500
          </p>
          <h1
            style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a', margin: 0 }}
          >
            Đã xảy ra lỗi nghiêm trọng
          </h1>
          <p style={{ fontSize: '1rem', color: '#475569', margin: 0 }}>
            Hệ thống tạm thời gặp sự cố. Vui lòng thử lại sau ít phút
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '0.5rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'white',
              backgroundColor: '#1d4ed8',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
            }}
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
