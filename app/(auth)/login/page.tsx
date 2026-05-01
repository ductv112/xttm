import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { defaultLandingPath } from '@/lib/permissions';
import { LoginForm } from '@/components/auth/LoginForm';
import { SsoPlaceholderButton } from '@/components/auth/SsoPlaceholderButton';
import { QuocHuySvg } from '@/components/auth/QuocHuySvg';
import { DemoAccountsHelper } from '@/components/auth/DemoAccountsHelper';
import { Separator } from '@/components/ui/separator';

export const metadata = { title: 'Đăng nhập hệ thống' };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(defaultLandingPath(session.user.role));
  }

  return (
    <div className="min-h-screen relative flex flex-col lg:flex-row overflow-hidden">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 z-20 h-[3px] bg-gradient-to-r from-red-600 via-amber-400 to-red-600"
      />

      <aside className="relative hidden lg:flex lg:w-3/5 flex-col items-center justify-center gap-8 p-12 overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#eef4ff_45%,#fff7ed_100%)]">
        <span
          aria-hidden
          className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-blue-300/30 blur-3xl"
        />
        <span
          aria-hidden
          className="absolute -bottom-40 -right-24 h-[480px] w-[480px] rounded-full bg-amber-200/40 blur-3xl"
        />
        <span
          aria-hidden
          className="absolute top-1/3 right-1/4 h-[280px] w-[280px] rounded-full bg-red-200/20 blur-3xl"
        />
        <span
          aria-hidden
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #1e3a8a 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />
        <svg
          aria-hidden
          viewBox="0 0 600 600"
          className="absolute -bottom-10 right-8 w-[360px] text-blue-900/[0.04]"
          fill="currentColor"
        >
          <path d="M310 40c-12 18-8 36 4 52 14 18 6 38-10 50-18 14-22 32-12 50 8 14 4 28-8 38-18 14-26 34-22 56 4 22-2 42-18 56-18 16-22 38-10 58 10 18 8 36-6 50-14 14-14 32 0 48 12 14 12 30 0 44-10 12-8 26 4 38 16 16 18 36 6 54-10 14-6 28 8 38h60c10-14 22-22 38-22 16 0 30 8 40 22h60c14-12 16-26 6-40-12-18-12-36 0-52 14-18 12-36-2-52-14-14-16-30-6-46 12-18 10-38-6-54-14-14-16-32-6-50 12-22 6-42-14-58-18-14-22-32-12-50 10-18 4-34-14-46-16-12-20-26-12-42 8-16 4-30-12-40-14-10-18-22-10-36 6-12 4-22-8-30z" />
        </svg>

        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="rounded-full bg-white/70 p-5 ring-1 ring-blue-200/60 backdrop-blur-sm shadow-sm">
            <QuocHuySvg className="h-20 w-20 text-blue-700" />
          </div>
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
            <h1 className="text-4xl font-bold text-blue-700 tracking-tight">XTTMQG</h1>
            <p className="text-base text-slate-600">
              Hệ thống Quản lý Chương trình Quốc gia về Xúc tiến Thương mại
            </p>
          </div>
          <p className="text-sm font-semibold text-slate-500">
            Bộ Công Thương — Cục Xúc tiến Thương mại
          </p>
        </div>
      </aside>

      <section className="relative flex-1 lg:w-2/5 flex flex-col items-center justify-center p-8 bg-white">
        <span
          aria-hidden
          className="absolute inset-0 opacity-[0.04] lg:opacity-[0.05]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #1e3a8a 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <span
          aria-hidden
          className="absolute -top-32 -right-32 h-[360px] w-[360px] rounded-full bg-blue-100/60 blur-3xl"
        />
        <span
          aria-hidden
          className="absolute -bottom-32 -left-24 h-[320px] w-[320px] rounded-full bg-amber-100/50 blur-3xl"
        />
        <div className="relative z-10 w-full max-w-md">
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

          <DemoAccountsHelper />

          <p className="text-sm text-slate-400 mt-8 text-center">Phiên bản POC · 2026</p>
        </div>
      </section>
    </div>
  );
}
