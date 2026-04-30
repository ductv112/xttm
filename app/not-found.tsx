import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="flex flex-col items-center text-center gap-6 max-w-md py-24">
        <p className="text-4xl font-bold text-blue-700" aria-hidden="true">
          404
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Không tìm thấy trang</h1>
        <p className="text-base text-slate-600">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển
        </p>
        <Button asChild size="lg">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Quay về trang chủ
          </Link>
        </Button>
      </div>
    </div>
  );
}
