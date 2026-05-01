# Phase 9: M5 Báo cáo + Nghiệm thu + Tài chính - Context

**Gathered:** 2026-05-01

<domain>
Đóng vòng đời đề án — báo cáo kết quả → nghiệm thu → thanh lý hợp đồng + tạm ứng/thanh toán/quyết toán.

**In scope (17 reqs):** REPORT-01..07 + ACCEPT-01..06 + FIN-01..04
</domain>

<decisions>
### Báo cáo (REPORT-01..07)
- Đơn vị tạo báo cáo kết quả từ tab "Báo cáo" trên /de-an/[id]
- Form: chỉ tiêu định lượng (Number inputs cho từng tiêu chí: số DN tham gia, doanh thu, hợp đồng ký, ...) + định tính (Tiptap)
- Upload tài liệu, hình ảnh, danh sách DN tham gia (Excel)
- Submit → status PENDING_REVIEW → BQL review → có thể trả lại với góp ý
- Cảnh báo 15 ngày sau hoạt động chưa nộp báo cáo

### Nghiệm thu & Thanh lý (ACCEPT-01..06)
- Tab "Nghiệm thu" trên /de-an/[id]
- BQL tạo hồ sơ nghiệm thu sau khi báo cáo APPROVED
- Sinh biên bản nghiệm thu PDF chuẩn (thương đinh ký bên ngoài → upload bản scan)
- Cập nhật kết quả: đạt / không đạt / ghi chú
- Sau nghiệm thu: tạo hồ sơ thanh lý HĐ → status đề án CLOSED

### Tài chính (FIN-01..04)
- /tai-chinh route cho role TAICHINH
- Hồ sơ tạm ứng (sau khi ký HĐ) / thanh toán (sau nghiệm thu) / quyết toán (cuối kỳ)
- State machine: DRAFT → SUBMITTED → APPROVED → DISBURSED → SETTLED
- Tab "Tài chính" trên /de-an/[id] hiển thị tóm tắt

### Claude's Discretion
- Mock data: 2 báo cáo (1 SUBMITTED, 1 APPROVED), 2 biên bản nghiệm thu, 3 hồ sơ tài chính (advance/payment/settlement)
</decisions>

<canonical_refs>
- prisma/schema.prisma — Report, AcceptanceRecord, FinancialRecord (scaffolded)
- lib/pdf/templates/ — biên bản nghiệm thu PDF
- lib/system-config.ts — SLA 15 ngày báo cáo
- CLAUDE.md
</canonical_refs>
