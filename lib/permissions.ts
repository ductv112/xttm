import { ROLES, type Role } from './constants';

export type Resource =
  | 'chuong-trinh'
  | 'don-vi-chu-tri'
  | 'de-an'
  | 'tiep-nhan'
  | 'tham-dinh'
  | 'phe-duyet'
  | 'hop-dong'
  | 'trien-khai'
  | 'bao-cao'
  | 'nghiem-thu'
  | 'tai-chinh'
  | 'danh-muc'
  | 'nguoi-dung'
  | 'vai-tro'
  | 'cau-hinh'
  | 'audit-log'
  | 'thong-bao'
  | 'dashboard';

export type Action =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'submit'
  | 'approve'
  | 'assign'
  | 'score';

export const ALL_ACTIONS: readonly Action[] = [
  'read',
  'create',
  'update',
  'delete',
  'submit',
  'approve',
  'assign',
  'score',
] as const;

const MATRIX: Record<Resource, Partial<Record<Action, Role[]>>> = {
  dashboard: {
    read: [
      ROLES.ADMIN,
      ROLES.BANQL,
      ROLES.CHUYENVIEN,
      ROLES.HOIDONG,
      ROLES.DONVI,
      ROLES.TAICHINH,
      ROLES.LANHDAO,
    ],
  },
  'chuong-trinh': {
    read: [ROLES.ADMIN, ROLES.BANQL, ROLES.DONVI, ROLES.HOIDONG, ROLES.LANHDAO],
    create: [ROLES.BANQL],
    update: [ROLES.BANQL],
    approve: [ROLES.LANHDAO],
  },
  'don-vi-chu-tri': {
    read: [ROLES.ADMIN, ROLES.BANQL, ROLES.DONVI, ROLES.LANHDAO],
    create: [ROLES.DONVI],
    update: [ROLES.DONVI],
    approve: [ROLES.BANQL],
  },
  'de-an': {
    read: [ROLES.ADMIN, ROLES.BANQL, ROLES.CHUYENVIEN, ROLES.HOIDONG, ROLES.DONVI, ROLES.LANHDAO],
    create: [ROLES.DONVI],
    update: [ROLES.DONVI, ROLES.BANQL],
    submit: [ROLES.DONVI],
    approve: [ROLES.LANHDAO],
    assign: [ROLES.BANQL],
  },
  'tiep-nhan': {
    read: [ROLES.ADMIN, ROLES.BANQL, ROLES.CHUYENVIEN],
    create: [ROLES.BANQL],
    update: [ROLES.BANQL, ROLES.CHUYENVIEN],
    assign: [ROLES.BANQL],
  },
  'tham-dinh': {
    read: [ROLES.ADMIN, ROLES.BANQL, ROLES.HOIDONG, ROLES.LANHDAO],
    score: [ROLES.HOIDONG],
    create: [ROLES.BANQL],
  },
  'phe-duyet': {
    read: [ROLES.ADMIN, ROLES.BANQL, ROLES.LANHDAO, ROLES.DONVI],
    create: [ROLES.BANQL],
    approve: [ROLES.LANHDAO],
  },
  'hop-dong': {
    read: [ROLES.ADMIN, ROLES.BANQL, ROLES.DONVI, ROLES.TAICHINH, ROLES.LANHDAO],
    create: [ROLES.BANQL],
    update: [ROLES.BANQL],
  },
  'trien-khai': {
    read: [ROLES.ADMIN, ROLES.BANQL, ROLES.DONVI, ROLES.LANHDAO],
    create: [ROLES.DONVI],
    update: [ROLES.DONVI],
  },
  'bao-cao': {
    read: [ROLES.ADMIN, ROLES.BANQL, ROLES.DONVI, ROLES.LANHDAO],
    create: [ROLES.DONVI],
    update: [ROLES.DONVI],
    submit: [ROLES.DONVI],
  },
  'nghiem-thu': {
    read: [ROLES.ADMIN, ROLES.BANQL, ROLES.DONVI, ROLES.LANHDAO],
    create: [ROLES.BANQL],
    update: [ROLES.BANQL],
  },
  'tai-chinh': {
    read: [ROLES.ADMIN, ROLES.BANQL, ROLES.TAICHINH, ROLES.LANHDAO],
    create: [ROLES.TAICHINH],
    update: [ROLES.TAICHINH],
  },
  'danh-muc': {
    read: [ROLES.ADMIN, ROLES.BANQL],
    create: [ROLES.ADMIN],
    update: [ROLES.ADMIN],
    delete: [ROLES.ADMIN],
  },
  'nguoi-dung': {
    read: [ROLES.ADMIN],
    create: [ROLES.ADMIN],
    update: [ROLES.ADMIN],
    delete: [ROLES.ADMIN],
  },
  'vai-tro': {
    read: [ROLES.ADMIN],
    create: [ROLES.ADMIN],
    update: [ROLES.ADMIN],
  },
  'cau-hinh': {
    read: [ROLES.ADMIN],
    update: [ROLES.ADMIN],
  },
  'audit-log': {
    read: [ROLES.ADMIN, ROLES.LANHDAO],
  },
  'thong-bao': {
    read: [
      ROLES.ADMIN,
      ROLES.BANQL,
      ROLES.CHUYENVIEN,
      ROLES.HOIDONG,
      ROLES.DONVI,
      ROLES.TAICHINH,
      ROLES.LANHDAO,
    ],
  },
};

export function can(role: Role, resource: Resource, action: Action): boolean {
  return MATRIX[resource]?.[action]?.includes(role) ?? false;
}

/**
 * Read-only MATRIX export for seed scripts and admin "Re-sync from defaults"
 * server action. Consumers MUST treat this as immutable — runtime grants are
 * persisted in DB (Role+Permission+RolePermission) and managed via /vai-tro UI.
 */
export const MATRIX_FOR_SEED: Readonly<typeof MATRIX> = MATRIX;

export type MenuItem = {
  href: string;
  label: string;
  icon: string;
  resource: Resource;
  section: 'NGHIEP_VU' | 'QUAN_TRI';
};

const ALL_MENU_ITEMS: MenuItem[] = [
  {
    href: '/dashboard',
    label: 'Trang chủ',
    icon: 'layout-dashboard',
    resource: 'dashboard',
    section: 'NGHIEP_VU',
  },
  {
    href: '/chuong-trinh',
    label: 'Chu kỳ chương trình',
    icon: 'calendar-range',
    resource: 'chuong-trinh',
    section: 'NGHIEP_VU',
  },
  {
    href: '/don-vi-chu-tri',
    label: 'Đơn vị chủ trì',
    icon: 'building-2',
    resource: 'don-vi-chu-tri',
    section: 'NGHIEP_VU',
  },
  {
    href: '/de-an',
    label: 'Đề án',
    icon: 'file-text',
    resource: 'de-an',
    section: 'NGHIEP_VU',
  },
  {
    href: '/tiep-nhan',
    label: 'Tiếp nhận hồ sơ',
    icon: 'inbox',
    resource: 'tiep-nhan',
    section: 'NGHIEP_VU',
  },
  {
    href: '/tham-dinh',
    label: 'Thẩm định',
    icon: 'gavel',
    resource: 'tham-dinh',
    section: 'NGHIEP_VU',
  },
  {
    href: '/phe-duyet',
    label: 'Phê duyệt',
    icon: 'check-square',
    resource: 'phe-duyet',
    section: 'NGHIEP_VU',
  },
  {
    href: '/hop-dong',
    label: 'Hợp đồng',
    icon: 'file-signature',
    resource: 'hop-dong',
    section: 'NGHIEP_VU',
  },
  {
    href: '/trien-khai',
    label: 'Triển khai',
    icon: 'play-circle',
    resource: 'trien-khai',
    section: 'NGHIEP_VU',
  },
  {
    href: '/bao-cao',
    label: 'Báo cáo kết quả',
    icon: 'file-bar-chart',
    resource: 'bao-cao',
    section: 'NGHIEP_VU',
  },
  {
    href: '/nghiem-thu',
    label: 'Nghiệm thu',
    icon: 'clipboard-check',
    resource: 'nghiem-thu',
    section: 'NGHIEP_VU',
  },
  {
    href: '/tai-chinh',
    label: 'Tài chính',
    icon: 'wallet',
    resource: 'tai-chinh',
    section: 'NGHIEP_VU',
  },
  {
    href: '/thong-bao',
    label: 'Thông báo',
    icon: 'bell',
    resource: 'thong-bao',
    section: 'NGHIEP_VU',
  },
  {
    href: '/danh-muc',
    label: 'Danh mục',
    icon: 'list',
    resource: 'danh-muc',
    section: 'QUAN_TRI',
  },
  {
    href: '/nguoi-dung',
    label: 'Người dùng',
    icon: 'users',
    resource: 'nguoi-dung',
    section: 'QUAN_TRI',
  },
  {
    href: '/vai-tro',
    label: 'Vai trò & quyền',
    icon: 'shield',
    resource: 'vai-tro',
    section: 'QUAN_TRI',
  },
  {
    href: '/cau-hinh',
    label: 'Cấu hình',
    icon: 'settings',
    resource: 'cau-hinh',
    section: 'QUAN_TRI',
  },
  {
    href: '/nhat-ky',
    label: 'Nhật ký truy cập',
    icon: 'history',
    resource: 'audit-log',
    section: 'QUAN_TRI',
  },
];

export function getMenuItems(role: Role): MenuItem[] {
  return ALL_MENU_ITEMS.filter((item) => can(role, item.resource, 'read'));
}

export function defaultLandingPath(role: Role): string {
  if (role === ROLES.ADMIN) return '/dashboard';
  if (role === ROLES.BANQL) return '/dashboard';
  if (role === ROLES.CHUYENVIEN) return '/tiep-nhan';
  if (role === ROLES.HOIDONG) return '/tham-dinh';
  if (role === ROLES.DONVI) return '/de-an';
  if (role === ROLES.TAICHINH) return '/tai-chinh';
  if (role === ROLES.LANHDAO) return '/dashboard';
  return '/dashboard';
}
