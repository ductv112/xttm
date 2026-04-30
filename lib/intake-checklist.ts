// Phase 6 (M2.4) — Hardcoded checklist hành chính cho chuyên viên kiểm tra hồ sơ.
// Mỗi item chuyên viên đánh giá ✓ (đạt) / ✗ (không đạt) / N/A (không áp dụng) + ghi chú.
// Để xác nhận hồ sơ HỢP LỆ (markValid), tối thiểu 80% items không "✗" (tức ✓ + N/A ≥ 80%).
//
// Source: Quy trình kiểm tra hành chính Cục XTTM + biểu mẫu trong Mau bieu/.
// 12 items chuẩn bao quát: pháp lý đề án, năng lực đơn vị, mục tiêu/nội dung, kế hoạch, dự toán,
// chủ nhiệm, tài liệu đính kèm.

export type ChecklistItemStatus = '✓' | '✗' | 'N/A';

export type ChecklistItem = {
  /** Stable id — dùng làm key trong Project.checklistJson, KHÔNG đổi giữa các phiên bản */
  id: string;
  /** Tiêu đề mục kiểm tra (Vietnamese) */
  label: string;
  /** Mô tả chi tiết yêu cầu của mục */
  description: string;
  /** Mục bắt buộc — nếu false thì N/A là acceptable */
  required: boolean;
};

export type ChecklistEntry = {
  itemId: string;
  status: ChecklistItemStatus;
  note?: string;
};

export type Checklist = {
  items: ChecklistEntry[];
  updatedAt?: string;
};

export const CHECKLIST_ITEMS: readonly ChecklistItem[] = [
  {
    id: 'CHK-01-LEGAL-SIGNATURE',
    label: 'Đề án có chữ ký + dấu mộc của người đại diện hợp pháp',
    description:
      'Bản đề án PDF có chữ ký gốc và đóng dấu của người đại diện theo pháp luật của đơn vị chủ trì (Chủ tịch / Tổng giám đốc / người được ủy quyền).',
    required: true,
  },
  {
    id: 'CHK-02-LEGAL-CAPACITY',
    label: 'Tài liệu năng lực hoạt động đính kèm đầy đủ',
    description:
      'Giấy đăng ký hoạt động, điều lệ tổ chức, hồ sơ năng lực 3 năm gần nhất (kèm theo doanh thu / số lượng hội viên / dự án XTTM đã triển khai).',
    required: true,
  },
  {
    id: 'CHK-03-OBJECTIVE-CLARITY',
    label: 'Mục tiêu và nội dung rõ ràng, có chỉ tiêu đo lường',
    description:
      'Mục tiêu định lượng (số DN tham gia, giá trị hợp đồng dự kiến, số buyer kết nối...) — không chấp nhận mô tả chung chung không đo lường được.',
    required: true,
  },
  {
    id: 'CHK-04-PLAN-DETAIL',
    label: 'Kế hoạch chi tiết có hạng mục, thời gian, người phụ trách',
    description:
      'Bảng kế hoạch tối thiểu 4 hạng mục, mỗi hạng mục ghi rõ deliverable, due date và owner. Tổng thời gian khớp với thời gian sự kiện.',
    required: true,
  },
  {
    id: 'CHK-05-BUDGET-MATCH-PLAN',
    label: 'Dự toán kinh phí khớp với kế hoạch',
    description:
      'Mỗi hạng mục dự toán có thể đối chiếu được với hạng mục công việc trong kế hoạch. Phân biệt rõ nguồn ngân sách Nhà nước vs đối ứng đơn vị.',
    required: true,
  },
  {
    id: 'CHK-06-BUDGET-WITHIN-LIMIT',
    label: 'Tổng dự toán nằm trong khung định mức cho phép',
    description:
      'Đối chiếu với khung định mức của Chu kỳ Chương trình (TT số 11/2019/TT-BTC). Mỗi loại hạng mục không vượt mức trần (ví dụ thuê mặt bằng triển lãm tối đa 2 triệu/m²).',
    required: true,
  },
  {
    id: 'CHK-07-PM-INFO',
    label: 'Chủ nhiệm đề án có thông tin đầy đủ',
    description:
      'Họ tên, chức vụ, số điện thoại, email công vụ, lý lịch khoa học (đối với hội nghị/đào tạo).',
    required: true,
  },
  {
    id: 'CHK-08-MARKET-COUNTRY',
    label: 'Thị trường + quốc gia khai báo phù hợp loại đề án',
    description:
      'Đề án "Đoàn ra nước ngoài" phải ghi rõ quốc gia đến; đề án "Triển lãm xuất khẩu" phải có thị trường mục tiêu cụ thể trong danh mục.',
    required: true,
  },
  {
    id: 'CHK-09-CONSULATE-CONTACT',
    label: 'Có kế hoạch liên hệ thương vụ Việt Nam (đối với hoạt động ở nước ngoài)',
    description:
      'Bắt buộc đối với đoàn ra / triển lãm nước ngoài: có mục tả việc phối hợp với Thương vụ ÐSQ Việt Nam tại nước sở tại 30 ngày trước sự kiện.',
    required: false,
  },
  {
    id: 'CHK-10-PRECEDENT-OUTCOME',
    label: 'Báo cáo kết quả đề án XTTM tương tự năm trước (nếu có)',
    description:
      'Nếu đơn vị đã từng tham gia chương trình tương tự, đính kèm báo cáo kết quả + minh chứng để đánh giá năng lực thực thi.',
    required: false,
  },
  {
    id: 'CHK-11-SUSTAINABILITY',
    label: 'Có cam kết tính bền vững / đối ứng nguồn lực sau dự án',
    description:
      'Đơn vị cam kết tiếp tục duy trì kết quả của đề án (ví dụ duy trì showroom, tiếp tục truyền thông số) trong tối thiểu 12 tháng sau khi chương trình kết thúc.',
    required: false,
  },
  {
    id: 'CHK-12-COMPLIANCE',
    label: 'Tuân thủ Quy định 28/2018/NĐ-CP và TT 11/2019/TT-BTC',
    description:
      'Đề án không vi phạm các điều cấm/giới hạn trong Nghị định 28 (về XTTM) và Thông tư 11 (về quản lý ngân sách XTTM cấp Nhà nước).',
    required: true,
  },
] as const;

export const CHECKLIST_PASS_THRESHOLD = 0.8; // ≥ 80% items checked (✓ or N/A) cần thiết để mark VALID

/**
 * Parse checklist JSON từ Project.checklistJson với safe defaults.
 */
export function parseChecklist(raw: string | null | undefined): Checklist {
  if (!raw) return { items: [] };
  try {
    const v = JSON.parse(raw);
    if (v && typeof v === 'object') {
      const items = Array.isArray((v as Checklist).items)
        ? ((v as Checklist).items as ChecklistEntry[])
        : [];
      return { items, updatedAt: (v as Checklist).updatedAt };
    }
    return { items: [] };
  } catch {
    return { items: [] };
  }
}

/**
 * Tính tỷ lệ items đã checked (✓ hoặc N/A) trên tổng items REQUIRED.
 * Nếu chuyên viên đã đánh dấu '✗' → coi như chưa pass mục đó.
 *
 * Returns ratio 0..1.
 */
export function computeChecklistPassRatio(checklist: Checklist): {
  passed: number;
  total: number;
  ratio: number;
  failedItemIds: string[];
} {
  const requiredItems = CHECKLIST_ITEMS.filter((i) => i.required);
  const total = requiredItems.length;
  const entryByItemId = new Map(
    checklist.items.map((e) => [e.itemId, e] as const),
  );

  let passed = 0;
  const failedItemIds: string[] = [];
  for (const item of requiredItems) {
    const entry = entryByItemId.get(item.id);
    if (!entry) {
      failedItemIds.push(item.id);
      continue;
    }
    if (entry.status === '✓' || entry.status === 'N/A') {
      passed += 1;
    } else {
      failedItemIds.push(item.id);
    }
  }
  const ratio = total === 0 ? 0 : passed / total;
  return { passed, total, ratio, failedItemIds };
}

/**
 * Validate that all items in input have valid itemId + status. Drops invalid entries.
 */
export function sanitizeChecklistInput(
  input: { itemId: string; status: string; note?: string }[],
): ChecklistEntry[] {
  const validIds = new Set(CHECKLIST_ITEMS.map((i) => i.id));
  const validStatuses: ChecklistItemStatus[] = ['✓', '✗', 'N/A'];
  const seen = new Set<string>();
  const out: ChecklistEntry[] = [];
  for (const e of input) {
    if (!e || typeof e.itemId !== 'string') continue;
    if (!validIds.has(e.itemId)) continue;
    if (seen.has(e.itemId)) continue;
    if (!validStatuses.includes(e.status as ChecklistItemStatus)) continue;
    seen.add(e.itemId);
    out.push({
      itemId: e.itemId,
      status: e.status as ChecklistItemStatus,
      note: typeof e.note === 'string' ? e.note.slice(0, 500) : undefined,
    });
  }
  return out;
}
