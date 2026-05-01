// /cham-diem-so-bo — DEPRECATED route. Đã gộp vào /kiem-tra (tab "Chấm điểm sơ bộ").
// Trang detail /cham-diem-so-bo/[id] vẫn giữ nguyên cho actual scoring screen.
// Redirect tới tab Chấm điểm trong /kiem-tra để giữ tương thích với link cũ.

import { redirect } from 'next/navigation';

export default function ChamDiemSoBoIndexPage() {
  redirect('/kiem-tra#cham-diem');
}
