# Phase 11: M7 Polish & Demo Prep - Context

**Gathered:** 2026-05-01

<domain>
Phase cuối — polish + demo prep. KHÔNG add features mới, chỉ:
- Audit mock data (10-15 records/loại, mọi state covered, tên đơn vị thật)
- Console hygiene (production build, 0 warnings/errors/404)
- Animation transitions (Framer Motion)
- Empty states / loading states polish
- Demo script khớp FLOW DEMO CHUẨN
- Role-switch dev button (Cmd+K command palette)
- README hướng dẫn chạy demo
- Pre-demo dry-run

**In scope (13 reqs):** POLISH-01..13
</domain>

<decisions>
### Mock data audit (POLISH-01..05)
- Verify 10-15 records/loại cho mọi entity
- Tên đơn vị thật: VITAS, VINATEX, LEFASO, VICOFA, VASEP, VFA, VIFOREST, VCCI, May 10
- Tên chủ nhiệm có chức danh thật (TS./PGS./CN./KS.)
- Tên đề án realistic
- Validator script cuối seed kiểm tra cross-entity invariants

### Console hygiene (POLISH-06..09)
- Production build clean (suppress dev warnings)
- Empty states có illustration + CTA cho mọi list
- Loading states dùng skeleton (đã có shadcn)
- Animation transitions polish (route change Framer Motion)

### Demo script (POLISH-10..12)
- README.md hướng dẫn chạy demo step-by-step
- Demo script .md khớp FLOW DEMO CHUẨN.docx
- **Cmd+K command palette** với role switcher (8 accounts) cho dev/demo

### POLISH-13 dry-run
- npm run build clean
- Chạy thực tế từng flow theo demo script
- Fix các UI rough edges nhỏ phát hiện được
</decisions>

<canonical_refs>
- 🎬 FLOW DEMO CHUẨN.docx (đọc khi viết demo script)
- prisma/seed/* — audit mock data
- components/shared/EmptyState.tsx
- CLAUDE.md
</canonical_refs>
