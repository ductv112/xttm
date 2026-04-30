import { LayoutDashboard } from 'lucide-react';
import { auth } from '@/lib/auth';
import { ROLE_LABELS, type Role } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = { title: 'Trang chủ' };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null; // (app) layout redirect; guard for TS narrowing

  const { fullName, role, organizationName } = session.user;
  const roleLabel = ROLE_LABELS[role as Role];
  const roleLine =
    organizationName != null ? `${roleLabel} · ${organizationName}` : roleLabel;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Xin chào, {fullName}</h1>
        <p className="text-sm text-slate-600 mt-1">
          Bạn đang đăng nhập với vai trò {roleLine}
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center text-center gap-3 py-12">
          <LayoutDashboard className="h-12 w-12 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900">
            Trang chủ đang được xây dựng
          </h2>
          <p className="text-sm text-slate-600 max-w-md">
            Các tính năng nghiệp vụ sẽ xuất hiện ở các phase tiếp theo của dự án
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
