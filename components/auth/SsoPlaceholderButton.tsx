'use client';

import { Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function SsoPlaceholderButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full"
      onClick={() => {
        toast.info('Tính năng đăng nhập SSO sẽ có ở giai đoạn 2 của dự án');
      }}
    >
      <Building2 className="mr-2 h-4 w-4" />
      Đăng nhập SSO Bộ Công Thương
    </Button>
  );
}
