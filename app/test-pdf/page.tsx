import Link from 'next/link';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'PDF Spike — Quyết định mẫu' };

export default function TestPdfPage() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-slate-50 p-6 md:p-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileText className="h-6 w-6 text-blue-700" />
            PDF Spike — Quyết định mẫu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Trang này dùng để kiểm tra @react-pdf/renderer + Be Vietnam Pro static TTF có
            render đầy đủ dấu tiếng Việt (á à ả ã ạ ắ ằ ẳ ẵ ặ ấ ầ ẩ ẫ ậ đ Đ ê ô ơ ư ý ỳ ỷ ỹ ỵ)
            hay không. Đây là spike test bắt buộc của M0 trước khi Phase 7 (M3) build Tờ trình
            và Quyết định phê duyệt PDF chuẩn công văn.
          </p>

          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <strong>Smoke test:</strong> Mở file PDF trong Chrome / Edge / Adobe Reader và
            kiểm tra tất cả ký tự có dấu hiển thị đúng, không bị vỡ thành ô vuông □ hoặc dấu
            hỏi ?.
          </div>

          <div className="flex flex-row gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/api/pdf/spike" target="_blank" rel="noopener">
                <Download className="mr-2 h-4 w-4" />
                Mở/tải PDF mẫu
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Quay về đăng nhập</Link>
            </Button>
          </div>

          <details className="border-t border-slate-200 pt-4 text-sm text-slate-500">
            <summary className="cursor-pointer text-slate-600">Chi tiết kỹ thuật</summary>
            <ul className="list-disc space-y-1 pt-2 pl-6">
              <li>Library: @react-pdf/renderer 4.x (frozen Plan 01)</li>
              <li>Font: Be Vietnam Pro static TTF Regular/Bold/Italic (~400KB total)</li>
              <li>Layout: A4, padding 40pt, header công văn 2 cột chuẩn Bộ CT</li>
              <li>
                Watermark: &quot;BẢN MẪU&quot; diagonal -30deg, red rgba(220, 38, 38, 0.15)
              </li>
              <li>Signature block: KT. CỤC TRƯỞNG / PHÓ CỤC TRƯỞNG</li>
              <li>Reference: Nghị định 28/2018/NĐ-CP về quản lý ngoại thương</li>
            </ul>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
