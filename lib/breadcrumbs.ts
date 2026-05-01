export const BREADCRUMB_LABELS: Record<string, string> = {
  '/dashboard': 'Trang chủ',
  '/chuong-trinh': 'Chu kỳ chương trình',
  '/don-vi-chu-tri': 'Đơn vị chủ trì',
  '/don-vi-cua-toi': 'Hồ sơ tổ chức của tôi',
  '/de-an': 'Đề án',
  '/tiep-nhan': 'Tiếp nhận hồ sơ',
  '/tham-dinh': 'Thẩm định',
  '/hoi-dong': 'Hội đồng thẩm định',
  '/phe-duyet': 'Phê duyệt',
  '/hop-dong': 'Hợp đồng',
  '/trien-khai': 'Triển khai',
  '/bao-cao': 'Báo cáo kết quả',
  '/nghiem-thu': 'Nghiệm thu',
  '/tai-chinh': 'Tài chính',
  '/thong-bao': 'Thông báo',
  '/danh-muc': 'Danh mục',
  '/danh-muc/loai-de-an': 'Loại đề án',
  '/danh-muc/nganh-hang': 'Ngành hàng',
  '/danh-muc/thi-truong': 'Thị trường',
  '/danh-muc/loai-hinh-xttm': 'Loại hình XTTM',
  '/danh-muc/quoc-gia': 'Quốc gia',
  '/danh-muc/don-vi': 'Đơn vị',
  '/danh-muc/tieu-chi-cham-diem': 'Tiêu chí chấm điểm',
  '/danh-muc/mau-van-ban': 'Mẫu văn bản',
  '/nguoi-dung': 'Người dùng',
  '/nguoi-dung/new': 'Tạo người dùng mới',
  '/vai-tro': 'Vai trò & quyền',
  '/cau-hinh': 'Cấu hình',
  '/audit-log': 'Nhật ký truy cập',
  '/nhat-ky': 'Nhật ký truy cập',
  '/de-an/new': 'Tạo đề án mới',
  '/chuong-trinh/new': 'Tạo chu kỳ mới',
  '/kiem-tra': 'Kiểm tra hồ sơ',
  '/cham-diem-so-bo': 'Chấm điểm sơ bộ',
  '/phan-cong': 'Phân công',
  '/dieu-chinh': 'Điều chỉnh đề án',
};

export function buildBreadcrumb(pathname: string): Array<{ href: string; label: string }> {
  const segments = pathname.split('/').filter(Boolean);
  const items: Array<{ href: string; label: string }> = [];
  let current = '';
  for (const seg of segments) {
    current += '/' + seg;
    // Try exact match first; fallback to humanized segment (replace - with space, capitalize)
    const label = BREADCRUMB_LABELS[current];
    if (label) {
      items.push({ href: current, label });
    } else {
      // For dynamic segments (UUIDs, IDs) — show "Chi tiết" instead of raw slug
      const isLikelyId =
        /^[0-9a-f-]{20,}$/i.test(seg) || /^\d+$/.test(seg);
      const humanized = isLikelyId
        ? 'Chi tiết'
        : seg
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
      items.push({ href: current, label: humanized });
    }
  }
  return items;
}
