export const TERMS = {
  DE_AN: 'Đề án',
  CHU_KY_CHUONG_TRINH: 'Chu kỳ chương trình',
  DON_VI_CHU_TRI: 'Đơn vị chủ trì',
  KIEM_TRA_HO_SO: 'Kiểm tra hồ sơ',
  THAM_DINH: 'Thẩm định',
  PHE_DUYET: 'Phê duyệt',
  NGHIEM_THU: 'Nghiệm thu',
  THANH_LY_HOP_DONG: 'Thanh lý hợp đồng',
  QUYET_TOAN: 'Quyết toán',
  TAM_UNG: 'Tạm ứng',
  THUONG_VU: 'Thương vụ',
  HO_SO: 'Hồ sơ',
  TO_TRINH: 'Tờ trình',
  QUYET_DINH: 'Quyết định',
  HOI_DONG_THAM_DINH: 'Hội đồng thẩm định',
  CHUYEN_VIEN: 'Chuyên viên',
  BAN_QUAN_LY: 'Ban quản lý CT XTTM',
  DIEU_CHINH: 'Điều chỉnh',
  TRIEN_KHAI: 'Triển khai',
  BAO_CAO: 'Báo cáo',
  CONG_VAN: 'Công văn',
} as const;

export type TermKey = keyof typeof TERMS;

export const ROLES = {
  ADMIN: 'ADMIN',
  BANQL: 'BANQL',
  CHUYENVIEN: 'CHUYENVIEN',
  HOIDONG: 'HOIDONG',
  DONVI: 'DONVI',
  TAICHINH: 'TAICHINH',
  LANHDAO: 'LANHDAO',
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Quản trị viên',
  BANQL: 'Ban quản lý CT XTTM',
  CHUYENVIEN: 'Chuyên viên kiểm tra',
  HOIDONG: 'Hội đồng thẩm định',
  DONVI: 'Đơn vị chủ trì',
  TAICHINH: 'Tài chính',
  LANHDAO: 'Lãnh đạo',
};

export const ORG_CODES = {
  CUC_XTTM: 'CUC_XTTM',
  BO_CT: 'BO_CT',
  VITAS: 'VITAS',
  LEFASO: 'LEFASO',
  VINATEX: 'VINATEX',
  VASEP: 'VASEP',
  VCCI: 'VCCI',
} as const;
export type OrgCode = (typeof ORG_CODES)[keyof typeof ORG_CODES];

export const ORG_NAMES: Record<OrgCode, string> = {
  CUC_XTTM: 'Cục Xúc tiến Thương mại',
  BO_CT: 'Bộ Công Thương',
  VITAS: 'Hiệp hội Dệt may Việt Nam',
  LEFASO: 'Hiệp hội Da giày - Túi xách Việt Nam',
  VINATEX: 'Tập đoàn Dệt May Việt Nam',
  VASEP: 'Hiệp hội Chế biến và Xuất khẩu Thủy sản Việt Nam',
  VCCI: 'Liên đoàn Thương mại và Công nghiệp Việt Nam',
};

export const HARDCODED_USERS = [
  {
    username: 'admin',
    password: 'Admin@123',
    role: 'ADMIN',
    orgCode: null,
    fullName: 'Nguyễn Văn Quản',
    email: 'admin@xttm.gov.vn',
  },
  {
    username: 'banql',
    password: 'Banql@123',
    role: 'BANQL',
    orgCode: 'CUC_XTTM',
    fullName: 'Trần Thị Bích Ngọc',
    email: 'banql@xttm.gov.vn',
  },
  {
    username: 'chuyenvien',
    password: 'Cv@123',
    role: 'CHUYENVIEN',
    orgCode: 'CUC_XTTM',
    fullName: 'Lê Quang Cường',
    email: 'chuyenvien@xttm.gov.vn',
  },
  {
    username: 'hoidong',
    password: 'Hd@123',
    role: 'HOIDONG',
    orgCode: 'CUC_XTTM',
    fullName: 'PGS.TS. Phạm Thanh Dũng',
    email: 'hoidong@xttm.gov.vn',
  },
  {
    username: 'donvi1',
    password: 'Donvi@123',
    role: 'DONVI',
    orgCode: 'LEFASO',
    fullName: 'Hoàng Mai Linh',
    email: 'donvi1@lefaso.org.vn',
  },
  {
    username: 'donvi2',
    password: 'Donvi@123',
    role: 'DONVI',
    orgCode: 'VITAS',
    fullName: 'Vũ Đức Minh',
    email: 'donvi2@vitas.org.vn',
  },
  {
    username: 'taichinh',
    password: 'Tc@123',
    role: 'TAICHINH',
    orgCode: 'CUC_XTTM',
    fullName: 'Đặng Thu Hà',
    email: 'taichinh@xttm.gov.vn',
  },
  {
    username: 'lanhdao',
    password: 'Ld@123',
    role: 'LANHDAO',
    orgCode: 'BO_CT',
    fullName: 'Bùi Xuân Hồng',
    email: 'lanhdao@moit.gov.vn',
  },
] as const;

export type HardcodedUser = (typeof HARDCODED_USERS)[number];

export const SLA_THRESHOLDS = {
  CONTRACT_DAYS: 60,
  REPORT_DAYS: 15,
  CONSULATE_DAYS: 30,
  REGISTRATION_DEADLINE_MMDD: '05-30',
} as const;

export const PROGRAM_CYCLE_STATUS = {
  DRAFT: 'DRAFT',
  READY: 'READY',
  OPEN_REGISTRATION: 'OPEN_REGISTRATION',
  CLOSED_REGISTRATION: 'CLOSED_REGISTRATION',
  EVALUATING: 'EVALUATING',
  APPROVED: 'APPROVED',
  COMPLETED: 'COMPLETED',
} as const;

export const PROJECT_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  RECEIVED: 'RECEIVED',
  ASSIGNED: 'ASSIGNED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  RETURNED_FOR_REVISION: 'RETURNED_FOR_REVISION',
  VALIDATED: 'VALIDATED',
  EVALUATING: 'EVALUATING',
  EVALUATED: 'EVALUATED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CONTRACTED: 'CONTRACTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  LIQUIDATED: 'LIQUIDATED',
  CANCELLED: 'CANCELLED',
} as const;

export const STATUS_LABELS = {
  PROGRAM_CYCLE: {
    DRAFT: 'Bản nháp',
    READY: 'Sẵn sàng',
    OPEN_REGISTRATION: 'Đang mở đăng ký',
    CLOSED_REGISTRATION: 'Đã đóng đăng ký',
    EVALUATING: 'Đang thẩm định',
    APPROVED: 'Đã phê duyệt',
    COMPLETED: 'Hoàn thành',
  },
  PROJECT: {
    DRAFT: 'Đang khai báo',
    SUBMITTED: 'Đã nộp',
    RECEIVED: 'Đã tiếp nhận',
    ASSIGNED: 'Đã phân công',
    UNDER_REVIEW: 'Đang kiểm tra',
    RETURNED_FOR_REVISION: 'Yêu cầu bổ sung',
    VALIDATED: 'Hợp lệ',
    EVALUATING: 'Đang thẩm định',
    EVALUATED: 'Đã thẩm định',
    APPROVED: 'Đã phê duyệt',
    REJECTED: 'Bị từ chối',
    CONTRACTED: 'Đã ký HĐ',
    IN_PROGRESS: 'Đang triển khai',
    COMPLETED: 'Đã nghiệm thu',
    LIQUIDATED: 'Đã thanh lý',
    CANCELLED: 'Đã hủy',
  },
} as const;
