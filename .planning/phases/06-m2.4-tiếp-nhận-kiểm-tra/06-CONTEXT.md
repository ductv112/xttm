# Phase 6: M2.4 Tiếp nhận & Kiểm tra hồ sơ - Context

**Gathered:** 2026-04-30 overnight
**Status:** Ready for planning
**Source:** Auto-generated overnight session

<domain>
Cầu nối M2.3 (Nộp đề án) → M3 (Thẩm định). 3 actors: BQL tiếp nhận, Lãnh đạo BQL phân công, Chuyên viên kiểm tra checklist hành chính (≠ thẩm định chuyên môn).

**In scope (13 INTAKE-* requirements):**
- BQL list hồ sơ SUBMITTED, tiếp nhận → ASSIGNED
- Phân công chuyên viên (drag-drop hoặc bulk-assign), thu hồi, tái phân công
- Chuyên viên view hồ sơ + checklist hành chính (✓/✗/N/A + ghi chú)
- Trả bổ sung (gửi yêu cầu cho đơn vị → status SUPPLEMENT_REQUIRED)
- Xác nhận hợp lệ → status VALID
- Chấm điểm sơ bộ
- Chuyển hồ sơ sang hội đồng thẩm định

**OUT of scope:** Hội đồng thẩm định (Phase 7), quyết định phê duyệt (Phase 7).
</domain>

<decisions>
## Implementation Decisions

### Quy trình kiểm tra
- **Checklist** = template config từ catalog hoặc hardcoded list (cho POC, hardcode 10-15 items chuẩn). Items kiểu: "Đề án có chữ ký người đại diện hợp pháp", "Dự toán kinh phí khớp với kế hoạch", "Tài liệu năng lực đầy đủ", ...
- Status workflow: SUBMITTED → ASSIGNED (BQL tiếp nhận) → IN_REVIEW (chuyên viên bắt đầu) → SUPPLEMENT_REQUIRED (trả bổ sung) → RESUBMITTED → IN_REVIEW (chuyên viên xem lại) → VALID (hợp lệ, sẵn sàng thẩm định) hoặc REJECTED_FORMAL (loại từ vòng kiểm tra hành chính)
- Chấm điểm sơ bộ: chỉ thực hiện khi status = VALID, dùng catalog ScoringCriterion.
- Chuyển sang Hội đồng: action "Chuyển sang thẩm định" → các đề án VALID được flag `passedFormalCheck = true` để Phase 7 query

### Phân công
- 3 vai trò: BQL (tiếp nhận, oversight), LĐ BQL (phân công, oversight), CHUYENVIEN (thực thi)
- Drag-drop UI cho LĐ BQL: hồ sơ pending → drop vào chuyên viên. Hoặc bulk-assign theo loại đề án
- Field `assignedToUserId` trên Project + `assignedAt` + `assignedById`

### UI Pages
- `/tiep-nhan` (BQL): list SUBMITTED → click row → tiếp nhận button (status SUBMITTED → ASSIGNED + assignedAt = now, assignedById = BQL)
- `/phan-cong` (LĐ BQL): drag-drop board hoặc table với assign action — danh sách hồ sơ ASSIGNED chưa có chuyên viên
- `/kiem-tra` (CHUYENVIEN): list hồ sơ được giao (filter status IN_REVIEW), click → trang kiểm tra chi tiết với checklist + buttons "Trả bổ sung" / "Xác nhận hợp lệ"
- `/cham-diem-so-bo` (CHUYENVIEN): list hồ sơ VALID → form chấm điểm theo tiêu chí

### Chấm điểm sơ bộ
- ScoreSheet.kind = 'PRELIMINARY'
- Form: list các tiêu chí từ catalog (filter scope='PRELIMINARY' nếu có), mỗi tiêu chí: số điểm (1-10) + ghi chú
- Tính tổng điểm có trọng số
- Submit khóa phiếu

### Claude's Discretion
- Drag-drop library (react-dnd hoặc @hello-pangea/dnd hoặc native HTML5 drag/drop — chọn native cho ít deps)
- Checklist template: hardcode trong constants hoặc seed catalog
- Mock data: update some seeded projects to ASSIGNED/IN_REVIEW status, seed some checklist results
</decisions>

<canonical_refs>
- prisma/schema.prisma — Project có assignedToUserId, ScoreSheet model
- lib/workflows/project.ts — extend với INTAKE statuses
- lib/audit.ts, lib/permissions-db.ts
- components/shared/* — DataTable, ConfirmDialog
- 06-CONTEXT.md
- CLAUDE.md
</canonical_refs>

<deferred>
- AI auto-suggest ai phân công cho hồ sơ (predict best chuyên viên dựa trên expertise) — defer
- Workflow approval khi chuyên viên sai (override với reason) — defer
- Time tracking chuyên viên — defer
- Email notification khi assign — mock only
</deferred>

---
*Phase: 06 | Auto-generated overnight*
