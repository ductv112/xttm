'use client';

// RejectionAlert — red Alert hiển thị lý do BQL từ chối + button "Chỉnh sửa và gửi lại".
// Status REJECTED → đơn vị có thể edit (transition về DRAFT khi edit lần đầu — nhưng
// ở plan này transition tự xảy ra qua updateMyProfile gọi update mọi field).
// Visible chỉ khi profile.status === 'REJECTED'.

import { XCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export type RejectionAlertProps = {
  reason: string | null;
};

export function RejectionAlert({ reason }: RejectionAlertProps) {
  if (!reason) return null;

  return (
    <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
      <XCircle className="h-5 w-5" aria-hidden="true" />
      <AlertTitle className="text-red-900 font-semibold">
        Hồ sơ bị từ chối — vui lòng bổ sung
      </AlertTitle>
      <AlertDescription className="text-red-800 mt-2 whitespace-pre-line">
        <strong>Lý do từ Ban quản lý CT XTTM:</strong>
        <p className="mt-1.5">{reason}</p>
        <p className="mt-3 text-sm text-red-700">
          Vui lòng cập nhật các trường tương ứng và sử dụng nút <strong>Gửi lại xác nhận</strong> ở cột bên phải.
        </p>
      </AlertDescription>
    </Alert>
  );
}

export default RejectionAlert;
