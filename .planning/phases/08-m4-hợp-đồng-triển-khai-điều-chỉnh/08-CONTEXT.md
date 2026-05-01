# Phase 8: M4 Hợp đồng + Triển khai + Điều chỉnh - Context

**Gathered:** 2026-05-01

<domain>
Sau khi đề án phê duyệt → ký HĐ → triển khai theo kế hoạch → cảnh báo SLA + điều chỉnh đề án (Điều 13 NĐ 28).

**In scope (26 reqs):** CONTRACT-01..07 + IMPL-01..12 + AMEND-01..07
</domain>

<decisions>
### Hợp đồng (CONTRACT-01..07)
- Auto-generate số HĐ format `XTTM/YYYY/NNN` (running number per year)
- Tab trên trang chi tiết đề án: "Hợp đồng" — sinh từ đề án APPROVED + form chỉnh điều khoản + upload bản scan + status (DRAFT/SIGNED/IN_PROGRESS/COMPLETED/LIQUIDATED)
- Cảnh báo 60 ngày sau quyết định phê duyệt mà chưa SIGNED
- /hop-dong: list tất cả HĐ với filter

### Triển khai (IMPL-01..12)
- Tab trên đề án: "Kế hoạch triển khai" với mốc công việc, nhân sự, lịch trình
- Đơn vị cập nhật progress %, kết quả từng hạng mục, đính kèm minh chứng (ảnh/tài liệu)
- BQL theo dõi tiến độ với simple horizontal timeline (KHÔNG Gantt phức tạp)
- Cảnh báo 30 ngày trước sự kiện quốc tế phải liên hệ thương vụ — checkbox "Đã liên hệ" + thông tin liên hệ

### Điều chỉnh (AMEND-01..07)
- Đơn vị tạo "Đề nghị điều chỉnh" với loại điều chỉnh (dropdown):
  - Loại NHỎ (BQL phê duyệt): thời gian / địa điểm / tên đơn vị / tên đề án
  - Loại TRỌNG YẾU (thẩm định lại): mục tiêu / nội dung / dự toán / thị trường
- Hệ thống tự suy luận `is_critical` từ loại
- Side-by-side diff view (cũ vs mới với highlight)
- Loại nhỏ → BQL approve → quyết định điều chỉnh PDF
- Loại trọng yếu → quay lại workflow thẩm định (Phase 7)

### Claude's Discretion
- Mock data: 3-4 hợp đồng (DRAFT/SIGNED/IN_PROGRESS/đã ký quá 60 ngày), 2 yêu cầu điều chỉnh (1 nhỏ approved, 1 trọng yếu pending)
</decisions>

<canonical_refs>
- prisma/schema.prisma — Contract, ProjectAmendment, ImplementationPlan
- lib/workflows/* — extend Project workflow với IN_PROGRESS, COMPLETED
- lib/system-config.ts — SLA thresholds (60 ngày, 30 ngày)
- lib/pdf/templates/ — reuse PDF infrastructure
- lib/audit.ts, lib/permissions-db.ts
- CLAUDE.md
</canonical_refs>

<deferred>
- Tích hợp ký số HĐ — out of scope (mock upload PDF scan)
- Multi-currency budget — VND only
- Workflow approval cấp trên cho điều chỉnh — defer
</deferred>
