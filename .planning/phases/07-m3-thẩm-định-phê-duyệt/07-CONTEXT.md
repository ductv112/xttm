# Phase 7: M3 Thẩm định & Phê duyệt (HERO) - Context

**Gathered:** 2026-04-30 overnight
**Status:** Ready for planning
**Source:** Auto-generated overnight session — HERO phase, closes flow demo

<domain>
HERO phase. Đóng flow demo: hồ sơ VALID từ Phase 6 → Hội đồng thẩm định chấm điểm → BQL tổng hợp + lập tờ trình + nhập quyết định phê duyệt. Moment "in tờ trình PDF chuẩn công văn ra".

**In scope (24 reqs):** COUNCIL-01..16 + APPROVE-01..08

- Tạo hội đồng thẩm định, thành viên, phân công đề án
- Side-by-side scoring panel (rubric trái + hồ sơ phải)
- COI checkbox, lưu nháp, nộp chính thức
- Tổng hợp điểm tự động real-time
- Báo cáo thẩm định PDF
- Lập danh sách trình duyệt + tờ trình PDF
- Nhập quyết định phê duyệt + thông báo kết quả

**OUT of scope:** Hợp đồng (Phase 8), nghiệm thu (Phase 9).
</domain>

<decisions>
## Implementation Decisions

### Hội đồng thẩm định (COUNCIL-01..05)
- Schema: EvaluationCouncil { id, name, programCycleId, term ('Lần 1', 'Lần 2'), createdAt, lockStatus ('OPEN' | 'LOCKED') }
- CouncilMember { councilId, userId, role ('CHU_TICH', 'PHO', 'UY_VIEN', 'THU_KY'), joinedAt }
- Project assigned to council via ProjectCouncilAssignment many-to-many
- BQL tạo hội đồng, thêm thành viên (chọn user role=HOIDONG)
- Phân công: select projects (status=VALID, passedFormalCheck=true) → assign vào council
- Sau khi assign, thành viên nhìn thấy project trong /tham-dinh route

### Side-by-side scoring (COUNCIL-06..10)
- Route: `/tham-dinh/[projectId]` — split layout 50/50
- Left panel: rubric — list các tiêu chí thẩm định (catalog ScoringCriterion với scope='EVALUATION'), mỗi criterion: name + weight + slider 0-10 + textarea note
- Right panel: project readonly view (tabs Tổng quan / Kế hoạch / Dự toán / Tài liệu)
- Top: COI checkbox "Tôi có xung đột lợi ích với đề án này" — when checked, disable scoring + show button "Xin từ chối thẩm định"
- Bottom: actions "Lưu nháp" + "Nộp chính thức" (nộp = locked, không sửa được)

### Tổng hợp điểm (COUNCIL-13)
- Server action calculateAggregateScore — average of submitted scoresheets per criterion, weighted total
- Real-time: TanStack Query với polling 5s trên trang BQL tổng hợp
- Khi hội đồng locked: BQL có thể xác nhận kết quả (COUNCIL-15)

### Báo cáo thẩm định PDF (COUNCIL-14)
- Route /api/pdf/evaluation/[councilId] — render báo cáo với danh sách đề án + điểm trung bình + xếp hạng + COI flags + nhận xét tổng hợp
- Be Vietnam Pro template

### Lập danh sách trình duyệt (APPROVE-01..02)
- BQL chọn từ danh sách thẩm định: top X đề án theo điểm
- Lập tờ trình từ template — auto-fill từ data, BQL có thể chỉnh
- Tờ trình PDF (APPROVE-03) — chuẩn công văn nhà nước (Quốc hiệu, "Nơi nhận", "Lưu: VT")

### Nhập quyết định (APPROVE-04..06)
- Form: số quyết định, ngày ký, người ký, danh sách đề án + kinh phí được duyệt cho từng đề án (có thể giảm so với đăng ký)
- Cảnh báo nếu kinh phí phê duyệt > kinh phí đăng ký
- Xuất quyết định PDF chuẩn công văn

### Thông báo kết quả (APPROVE-07..08)
- Composer email Tiptap (reuse Phase 3) gửi cho từng đơn vị
- Variable: {tenDonVi}, {tenDeAn}, {kinhPhiDuyet}
- Mock dispatch lưu DB, đơn vị thấy trong inbox

### Trạng thái cuối Phase
- Đề án phê duyệt: status APPROVED + approvedBudget set + approvedAt
- Đề án không phê duyệt: status REJECTED_FINAL với lý do

### Claude's Discretion
- Slider component (shadcn already có)
- Rubric layout
- Mock data: seed 1 council với 3 thành viên + 2 đề án assigned + 1 ScoreSheet draft + 1 EVALUATION + 1 đã được phê duyệt
- Toast wordings
</decisions>

<canonical_refs>
- prisma/schema.prisma — EvaluationCouncil, CouncilMember, ScoreSheet, Project
- lib/workflows/project.ts — extend với EVALUATION + APPROVED + REJECTED_FINAL + IN_PROGRESS
- lib/pdf/templates/* — Be Vietnam Pro
- lib/audit.ts, lib/permissions-db.ts
- 07-CONTEXT.md
- CLAUDE.md
</canonical_refs>

<deferred>
- 2-round thẩm định nếu chia voting bậc — defer
- AI assist nhận xét — defer
- Voting blockchain — out of scope
- Multi-language scoring — out of scope
</deferred>

---
*Phase: 07 HERO | Auto-generated overnight*
