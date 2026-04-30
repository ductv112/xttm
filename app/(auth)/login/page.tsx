import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { defaultLandingPath } from '@/lib/permissions';
import { LoginForm } from '@/components/auth/LoginForm';
import { SsoPlaceholderButton } from '@/components/auth/SsoPlaceholderButton';
import { QuocHuySvg } from '@/components/auth/QuocHuySvg';
import { Separator } from '@/components/ui/separator';

export const metadata = { title: 'Đăng nhập hệ thống' };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(defaultLandingPath(session.user.role));
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <aside className="hidden lg:flex lg:w-3/5 flex-col items-center justify-center gap-8 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-12">
        <QuocHuySvg className="h-20 w-20 text-blue-700" />
        <div
          className="text-center space-y-1"
          style={{ fontFamily: 'Times New Roman, serif' }}
        >
          <p className="text-sm italic text-slate-700 leading-relaxed">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </p>
          <p className="text-sm italic text-slate-700 leading-relaxed">
            Độc lập - Tự do - Hạnh phúc
          </p>
          <div className="flex justify-center pt-2">
            <span className="block w-24 border-t border-slate-400" />
          </div>
        </div>
        <div className="text-center space-y-3 max-w-md">
          <h1 className="text-4xl font-bold text-blue-700">XTTMQG</h1>
          <p className="text-base text-slate-600">
            Hệ thống Quản lý Chương trình Quốc gia về Xúc tiến Thương mại
          </p>
        </div>
        <p className="text-sm font-semibold text-slate-500">
          Bộ Công Thương — Cục Xúc tiến Thương mại
        </p>
      </aside>

      <section className="flex-1 lg:w-2/5 flex flex-col items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center mb-8 gap-3">
            <QuocHuySvg className="h-16 w-16 text-blue-700" />
            <h1 className="text-2xl font-bold text-blue-700">XTTMQG</h1>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900">Đăng nhập hệ thống</h2>
          <p className="text-sm text-slate-600 mt-1">Vui lòng đăng nhập để tiếp tục</p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-sm text-slate-500">Hoặc</span>
            <Separator className="flex-1" />
          </div>

          <SsoPlaceholderButton />

          <p className="text-sm text-slate-400 mt-8 text-center">Phiên bản POC · 2026</p>
        </div>
      </section>
    </div>
  );
}
