// Mock data — Dashboard Lãnh đạo / Điều hành.
// Số liệu giả lập để demo. Khi wire dữ liệu thật, thay layer này bằng aggregations
// từ phiếu báo cáo đánh giá kết quả/hiệu quả đề án XTTM (xem chitieu.docx).

export type KpiTone = 'success' | 'warning' | 'danger' | 'info' | 'default';
export type KpiTrend = 'up' | 'down' | 'flat';

export type ContributorProject = {
  code: string;
  name: string;
  unit: string;
  value: number;
  /** Đơn vị hiển thị bên cạnh value (vd "tỷ USD", "%", "HĐ") */
  valueUnit: string;
  share: number;
};

export type KpiRow = {
  id: string;
  group: KpiGroupKey;
  name: string;
  description?: string;
  unit: string;
  /** Giá trị thực tế kỳ này (đã format sẵn để hiển thị) */
  actualDisplay: string;
  /** Giá trị thực tế dưới dạng số để tính %, sort */
  actual: number;
  /** Mục tiêu kỳ này */
  target: number;
  targetDisplay: string;
  /** % đạt = actual/target — null nếu chỉ tiêu "càng thấp càng tốt" và đã đạt */
  achievement: number | null;
  /** Đánh dấu chỉ tiêu loại "lower-is-better" (vd: Chi phí/HĐ) */
  inverse?: boolean;
  /** Kỳ trước */
  previous: number;
  previousDisplay: string;
  /** Đổi so kỳ trước (% nếu so giá trị, đ nếu so điểm thang 5) */
  deltaDisplay: string;
  deltaDirection: KpiTrend;
  /** Sparkline 5 điểm gần nhất */
  sparkline: number[];
  /** Top 3 đề án đóng góp lớn nhất chỉ tiêu này */
  topProjects: ContributorProject[];
  /** Lát cắt theo loại hình / thị trường để vẽ chart phụ trong drill-down */
  breakdown?: Array<{ label: string; value: number; share: number }>;
  /** Diễn giải bổ sung */
  insight?: string;
};

export type KpiGroupKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type KpiGroup = {
  key: KpiGroupKey;
  title: string;
  description: string;
  accent: 'slate' | 'indigo' | 'emerald' | 'sky' | 'violet' | 'amber';
};

export const KPI_GROUPS: KpiGroup[] = [
  {
    key: 'A',
    title: 'Quy mô triển khai',
    description: 'Số đề án, doanh nghiệp, thị trường, sản phẩm tiếp cận',
    accent: 'indigo',
  },
  {
    key: 'B',
    title: 'Kết quả giao dịch thương mại',
    description: 'Hợp đồng, MOU, giá trị giao dịch, giá trị xuất khẩu phát sinh',
    accent: 'emerald',
  },
  {
    key: 'C',
    title: 'Hiệu quả ngân sách nhà nước',
    description: 'Giải ngân, ROI ngân sách, chi phí bình quân/hợp đồng',
    accent: 'amber',
  },
  {
    key: 'D',
    title: 'Mở rộng thị trường',
    description: 'Thị trường mới, đối tác nhập khẩu, duy trì giao dịch',
    accent: 'sky',
  },
  {
    key: 'E',
    title: 'Tác động doanh nghiệp & ngành hàng',
    description: 'Tăng trưởng doanh thu, KNXK, nâng cao năng lực DN',
    accent: 'violet',
  },
  {
    key: 'F',
    title: 'Đánh giá định tính & bền vững',
    description: 'Mức hài lòng, phù hợp chính sách, bền vững kết quả',
    accent: 'slate',
  },
];

// Hero KPI (6 thẻ top)
export type HeroKpi = {
  id: string;
  label: string;
  value: string;
  subtitle: string;
  delta: string;
  direction: KpiTrend;
  tone: KpiTone;
  icon: 'wallet' | 'rocket' | 'handshake' | 'trending-up' | 'users' | 'star';
  /** id KPI tương ứng trong KPI_ROWS để click drill-down */
  linkedKpiId: string;
};

export const HERO_KPIS: HeroKpi[] = [
  {
    id: 'hero-budget',
    label: 'Ngân sách NN giải ngân',
    value: '245 tỷ',
    subtitle: 'Đạt 88% kế hoạch năm',
    delta: '▲ 18% so 2025',
    direction: 'up',
    tone: 'success',
    icon: 'wallet',
    linkedKpiId: 'C-01',
  },
  {
    id: 'hero-projects-done',
    label: 'Đề án đã nghiệm thu',
    value: '18 / 24',
    subtitle: '6 đề án đang nghiệm thu',
    delta: '▲ 9% so 2025',
    direction: 'up',
    tone: 'info',
    icon: 'rocket',
    linkedKpiId: 'A-01',
  },
  {
    id: 'hero-contract-value',
    label: 'Giá trị HĐ ký kết',
    value: '142,3 tr USD',
    subtitle: '89 hợp đồng · 156 MOU',
    delta: '▲ 22% so 2025',
    direction: 'up',
    tone: 'success',
    icon: 'handshake',
    linkedKpiId: 'B-02',
  },
  {
    id: 'hero-roi',
    label: 'ROI: GD / 1đ NSNN',
    value: '38,5×',
    subtitle: 'Vượt mục tiêu 30× · top DA-08 đạt 95×',
    delta: '▲ 5,8% so 2025',
    direction: 'up',
    tone: 'warning',
    icon: 'trending-up',
    linkedKpiId: 'C-03',
  },
  {
    id: 'hero-firms',
    label: 'DN hưởng lợi',
    value: '412 DN',
    subtitle: '287 DNNVV (70%)',
    delta: '▲ 31% so 2025',
    direction: 'up',
    tone: 'info',
    icon: 'users',
    linkedKpiId: 'A-02',
  },
  {
    id: 'hero-satisfaction',
    label: 'Hài lòng TB (1-5)',
    value: '4,2 ★',
    subtitle: 'Buyer NN: 4,0 · DN: 4,3',
    delta: '▲ 0,1 đ so 2025',
    direction: 'up',
    tone: 'default',
    icon: 'star',
    linkedKpiId: 'F-01',
  },
];

// 22 KPI rows phục vụ bảng matrix
export const KPI_ROWS: KpiRow[] = [
  // ===== A — Quy mô =====
  {
    id: 'A-01',
    group: 'A',
    name: 'Số đề án triển khai',
    description: 'Tổng số đề án XTTM được phê duyệt và triển khai trong năm',
    unit: 'đề án',
    actual: 24,
    actualDisplay: '24',
    target: 30,
    targetDisplay: '30',
    achievement: 80,
    previous: 22,
    previousDisplay: '22',
    deltaDisplay: '▲ 9%',
    deltaDirection: 'up',
    sparkline: [16, 18, 20, 22, 24],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 1, valueUnit: '', share: 4.2 },
      { code: 'DA-12', name: 'Đoàn giao dịch Trung Đông', unit: 'VITAS', value: 1, valueUnit: '', share: 4.2 },
      { code: 'DA-19', name: 'Hội nghị kết nối ASEAN', unit: 'VINATEX', value: 1, valueUnit: '', share: 4.2 },
    ],
    breakdown: [
      { label: 'Hội chợ triển lãm QT', value: 11, share: 46 },
      { label: 'Đoàn giao dịch TM', value: 7, share: 29 },
      { label: 'Kết nối cung cầu', value: 4, share: 17 },
      { label: 'Khác', value: 2, share: 8 },
    ],
  },
  {
    id: 'A-02',
    group: 'A',
    name: 'Số doanh nghiệp tham gia',
    description: 'Tổng DN hưởng lợi từ các đề án (đếm duy nhất)',
    unit: 'DN',
    actual: 412,
    actualDisplay: '412',
    target: 500,
    targetDisplay: '500',
    achievement: 82,
    previous: 314,
    previousDisplay: '314',
    deltaDisplay: '▲ 31%',
    deltaDirection: 'up',
    sparkline: [180, 230, 280, 314, 412],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 68, valueUnit: 'DN', share: 16.5 },
      { code: 'DA-12', name: 'Đoàn giao dịch Trung Đông', unit: 'VITAS', value: 52, valueUnit: 'DN', share: 12.6 },
      { code: 'DA-19', name: 'Hội nghị kết nối ASEAN', unit: 'VINATEX', value: 45, valueUnit: 'DN', share: 10.9 },
    ],
    insight: 'Tỷ lệ DNNVV chiếm 70% — phù hợp định hướng hỗ trợ DN vừa và nhỏ',
  },
  {
    id: 'A-03',
    group: 'A',
    name: 'Số DNNVV trong tổng',
    description: 'DN nhỏ và vừa tham gia (tiêu chí NĐ 80/2021)',
    unit: 'DN',
    actual: 287,
    actualDisplay: '287 (70%)',
    target: 350,
    targetDisplay: '350',
    achievement: 82,
    previous: 220,
    previousDisplay: '220',
    deltaDisplay: '▲ 30%',
    deltaDirection: 'up',
    sparkline: [120, 158, 195, 220, 287],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 48, valueUnit: 'DNNVV', share: 16.7 },
      { code: 'DA-12', name: 'Đoàn giao dịch Trung Đông', unit: 'VITAS', value: 36, valueUnit: 'DNNVV', share: 12.5 },
      { code: 'DA-22', name: 'Triển lãm Gulfood Dubai', unit: 'VASEP', value: 31, valueUnit: 'DNNVV', share: 10.8 },
    ],
  },
  {
    id: 'A-04',
    group: 'A',
    name: 'Số quốc gia/thị trường tiếp cận',
    description: 'Tổng số thị trường nước ngoài có hoạt động XTTM trong năm',
    unit: 'quốc gia',
    actual: 18,
    actualDisplay: '18',
    target: 20,
    targetDisplay: '20',
    achievement: 90,
    previous: 15,
    previousDisplay: '15',
    deltaDisplay: '▲ 20%',
    deltaDirection: 'up',
    sparkline: [11, 12, 14, 15, 18],
    topProjects: [
      { code: 'DA-03', name: 'Tham gia HC Anuga Đức', unit: 'VASEP', value: 1, valueUnit: '', share: 5.6 },
      { code: 'DA-11', name: 'Đoàn XTTM tại Brazil', unit: 'Vinacas', value: 1, valueUnit: '', share: 5.6 },
      { code: 'DA-22', name: 'Triển lãm Gulfood Dubai', unit: 'VASEP', value: 1, valueUnit: '', share: 5.6 },
    ],
    breakdown: [
      { label: 'Châu Á', value: 7, share: 39 },
      { label: 'Châu Âu', value: 5, share: 28 },
      { label: 'Trung Đông - Châu Phi', value: 3, share: 17 },
      { label: 'Châu Mỹ', value: 3, share: 17 },
    ],
  },

  // ===== B — Kết quả giao dịch =====
  {
    id: 'B-01',
    group: 'B',
    name: 'Số hợp đồng ký kết',
    description: 'Hợp đồng thương mại được ký trực tiếp tại đề án',
    unit: 'HĐ',
    actual: 89,
    actualDisplay: '89',
    target: 100,
    targetDisplay: '100',
    achievement: 89,
    previous: 67,
    previousDisplay: '67',
    deltaDisplay: '▲ 33%',
    deltaDirection: 'up',
    sparkline: [38, 49, 58, 67, 89],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 18, valueUnit: 'HĐ', share: 20.2 },
      { code: 'DA-15', name: 'Tham gia HC SIAL Paris', unit: 'VASEP', value: 14, valueUnit: 'HĐ', share: 15.7 },
      { code: 'DA-22', name: 'Triển lãm Gulfood Dubai', unit: 'VASEP', value: 11, valueUnit: 'HĐ', share: 12.4 },
    ],
  },
  {
    id: 'B-02',
    group: 'B',
    name: 'Tổng giá trị hợp đồng',
    description: 'Tổng giá trị HĐ ký kết (USD)',
    unit: 'triệu USD',
    actual: 142.3,
    actualDisplay: '142,3',
    target: 150,
    targetDisplay: '150',
    achievement: 95,
    previous: 116.5,
    previousDisplay: '116,5',
    deltaDisplay: '▲ 22%',
    deltaDirection: 'up',
    sparkline: [62, 78, 92, 116.5, 142.3],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 28.4, valueUnit: 'tr USD', share: 20.0 },
      { code: 'DA-12', name: 'Đoàn giao dịch Trung Đông', unit: 'VITAS', value: 19.7, valueUnit: 'tr USD', share: 13.8 },
      { code: 'DA-15', name: 'Tham gia HC SIAL Paris', unit: 'VASEP', value: 17.2, valueUnit: 'tr USD', share: 12.1 },
    ],
  },
  {
    id: 'B-03',
    group: 'B',
    name: 'Số biên bản ghi nhớ (MOU)',
    description: 'MOU/biên bản hợp tác phát sinh',
    unit: 'MOU',
    actual: 156,
    actualDisplay: '156',
    target: 180,
    targetDisplay: '180',
    achievement: 87,
    previous: 121,
    previousDisplay: '121',
    deltaDisplay: '▲ 29%',
    deltaDirection: 'up',
    sparkline: [72, 86, 105, 121, 156],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 32, valueUnit: 'MOU', share: 20.5 },
      { code: 'DA-19', name: 'Hội nghị kết nối ASEAN', unit: 'VINATEX', value: 24, valueUnit: 'MOU', share: 15.4 },
      { code: 'DA-15', name: 'Tham gia HC SIAL Paris', unit: 'VASEP', value: 18, valueUnit: 'MOU', share: 11.5 },
    ],
  },
  {
    id: 'B-04',
    group: 'B',
    name: 'Giá trị xuất khẩu phát sinh',
    description: 'Tổng giá trị XK phát sinh sau đề án (USD)',
    unit: 'triệu USD',
    actual: 87.4,
    actualDisplay: '87,4',
    target: 100,
    targetDisplay: '100',
    achievement: 87,
    previous: 71.2,
    previousDisplay: '71,2',
    deltaDisplay: '▲ 23%',
    deltaDirection: 'up',
    sparkline: [35, 48, 60, 71.2, 87.4],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 18.7, valueUnit: 'tr USD', share: 21.4 },
      { code: 'DA-19', name: 'Hội nghị kết nối ASEAN', unit: 'VINATEX', value: 12.3, valueUnit: 'tr USD', share: 14.1 },
      { code: 'DA-22', name: 'Triển lãm Gulfood Dubai', unit: 'VASEP', value: 10.8, valueUnit: 'tr USD', share: 12.4 },
    ],
  },

  // ===== C — Hiệu quả NSNN =====
  {
    id: 'C-01',
    group: 'C',
    name: 'Kinh phí NSNN đã giải ngân',
    description: 'Tổng số tiền ngân sách Nhà nước đã thanh toán cho các đề án',
    unit: 'tỷ VNĐ',
    actual: 245,
    actualDisplay: '245',
    target: 280,
    targetDisplay: '280',
    achievement: 88,
    previous: 207,
    previousDisplay: '207',
    deltaDisplay: '▲ 18%',
    deltaDirection: 'up',
    sparkline: [142, 168, 188, 207, 245],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 18.2, valueUnit: 'tỷ VNĐ', share: 7.4 },
      { code: 'DA-12', name: 'Đoàn giao dịch Trung Đông', unit: 'VITAS', value: 15.4, valueUnit: 'tỷ VNĐ', share: 6.3 },
      { code: 'DA-15', name: 'Tham gia HC SIAL Paris', unit: 'VASEP', value: 14.1, valueUnit: 'tỷ VNĐ', share: 5.8 },
    ],
  },
  {
    id: 'C-02',
    group: 'C',
    name: 'Tỷ lệ giải ngân TB',
    description: 'Tỷ lệ giải ngân/duyệt trung bình các đề án trong năm',
    unit: '%',
    actual: 88,
    actualDisplay: '88%',
    target: 95,
    targetDisplay: '95%',
    achievement: 93,
    previous: 82,
    previousDisplay: '82%',
    deltaDisplay: '▲ 6 đ',
    deltaDirection: 'up',
    sparkline: [68, 74, 78, 82, 88],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 96, valueUnit: '%', share: 0 },
      { code: 'DA-15', name: 'Tham gia HC SIAL Paris', unit: 'VASEP', value: 94, valueUnit: '%', share: 0 },
      { code: 'DA-19', name: 'Hội nghị kết nối ASEAN', unit: 'VINATEX', value: 92, valueUnit: '%', share: 0 },
    ],
  },
  {
    id: 'C-03',
    group: 'C',
    name: 'ROI: Giá trị giao dịch / 1đ NSNN',
    description: 'Số đồng giá trị giao dịch thương mại phát sinh trên 1đ ngân sách hỗ trợ',
    unit: 'lần',
    actual: 38.5,
    actualDisplay: '38,5×',
    target: 30,
    targetDisplay: '30×',
    achievement: 128,
    previous: 36.4,
    previousDisplay: '36,4×',
    deltaDisplay: '▲ 5,8%',
    deltaDirection: 'up',
    sparkline: [22.5, 28.1, 32.7, 36.4, 38.5],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 95.2, valueUnit: '×', share: 0 },
      { code: 'DA-12', name: 'Đoàn giao dịch Trung Đông', unit: 'VITAS', value: 62.1, valueUnit: '×', share: 0 },
      { code: 'DA-19', name: 'Hội nghị kết nối ASEAN', unit: 'VINATEX', value: 54.7, valueUnit: '×', share: 0 },
    ],
    insight: 'Vượt 28% so với mục tiêu 30× — chỉ số quan trọng nhất phản ánh hiệu quả NSNN',
  },
  {
    id: 'C-04',
    group: 'C',
    name: 'ROI: Giá trị XK phát sinh / 1đ NSNN',
    description: 'Số đồng kim ngạch XK trên 1đ ngân sách',
    unit: 'lần',
    actual: 23.7,
    actualDisplay: '23,7×',
    target: 20,
    targetDisplay: '20×',
    achievement: 119,
    previous: 22.3,
    previousDisplay: '22,3×',
    deltaDisplay: '▲ 6,3%',
    deltaDirection: 'up',
    sparkline: [14.2, 17.8, 20.5, 22.3, 23.7],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 62.7, valueUnit: '×', share: 0 },
      { code: 'DA-19', name: 'Hội nghị kết nối ASEAN', unit: 'VINATEX', value: 41.3, valueUnit: '×', share: 0 },
      { code: 'DA-22', name: 'Triển lãm Gulfood Dubai', unit: 'VASEP', value: 36.8, valueUnit: '×', share: 0 },
    ],
  },
  {
    id: 'C-05',
    group: 'C',
    name: 'Chi phí TB / hợp đồng ký',
    description: 'Chi phí NSNN bình quân để có 1 hợp đồng — càng thấp càng tốt',
    unit: 'triệu VNĐ',
    actual: 2752,
    actualDisplay: '2.752',
    target: 3000,
    targetDisplay: '<3.000',
    achievement: null,
    inverse: true,
    previous: 3089,
    previousDisplay: '3.089',
    deltaDisplay: '▼ 11%',
    deltaDirection: 'down',
    sparkline: [3650, 3420, 3280, 3089, 2752],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 1011, valueUnit: 'tr/HĐ', share: 0 },
      { code: 'DA-12', name: 'Đoàn giao dịch Trung Đông', unit: 'VITAS', value: 1424, valueUnit: 'tr/HĐ', share: 0 },
      { code: 'DA-19', name: 'Hội nghị kết nối ASEAN', unit: 'VINATEX', value: 1782, valueUnit: 'tr/HĐ', share: 0 },
    ],
    insight: 'Giảm 11% so 2025 — hiệu quả chi tiêu được cải thiện rõ rệt',
  },
  {
    id: 'C-06',
    group: 'C',
    name: 'Tỷ lệ huy động nguồn ngoài NS',
    description: 'Tỷ lệ kinh phí xã hội hóa / DN đối ứng trong tổng kinh phí',
    unit: '%',
    actual: 42,
    actualDisplay: '42%',
    target: 40,
    targetDisplay: '40%',
    achievement: 105,
    previous: 38,
    previousDisplay: '38%',
    deltaDisplay: '▲ 4 đ',
    deltaDirection: 'up',
    sparkline: [28, 32, 35, 38, 42],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 58, valueUnit: '%', share: 0 },
      { code: 'DA-15', name: 'Tham gia HC SIAL Paris', unit: 'VASEP', value: 51, valueUnit: '%', share: 0 },
      { code: 'DA-22', name: 'Triển lãm Gulfood Dubai', unit: 'VASEP', value: 47, valueUnit: '%', share: 0 },
    ],
  },

  // ===== D — Mở rộng thị trường =====
  {
    id: 'D-01',
    group: 'D',
    name: 'Số thị trường XK mới mở',
    description: 'Số thị trường lần đầu có giao dịch xuất khẩu phát sinh',
    unit: 'thị trường',
    actual: 7,
    actualDisplay: '7',
    target: 10,
    targetDisplay: '10',
    achievement: 70,
    previous: 5,
    previousDisplay: '5',
    deltaDisplay: '▲ 40%',
    deltaDirection: 'up',
    sparkline: [2, 3, 4, 5, 7],
    topProjects: [
      { code: 'DA-03', name: 'Tham gia HC Anuga Đức', unit: 'VASEP', value: 2, valueUnit: 'TT', share: 28.6 },
      { code: 'DA-11', name: 'Đoàn XTTM tại Brazil', unit: 'Vinacas', value: 2, valueUnit: 'TT', share: 28.6 },
      { code: 'DA-22', name: 'Triển lãm Gulfood Dubai', unit: 'VASEP', value: 1, valueUnit: 'TT', share: 14.3 },
    ],
  },
  {
    id: 'D-02',
    group: 'D',
    name: 'Số nhà NK/phân phối mới',
    description: 'Đối tác nhập khẩu/phân phối mới thiết lập sau đề án',
    unit: 'đối tác',
    actual: 124,
    actualDisplay: '124',
    target: 150,
    targetDisplay: '150',
    achievement: 83,
    previous: 98,
    previousDisplay: '98',
    deltaDisplay: '▲ 27%',
    deltaDirection: 'up',
    sparkline: [52, 68, 82, 98, 124],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 28, valueUnit: 'đối tác', share: 22.6 },
      { code: 'DA-12', name: 'Đoàn giao dịch Trung Đông', unit: 'VITAS', value: 19, valueUnit: 'đối tác', share: 15.3 },
      { code: 'DA-19', name: 'Hội nghị kết nối ASEAN', unit: 'VINATEX', value: 16, valueUnit: 'đối tác', share: 12.9 },
    ],
  },
  {
    id: 'D-03',
    group: 'D',
    name: '% DN duy trì giao dịch sau đề án',
    description: 'Tỷ lệ DN tiếp tục có giao dịch với đối tác sau khi đề án kết thúc',
    unit: '%',
    actual: 64,
    actualDisplay: '64%',
    target: 70,
    targetDisplay: '70%',
    achievement: 91,
    previous: 58,
    previousDisplay: '58%',
    deltaDisplay: '▲ 6 đ',
    deltaDirection: 'up',
    sparkline: [42, 48, 53, 58, 64],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 78, valueUnit: '%', share: 0 },
      { code: 'DA-15', name: 'Tham gia HC SIAL Paris', unit: 'VASEP', value: 72, valueUnit: '%', share: 0 },
      { code: 'DA-19', name: 'Hội nghị kết nối ASEAN', unit: 'VINATEX', value: 69, valueUnit: '%', share: 0 },
    ],
  },

  // ===== E — Tác động DN =====
  // Lưu ý: phiếu chitieu.docx Phần V KHÔNG quy định mục tiêu định lượng cho
  // các chỉ tiêu tác động — chỉ đo lường xu hướng so với kỳ trước.
  {
    id: 'E-01',
    group: 'E',
    name: 'Tăng trưởng doanh thu TB sau đề án',
    description: 'Tăng trưởng doanh thu trung bình của DN tham gia (sau 3-6 tháng)',
    unit: '%',
    actual: 18.5,
    actualDisplay: '18,5%',
    target: 0,
    targetDisplay: '—',
    achievement: null,
    previous: 16.2,
    previousDisplay: '16,2%',
    deltaDisplay: '▲ 2,3 đ',
    deltaDirection: 'up',
    sparkline: [11.5, 13.2, 14.8, 16.2, 18.5],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 27.4, valueUnit: '%', share: 0 },
      { code: 'DA-15', name: 'Tham gia HC SIAL Paris', unit: 'VASEP', value: 24.1, valueUnit: '%', share: 0 },
      { code: 'DA-12', name: 'Đoàn giao dịch Trung Đông', unit: 'VITAS', value: 21.8, valueUnit: '%', share: 0 },
    ],
  },
  {
    id: 'E-02',
    group: 'E',
    name: 'Tăng trưởng KNXK sau đề án',
    description: 'Tăng trưởng kim ngạch xuất khẩu TB của DN sau đề án',
    unit: '%',
    actual: 24.1,
    actualDisplay: '24,1%',
    target: 0,
    targetDisplay: '—',
    achievement: null,
    previous: 21.8,
    previousDisplay: '21,8%',
    deltaDisplay: '▲ 2,3 đ',
    deltaDirection: 'up',
    sparkline: [15, 17.8, 19.5, 21.8, 24.1],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 34.2, valueUnit: '%', share: 0 },
      { code: 'DA-19', name: 'Hội nghị kết nối ASEAN', unit: 'VINATEX', value: 29.7, valueUnit: '%', share: 0 },
      { code: 'DA-22', name: 'Triển lãm Gulfood Dubai', unit: 'VASEP', value: 26.4, valueUnit: '%', share: 0 },
    ],
  },
  {
    id: 'E-03',
    group: 'E',
    name: '% DN cải thiện năng lực TB',
    description: 'Trung bình 4 tiêu chí: kỹ năng XK, marketing, TMĐT, đạt chứng nhận QT',
    unit: '%',
    actual: 71,
    actualDisplay: '71%',
    target: 0,
    targetDisplay: '—',
    achievement: null,
    previous: 67,
    previousDisplay: '67%',
    deltaDisplay: '▲ 4 đ',
    deltaDirection: 'up',
    sparkline: [52, 58, 62, 67, 71],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 82, valueUnit: '%', share: 0 },
      { code: 'DA-19', name: 'Hội nghị kết nối ASEAN', unit: 'VINATEX', value: 78, valueUnit: '%', share: 0 },
      { code: 'DA-12', name: 'Đoàn giao dịch Trung Đông', unit: 'VITAS', value: 74, valueUnit: '%', share: 0 },
    ],
    breakdown: [
      { label: 'Kỹ năng xuất khẩu', value: 76, share: 0 },
      { label: 'Năng lực marketing', value: 68, share: 0 },
      { label: 'TMĐT / chuyển đổi số', value: 64, share: 0 },
      { label: 'Đạt chứng nhận quốc tế', value: 76, share: 0 },
    ],
  },

  // ===== F — Định tính =====
  {
    id: 'F-01',
    group: 'F',
    name: 'Hài lòng DN tham gia',
    description: 'Mức hài lòng trung bình của DN — thang điểm 1 đến 5',
    unit: 'điểm',
    actual: 4.2,
    actualDisplay: '4,2',
    target: 4.0,
    targetDisplay: '≥ 4,0',
    achievement: 105,
    previous: 4.1,
    previousDisplay: '4,1',
    deltaDisplay: '▲ 0,1 đ',
    deltaDirection: 'up',
    sparkline: [3.6, 3.8, 3.9, 4.1, 4.2],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 4.6, valueUnit: '★', share: 0 },
      { code: 'DA-15', name: 'Tham gia HC SIAL Paris', unit: 'VASEP', value: 4.5, valueUnit: '★', share: 0 },
      { code: 'DA-19', name: 'Hội nghị kết nối ASEAN', unit: 'VINATEX', value: 4.4, valueUnit: '★', share: 0 },
    ],
  },
  {
    id: 'F-02',
    group: 'F',
    name: 'Hài lòng buyer nước ngoài',
    description: 'Mức hài lòng buyer/đối tác nước ngoài — thang điểm 1 đến 5',
    unit: 'điểm',
    actual: 4.0,
    actualDisplay: '4,0',
    target: 4.0,
    targetDisplay: '≥ 4,0',
    achievement: 100,
    previous: 3.8,
    previousDisplay: '3,8',
    deltaDisplay: '▲ 0,2 đ',
    deltaDirection: 'up',
    sparkline: [3.2, 3.4, 3.6, 3.8, 4.0],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 4.5, valueUnit: '★', share: 0 },
      { code: 'DA-15', name: 'Tham gia HC SIAL Paris', unit: 'VASEP', value: 4.3, valueUnit: '★', share: 0 },
      { code: 'DA-22', name: 'Triển lãm Gulfood Dubai', unit: 'VASEP', value: 4.2, valueUnit: '★', share: 0 },
    ],
  },
  {
    id: 'F-03',
    group: 'F',
    name: 'Tính bền vững (TB 4 tiêu chí)',
    description: 'Bền vững HĐ, DN tự khai thác, nhân rộng mô hình, tác động xanh',
    unit: 'điểm',
    actual: 3.8,
    actualDisplay: '3,8',
    target: 4.0,
    targetDisplay: '≥ 4,0',
    achievement: 95,
    previous: 3.6,
    previousDisplay: '3,6',
    deltaDisplay: '▲ 0,2 đ',
    deltaDirection: 'up',
    sparkline: [3.0, 3.2, 3.4, 3.6, 3.8],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 4.3, valueUnit: '★', share: 0 },
      { code: 'DA-19', name: 'Hội nghị kết nối ASEAN', unit: 'VINATEX', value: 4.1, valueUnit: '★', share: 0 },
      { code: 'DA-15', name: 'Tham gia HC SIAL Paris', unit: 'VASEP', value: 4.0, valueUnit: '★', share: 0 },
    ],
    breakdown: [
      { label: 'Duy trì quan hệ sau đề án', value: 4.1, share: 0 },
      { label: 'DN tự khai thác thị trường', value: 3.7, share: 0 },
      { label: 'Nhân rộng mô hình', value: 3.6, share: 0 },
      { label: 'Sản xuất xanh & bền vững', value: 3.8, share: 0 },
    ],
  },
  {
    id: 'F-04',
    group: 'F',
    name: '% đề án phù hợp ≥ 3/4 chính sách',
    description: 'Tỷ lệ đề án phù hợp ≥3 trong 4 định hướng chính sách lớn (XK QG, CĐS, ngành, FTA)',
    unit: '%',
    actual: 92,
    actualDisplay: '92%',
    target: 90,
    targetDisplay: '90%',
    achievement: 102,
    previous: 88,
    previousDisplay: '88%',
    deltaDisplay: '▲ 4 đ',
    deltaDirection: 'up',
    sparkline: [78, 82, 85, 88, 92],
    topProjects: [
      { code: 'DA-08', name: 'Hội chợ Foodex Japan 2026', unit: 'Hiệp hội Da giày VN', value: 4, valueUnit: '/4 CS', share: 0 },
      { code: 'DA-19', name: 'Hội nghị kết nối ASEAN', unit: 'VINATEX', value: 4, valueUnit: '/4 CS', share: 0 },
      { code: 'DA-22', name: 'Triển lãm Gulfood Dubai', unit: 'VASEP', value: 4, valueUnit: '/4 CS', share: 0 },
    ],
    breakdown: [
      { label: 'Chiến lược XK quốc gia', value: 96, share: 0 },
      { label: 'Định hướng chuyển đổi số', value: 88, share: 0 },
      { label: 'Phát triển ngành hàng', value: 95, share: 0 },
      { label: 'Cam kết FTA / hội nhập', value: 90, share: 0 },
    ],
  },
];

// Heatmap đánh giá định tính — trung bình điểm 1-5 trên 16 tiêu chí
export type QualitativeRow = {
  category: string;
  rows: Array<{ label: string; score: number; previousScore: number }>;
};

export const QUALITATIVE_HEATMAP: QualitativeRow[] = [
  {
    category: 'Tổ chức thực hiện',
    rows: [
      { label: 'Phối hợp giữa đơn vị chủ trì và các bên', score: 4.2, previousScore: 3.9 },
      { label: 'Chất lượng chuẩn bị & hậu cần', score: 4.0, previousScore: 3.8 },
      { label: 'Hiệu quả truyền thông trước/sau đề án', score: 3.8, previousScore: 3.6 },
      { label: 'Tính kịp thời của hỗ trợ hành chính', score: 3.9, previousScore: 3.7 },
    ],
  },
  {
    category: 'Tác động doanh nghiệp',
    rows: [
      { label: 'Nâng cao năng lực cạnh tranh DN', score: 4.1, previousScore: 3.8 },
      { label: 'Tham gia chuỗi cung ứng quốc tế', score: 3.7, previousScore: 3.4 },
      { label: 'Nâng cao nhận thức tiêu chuẩn XK', score: 4.0, previousScore: 3.7 },
      { label: 'Thúc đẩy chuyển đổi số XK', score: 3.6, previousScore: 3.3 },
    ],
  },
  {
    category: 'Tác động ngành & thương hiệu QG',
    rows: [
      { label: 'Vị thế ngành hàng VN tại thị trường', score: 4.0, previousScore: 3.7 },
      { label: 'Mở rộng kênh phân phối / đối tác NK', score: 4.1, previousScore: 3.8 },
      { label: 'Đa dạng hóa thị trường XK', score: 4.2, previousScore: 3.9 },
      { label: 'Hình ảnh thương hiệu quốc gia', score: 3.9, previousScore: 3.6 },
    ],
  },
  {
    category: 'Bền vững kết quả',
    rows: [
      { label: 'Duy trì hợp đồng / quan hệ TM', score: 4.1, previousScore: 3.7 },
      { label: 'DN tự tiếp tục khai thác thị trường', score: 3.7, previousScore: 3.4 },
      { label: 'Nhân rộng mô hình cho đề án sau', score: 3.6, previousScore: 3.3 },
      { label: 'Tác động sản xuất xanh & bền vững', score: 3.8, previousScore: 3.5 },
    ],
  },
];

// Filter options
export const CYCLE_YEARS = [2026, 2025, 2024, 2023] as const;
export const COMPARE_YEARS = [2025, 2024, 2023] as const;

export const KIND_FILTERS = [
  { value: 'ALL', label: 'Tất cả loại hình' },
  { value: 'HOI_CHO', label: 'Hội chợ triển lãm QT' },
  { value: 'DOAN_GIAO_DICH', label: 'Đoàn giao dịch TM' },
  { value: 'KET_NOI', label: 'Kết nối cung cầu' },
  { value: 'KHAC', label: 'Khác' },
];

export const SECTOR_FILTERS = [
  { value: 'ALL', label: 'Tất cả ngành hàng' },
  { value: 'NONG_SAN', label: 'Nông sản & thực phẩm' },
  { value: 'DET_MAY', label: 'Dệt may' },
  { value: 'DA_GIAY', label: 'Da giày' },
  { value: 'THUY_SAN', label: 'Thủy sản' },
  { value: 'THU_CONG', label: 'Thủ công mỹ nghệ' },
];

export const MARKET_FILTERS = [
  { value: 'ALL', label: 'Tất cả thị trường' },
  { value: 'EU', label: 'Châu Âu (EU)' },
  { value: 'ASIA', label: 'Châu Á' },
  { value: 'AMERICA', label: 'Châu Mỹ' },
  { value: 'MIDDLE_EAST', label: 'Trung Đông - Châu Phi' },
];
