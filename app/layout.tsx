import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '600', '700'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'XTTMQG — Hệ thống Quản lý Chương trình Quốc gia về Xúc tiến Thương mại',
    template: '%s · XTTMQG',
  },
  description:
    'Hệ thống Quản lý Chương trình Quốc gia về Xúc tiến Thương mại — Bộ Công Thương — Cục Xúc tiến Thương mại',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`light ${beVietnamPro.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        {children}
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </body>
    </html>
  );
}
