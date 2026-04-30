export const BREADCRUMB_LABELS: Record<string, string> = {
  '/dashboard': 'Trang chủ',
  '/chuong-trinh': 'Chu kỳ chương trình',
  '/don-vi-chu-tri': 'Đơn vị chủ trì',
  '/don-vi-cua-toi': 'Hồ sơ tổ chức của tôi',
  '/de-an': 'Đề án',
  '/tiep-nhan': 'Tiếp nhận hồ sơ',
  '/tham-dinh': 'Thẩm định',
  '/phe-duyet': 'Phê duyệt',
  '/hop-dong': 'Hợp đồng',
  '/trien-khai': 'Triển khai',
  '/bao-cao': 'Báo cáo kết quả',
  '/nghiem-thu': 'Nghiệm thu',
  '/tai-chinh': 'Tài chính',
  '/thong-bao': 'Thông báo',
  '/danh-muc': 'Danh mục',
  '/nguoi-dung': 'Người dùng',
  '/vai-tro': 'Vai trò & quyền',
  '/cau-hinh': 'Cấu hình',
  '/audit-log': 'Nhật ký truy cập',
  '/nhat-ky': 'Nhật ký truy cập',
  '/de-an/new': 'Tạo đề án mới',
};

export function buildBreadcrumb(pathname: string): Array<{ href: string; label: string }> {
  const segments = pathname.split('/').filter(Boolean);
  const items: Array<{ href: string; label: string }> = [];
  let current = '';
  for (const seg of segments) {
    current += '/' + seg;
    items.push({ href: current, label: BREADCRUMB_LABELS[current] ?? seg });
  }
  return items;
}
