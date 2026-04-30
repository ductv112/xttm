'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[error.tsx]', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="flex flex-col items-center text-center gap-6 max-w-md py-24">
        <p className="text-4xl font-bold text-red-600" aria-hidden="true">
          500
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Đã xảy ra lỗi</h1>
        <p className="text-base text-slate-600">
          Hệ thống tạm thời gặp sự cố. Vui lòng thử lại sau ít phút
        </p>
        <div className="flex flex-row gap-3">
          <Button size="lg" onClick={() => reset()}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Thử lại
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Quay về trang chủ
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
