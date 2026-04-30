# Kiến trúc Hệ thống — XTTMQG Prototype

**Phạm vi:** Next.js 15 App Router monolith, SQLite + Prisma, prototype POC
**Nghiên cứu ngày:** 2026-04-30
**Mức độ tin cậy tổng thể:** HIGH (dựa trên Next.js 15 official docs + best practices 2026)
**Định hướng:** Tối ưu cho **độ phủ chức năng + UI mượt** trong tay 1 dev (Claude Code), không phải production-grade scalability

---

## 0. Tóm lược Quyết định Kiến trúc (TL;DR)

| # | Quyết định | Chốt |
|---|-----------|------|
| 1 | App Router structure | `(auth)` + `(app)` only — KHÔNG split theo phân hệ/role |
| 2 | State machine | **Status field + guard functions** (KHÔNG XState) |
| 3 | Components organization | **Hybrid**: `components/ui/`, `components/shared/`, **`features/<phân-hệ>/`** |
| 4 | Server Actions vs API Routes | **Server Actions cho 95%** (mọi mutation từ UI), API Routes chỉ cho download/webhook/PDF stream |
| 5 | RBAC enforcement | **3 lớp**: Middleware (route guard) + Server Action (data guard) + Component (UI guard) |
| 6 | Sidebar dynamic | Build từ `lib/permissions.ts` matrix, render server-side trong layout |
| 7 | Multi-step form | **Single URL** với step state Zustand + RHF, autosave draft mỗi step |
| 8 | PDF generation | **`@react-pdf/renderer` server-side** với font Vietnamese (Be Vietnam Pro / Inter) |
| 9 | Mock data | `prisma/seed.ts` idempotent với `upsert`, factory functions, dates scatter quanh `today` |
| 10 | Build order | `M0 → M1.danh-mục → M2.1 chu-kỳ → M2.2 đơn-vị → M2.3 đề-án → M2.4 kiểm-tra → M3 thẩm-định → M4-M5-M6` (M1.user/role parallel với M2) |

---

## 1. Tổng quan Kiến trúc

### 1.1. Mô hình tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser (Chrome/Edge)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ Server Comp │  │ Client Comp  │  │ TanStack Query Cache     │ │
│  │ (RSC)       │  │ (RHF/Zustand)│  │ (server state mirror)    │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
└──────────────┬───────────────┬─────────────────┬────────────────┘
               │ HTML stream   │ Server Action   │ /api/* (rare)
               ▼               ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              Next.js 15 App Router (Node runtime)                │
│  ┌──────────────┐  ┌─────────────────┐  ┌────────────────────┐  │
│  │ Middleware   │  │ app/(app)/...   │  │ app/api/...        │  │
│  │ - Auth       │─▶│ - layout.tsx    │  │ - /pdf/[id]        │  │
│  │ - RBAC route │  │ - page.tsx (RSC)│  │ - /export/excel    │  │
│  └──────────────┘  │ - actions.ts    │  │ - /file/[id]       │  │
│                    └────────┬────────┘  └────────────────────┘  │
│                             │ calls                              │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ lib/                                                      │   │
│  │  ├── auth.ts          (NextAuth config + getServerSession)│   │
│  │  ├── permissions.ts   (RBAC matrix + can(role, action))   │   │
│  │  ├── prisma.ts        (PrismaClient singleton)            │   │
│  │  ├── workflows/       (state guards + transitions)        │   │
│  │  └── services/        (business logic, callable from RSC  │   │
│  │                        + Server Actions + API Routes)     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                             │                                    │
│                             ▼                                    │
│                    ┌────────────────────┐                       │
│                    │ Prisma Client      │                       │
│                    └─────────┬──────────┘                       │
└──────────────────────────────┼─────────────────────────────────┘
                               ▼
                    ┌────────────────────┐
                    │  SQLite (dev.db)   │
                    └────────────────────┘
```

### 1.2. Nguyên tắc thiết kế

1. **RSC-first**: Mọi page đọc dữ liệu là Server Component, chỉ "use client" cho component có interactivity (form, chart, dialog).
2. **Server Action là default cho mutation**: Form submit, click button update — đều dùng Server Action. KHÔNG tạo API route trừ khi bắt buộc (PDF stream, download file).
3. **Single source of truth**: Mọi business rule (state transition, gating, scoring) ở `lib/workflows/` và `lib/services/`. UI chỉ render + dispatch.
4. **Permissions là data, không phải code**: `lib/permissions.ts` định nghĩa matrix, mọi guard call `can(role, resource, action)`.
5. **Vietnamese-first UI**: Mọi label/error/toast tiếng Việt. Identifier code tiếng Anh.

---

## 2. Cấu trúc App Router (Câu hỏi 1)

### 2.1. Quyết định: Chỉ `(auth)` và `(app)` — KHÔNG split theo phân hệ/role

**Lý do:**

| Lựa chọn | Đánh giá | Quyết định |
|----------|----------|-----------|
| `(auth)` + `(app)` only | Layout shell (sidebar/topbar) áp dụng đồng nhất; URL clean (`/de-an`, `/tham-dinh`); sidebar dynamic theo role | **CHỌN** |
| `(auth)` + `(admin)` + `(business)` | Phải duplicate layout; user vai trò Admin + Lãnh đạo phải nhảy giữa 2 group khó chịu; URL bị chia cắt artificial | LOẠI |
| `(auth)` + `(banql)` + `(donvi)` + `(hoidong)` ... | 7 group = 7 layout duplicate; user nhiều vai trò bị kẹt; URL không stable khi user đổi role | LOẠI |

**Pattern áp dụng:** Cùng layout `(app)`, sidebar render động theo `session.role` qua `lib/permissions.ts`. URL phản ánh **resource/domain** (đề án, thẩm định) chứ không phải role (banql/donvi).

### 2.2. Cấu trúc folder cuối cùng

```
app/
├── layout.tsx                          # Root: html, body, providers
├── (auth)/
│   ├── layout.tsx                      # Layout giản: centered card, gradient bg
│   └── login/
│       └── page.tsx
├── (app)/
│   ├── layout.tsx                      # AppShell: sidebar + topbar + breadcrumb
│   ├── dashboard/
│   │   └── page.tsx
│   ├── chuong-trinh/                   # M2.1 ProgramCycle (BQL)
│   │   ├── page.tsx                    # List
│   │   ├── new/
│   │   │   └── page.tsx
│   │   ├── [id]/
│   │   │   ├── page.tsx                # Detail (overview tabs)
│   │   │   ├── cau-hinh/page.tsx       # Edit config
│   │   │   ├── moi-dang-ky/page.tsx    # Email composer + send
│   │   │   └── actions.ts              # Server actions cho cycle
│   │   └── actions.ts                  # createCycle, updateCycle...
│   ├── don-vi-chu-tri/                 # M2.2 Organization profile
│   │   ├── page.tsx
│   │   ├── ho-so/page.tsx
│   │   └── actions.ts
│   ├── de-an/                          # M2.3 Project lifecycle
│   │   ├── page.tsx                    # List (filter theo role)
│   │   ├── new/
│   │   │   └── page.tsx                # Multi-step wizard (single URL)
│   │   ├── [id]/
│   │   │   ├── page.tsx                # Detail tabs
│   │   │   ├── chinh-sua/page.tsx      # Edit
│   │   │   ├── dieu-chinh/page.tsx     # M4 amendment (Điều 13)
│   │   │   └── lich-su-version/page.tsx
│   │   └── actions.ts
│   ├── tiep-nhan/                      # M2.4 BQL receive + assign
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── tham-dinh/                      # M3 Evaluation
│   │   ├── page.tsx                    # List councils
│   │   ├── hoi-dong/[id]/page.tsx      # Council detail
│   │   ├── cham-diem/[projectId]/page.tsx
│   │   └── actions.ts
│   ├── phe-duyet/                      # M3 Approval (tờ trình + decision)
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── hop-dong/                       # M4
│   ├── trien-khai/                     # M4 implementation plan
│   ├── bao-cao/                        # M5 reports
│   ├── nghiem-thu/                     # M5 acceptance
│   ├── tai-chinh/                      # M5 financial
│   ├── danh-muc/                       # M1 catalogs (8 lists)
│   │   ├── loai-de-an/page.tsx
│   │   ├── nganh-hang/page.tsx
│   │   ├── thi-truong/page.tsx
│   │   ├── loai-hinh-xttm/page.tsx
│   │   ├── quoc-gia/page.tsx
│   │   ├── tieu-chi-cham-diem/page.tsx
│   │   ├── tieu-chi-tham-dinh/page.tsx
│   │   └── mau-van-ban/page.tsx
│   ├── nguoi-dung/                     # M1 user mgmt
│   ├── vai-tro/                        # M1 role + permission matrix
│   ├── audit-log/                      # M1
│   ├── thong-bao/                      # M6 inbox
│   └── cau-hinh/                       # M1 system config
└── api/
    ├── auth/[...nextauth]/route.ts
    ├── pdf/
    │   ├── de-an/[id]/route.ts         # PDF export đề án
    │   ├── quyet-dinh/[id]/route.ts
    │   └── bien-ban-nghiem-thu/[id]/route.ts
    ├── excel/
    │   └── export/[type]/route.ts
    └── file/[id]/route.ts              # Mock-file download
```

**Ghi chú URL:**
- URL slug tiếng Việt **không dấu** (`de-an`, `tham-dinh`) — đẹp, SEO-friendly, dễ gõ
- Resource-centric, không role-centric → user đổi role không bị broken link
- `[id]` là cuid (Prisma default) chứ không phải số

---

## 3. Prisma Schema Design (Câu hỏi 2)

### 3.1. Triết lý schema

- **Soft delete** chỉ ở vài entity quan trọng (Project, Contract) qua `deletedAt DateTime?`
- **Audit fields** mọi entity: `createdAt`, `updatedAt`, `createdById`, `updatedById?`
- **Status field + enum** cho mọi state machine (ProgramCycle, Project, Evaluation, Contract...)
- **Versioning** chỉ ở Project (qua `ProjectVersion` snapshot khi resubmit/amend)
- **Polymorphic attachments** — 1 bảng `Attachment` chung (`entityType`, `entityId`)
- **Notification + dispatch** tách 2 bảng (template payload vs per-recipient state)

### 3.2. Schema sketch — Top 14 entities

```prisma
// ===== PRISMA SCHEMA SKETCH =====
generator client { provider = "prisma-client-js" }
datasource db { provider = "sqlite"; url = env("DATABASE_URL") }

// ===== AUTH & RBAC =====
model User {
  id            String   @id @default(cuid())
  username      String   @unique
  passwordHash  String
  fullName      String
  email         String?
  phone         String?
  isActive      Boolean  @default(true)
  organizationId String?  // FK to Organization (nullable for internal staff)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  organization  Organization? @relation(fields: [organizationId], references: [id])
  roles         UserRole[]
  scoreSheets   ScoreSheet[]
  auditLogs     AuditLog[]
  notifications NotificationDispatch[]

  @@index([organizationId])
}

model Role {
  id          String   @id @default(cuid())
  code        String   @unique  // ADMIN | BANQL | CHUYENVIEN | HOIDONG | DONVI | TAICHINH | LANHDAO
  name        String
  description String?
  isSystem    Boolean  @default(false)  // System role không cho xóa
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users       UserRole[]
  permissions RolePermission[]
}

model Permission {
  id       String @id @default(cuid())
  code     String @unique  // e.g. "de-an:create", "tham-dinh:cham-diem"
  resource String          // de-an | tham-dinh | hop-dong ...
  action   String          // create | read | update | delete | submit | approve
  name     String
  roles    RolePermission[]
}

model UserRole {
  userId String
  roleId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  @@id([userId, roleId])
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  @@id([roleId, permissionId])
}

// ===== M2.1 PROGRAM CYCLE (root entity, hero flow gate) =====
enum ProgramCycleStatus {
  DRAFT
  READY
  OPEN_REGISTRATION
  CLOSED_REGISTRATION
  EVALUATING
  APPROVED
  COMPLETED
}

model ProgramCycle {
  id                 String              @id @default(cuid())
  year               Int                 @unique  // 1 chu kỳ / năm
  name               String              // "Chương trình XTTM Quốc gia 2026"
  status             ProgramCycleStatus  @default(DRAFT)
  totalBudget        Decimal?            // Ngân sách dự kiến
  // Mốc thời gian
  registrationOpenAt DateTime?
  registrationCloseAt DateTime?           // Default 30/5
  evaluationStartAt  DateTime?
  evaluationEndAt    DateTime?
  approvalDeadline   DateTime?
  // Cấu hình & văn bản
  scanDocumentUrl    String?             // Bản scan công văn ban hành
  emailTemplateId    String?             // FK to DocumentTemplate
  invitedOrganizations Json?             // Array of organizationIds
  // Audit
  createdById        String
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt

  projects           Project[]
  councils           EvaluationCouncil[]
  scoringCriteria    ScoringCriterion[]  // Snapshot tiêu chí của năm này
  evaluationCriteria EvaluationCriterion[]

  @@index([status])
}

// ===== ORGANIZATION (đơn vị chủ trì) =====
enum OrganizationType {
  ASSOCIATION       // Hiệp hội ngành hàng
  RESEARCH_INSTITUTE
  ENTERPRISE
  GOVERNMENT
  OTHER
}

enum OrganizationProfileStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
}

model Organization {
  id              String           @id @default(cuid())
  code            String           @unique  // VITAS, VINATEX, LEFASO...
  name            String
  type            OrganizationType
  taxCode         String?
  address         String?
  phone           String?
  email           String?
  website         String?
  isInvited       Boolean          @default(false)  // Đơn vị thuộc danh sách mời?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  profile         OrganizationProfile?
  users           User[]
  projects        Project[]
  contracts       Contract[]
}

model OrganizationProfile {
  id              String           @id @default(cuid())
  organizationId  String           @unique
  legalRepName    String?          // Người đại diện pháp luật
  legalRepTitle   String?
  capabilities    String?          // Năng lực, thành tích
  contactPersons  Json?            // Array of {name, title, phone, email, role}
  status          OrganizationProfileStatus @default(DRAFT)
  submittedAt     DateTime?
  approvedAt      DateTime?
  approvedById    String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  organization    Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

// ===== PROJECT (đề án — entity trung tâm) =====
enum ProjectStatus {
  DRAFT                    // Đơn vị đang khai báo
  SUBMITTED                // Đã nộp
  RECEIVED                 // BQL tiếp nhận
  ASSIGNED                 // Đã phân công chuyên viên
  UNDER_REVIEW             // Chuyên viên đang kiểm tra
  RETURNED_FOR_REVISION    // Trả bổ sung
  VALIDATED                // Hợp lệ, sẵn sàng thẩm định
  EVALUATING               // Hội đồng đang thẩm định
  EVALUATED                // Đã có điểm tổng hợp
  APPROVED                 // Lãnh đạo phê duyệt
  REJECTED                 // Bị từ chối
  CONTRACTED               // Đã ký HĐ
  IN_PROGRESS              // Đang triển khai
  COMPLETED                // Đã nghiệm thu
  LIQUIDATED               // Đã thanh lý
  CANCELLED                // Đơn vị rút / Hủy
}

enum ProjectKind {
  EXPORT_EXHIBITION        // Triển lãm xuất khẩu
  INTL_CONFERENCE          // Hội nghị quốc tế
  DOMESTIC_FAIR            // Hội chợ trong nước
  TRADE_DELEGATION_OUT     // Đoàn ra
  TRADE_DELEGATION_IN      // Đoàn vào
  TRADE_INFO_EXPORT        // TT TM tuyên truyền XK
  TRADE_INFO_DOMESTIC      // TT TM tuyên truyền nội địa
  TRAINING                 // Đào tạo
  OTHER
}

model Project {
  id                 String         @id @default(cuid())
  code               String         @unique  // Auto-gen: XTTM-2026-001
  programCycleId     String         // Gating: chỉ tạo khi cycle.status = OPEN_REGISTRATION
  organizationId     String         // Đơn vị chủ trì
  parentProjectId    String?        // Đề án 2 năm: link tới đề án năm 1
  // Thông tin chung
  name               String
  kind               ProjectKind
  industrySectorId   String?        // FK Catalog
  promotionTypeId    String?        // FK Catalog
  marketIds          Json?          // Array of marketId (multi-select)
  countryIds         Json?          // For đoàn ra
  // Mục tiêu & nội dung
  objective          String?
  description        String?
  expectedOutcome    String?
  // Thời gian thực hiện
  plannedStartAt     DateTime?
  plannedEndAt       DateTime?
  // Địa điểm
  location           String?
  // Ngân sách
  proposedBudget     Decimal?       // Đăng ký
  approvedBudget     Decimal?       // Sau phê duyệt
  // Chủ nhiệm đề án
  managerName        String?
  managerTitle       String?
  managerPhone       String?
  managerEmail       String?
  // Status + workflow
  status             ProjectStatus  @default(DRAFT)
  currentVersion     Int            @default(1)
  submittedAt        DateTime?
  receivedAt         DateTime?
  assignedReviewerId String?        // FK to User
  // Approval
  approvalDecisionId String?
  // Audit
  createdById        String
  createdAt          DateTime       @default(now())
  updatedAt          DateTime       @updatedAt
  deletedAt          DateTime?      // Soft delete

  programCycle       ProgramCycle   @relation(fields: [programCycleId], references: [id])
  organization       Organization   @relation(fields: [organizationId], references: [id])
  parent             Project?       @relation("ProjectYearLink", fields: [parentProjectId], references: [id])
  childProjects      Project[]      @relation("ProjectYearLink")
  versions           ProjectVersion[]
  scoreSheets        ScoreSheet[]
  contract           Contract?
  reports            Report[]
  amendments         ProjectAmendment[]
  auditLogs          AuditLog[]
  attachments        Attachment[]   @relation("ProjectAttachments")

  @@index([programCycleId, status])
  @@index([organizationId])
  @@index([assignedReviewerId])
}

model ProjectVersion {
  id          String   @id @default(cuid())
  projectId   String
  versionNo   Int
  snapshot    Json     // Toàn bộ Project fields tại thời điểm version
  reason      String?  // "Nộp lần đầu" | "Bổ sung theo yêu cầu" | "Điều chỉnh Điều 13"
  createdById String
  createdAt   DateTime @default(now())

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, versionNo])
}

// ===== EVALUATION (M3) =====
enum CouncilStatus { DRAFT OPEN CLOSED }
enum ScoreSheetStatus { DRAFT SUBMITTED }

model EvaluationCouncil {
  id              String         @id @default(cuid())
  programCycleId  String
  name            String
  decisionDocUrl  String?        // Quyết định thành lập hội đồng
  status          CouncilStatus  @default(DRAFT)
  openAt          DateTime?
  closeAt         DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  programCycle    ProgramCycle   @relation(fields: [programCycleId], references: [id])
  members         CouncilMember[]
  scoreSheets     ScoreSheet[]
}

model CouncilMember {
  id          String   @id @default(cuid())
  councilId   String
  userId      String
  role        String   // CHU_TICH | THU_KY | UY_VIEN
  council     EvaluationCouncil @relation(fields: [councilId], references: [id], onDelete: Cascade)
  user        User              @relation(fields: [userId], references: [id])

  @@unique([councilId, userId])
}

model ScoreSheet {
  id           String           @id @default(cuid())
  councilId    String
  projectId    String
  reviewerId   String           // FK User
  status       ScoreSheetStatus @default(DRAFT)
  scoresJson   Json             // [{criterionId, score, weight, comment}]
  totalScore   Float?
  comment      String?
  submittedAt  DateTime?
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  council      EvaluationCouncil @relation(fields: [councilId], references: [id])
  project      Project           @relation(fields: [projectId], references: [id])
  reviewer     User              @relation(fields: [reviewerId], references: [id])

  @@unique([councilId, projectId, reviewerId])
}

// ===== APPROVAL (M3) =====
model Approval {
  id            String   @id @default(cuid())
  programCycleId String
  decisionNo    String?  // Số quyết định (VD: 1234/QĐ-BCT)
  decisionDate  DateTime?
  decisionDocUrl String?
  totalApprovedBudget Decimal?
  proposalDocUrl String?  // Tờ trình
  createdById   String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  decisions     ApprovalDecision[]
}

model ApprovalDecision {
  id          String  @id @default(cuid())
  approvalId  String
  projectId   String  @unique
  approvedBudget Decimal
  rank        Int?
  comment     String?
  approval    Approval @relation(fields: [approvalId], references: [id], onDelete: Cascade)
}

// ===== CONTRACT (M4) =====
enum ContractStatus { DRAFT SIGNED ACTIVE COMPLETED LIQUIDATED OVERDUE }

model Contract {
  id              String          @id @default(cuid())
  projectId       String          @unique
  organizationId  String
  contractNo      String          @unique  // Auto-gen
  signedDate      DateTime?
  effectiveFrom   DateTime?
  effectiveTo     DateTime?
  totalValue      Decimal
  status          ContractStatus  @default(DRAFT)
  scanFileUrl     String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  project         Project         @relation(fields: [projectId], references: [id])
  organization    Organization    @relation(fields: [organizationId], references: [id])
  implementationPlan ImplementationPlan?
  financialRecords FinancialRecord[]
  liquidation     LiquidationRecord?
  attachments     Attachment[]    @relation("ContractAttachments")
}

// ===== IMPLEMENTATION (M4) =====
model ImplementationPlan {
  id          String   @id @default(cuid())
  contractId  String   @unique
  staffJson   Json?    // [{name, role, contact}]
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  contract    Contract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  milestones  Milestone[]
}

enum MilestoneStatus { PLANNED IN_PROGRESS DONE OVERDUE }

model Milestone {
  id          String   @id @default(cuid())
  planId      String
  title       String
  description String?
  plannedAt   DateTime
  completedAt DateTime?
  status      MilestoneStatus @default(PLANNED)
  evidenceJson Json?   // [{url, name, uploadedAt}]
  contactedConsulate Boolean? // Cảnh báo 30 ngày ngoại giao
  contactedAt DateTime?

  plan        ImplementationPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
}

// ===== AMENDMENT (M4 — Điều 13 NĐ 28) =====
enum AmendmentType { MINOR MAJOR }
enum AmendmentStatus { PENDING APPROVED REJECTED RE_EVALUATING }

model ProjectAmendment {
  id          String   @id @default(cuid())
  projectId   String
  type        AmendmentType
  status      AmendmentStatus @default(PENDING)
  reason      String
  changesJson Json     // Diff between old/new
  decisionDocUrl String?
  createdById String
  createdAt   DateTime @default(now())
  reviewedAt  DateTime?

  project     Project  @relation(fields: [projectId], references: [id])
}

// ===== REPORT (M5) =====
enum ReportStatus { DRAFT SUBMITTED RETURNED ACCEPTED }

model Report {
  id              String   @id @default(cuid())
  projectId       String
  title           String
  reportType      String   // "PROGRESS" | "FINAL"
  quantitativeData Json?   // chỉ tiêu định lượng
  qualitativeData String?
  status          ReportStatus @default(DRAFT)
  submittedAt     DateTime?
  dueAt           DateTime?  // Tính từ ngày kết thúc hoạt động + 15 ngày
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project         Project  @relation(fields: [projectId], references: [id])
  attachments     Attachment[] @relation("ReportAttachments")
}

// ===== ACCEPTANCE & LIQUIDATION (M5) =====
enum AcceptanceResult { PASSED FAILED CONDITIONAL }

model AcceptanceRecord {
  id          String   @id @default(cuid())
  projectId   String   @unique
  result      AcceptanceResult
  documentUrl String?  // Biên bản nghiệm thu
  notes       String?
  acceptedAt  DateTime?
  createdAt   DateTime @default(now())
}

model LiquidationRecord {
  id          String   @id @default(cuid())
  contractId  String   @unique
  documentUrl String?
  liquidatedAt DateTime?
  notes       String?
  createdAt   DateTime @default(now())

  contract    Contract @relation(fields: [contractId], references: [id])
}

// ===== FINANCIAL (M5) =====
enum FinancialRecordType { ADVANCE PAYMENT SETTLEMENT }
enum FinancialRecordStatus { DRAFT SUBMITTED APPROVED PAID }

model FinancialRecord {
  id          String   @id @default(cuid())
  contractId  String
  type        FinancialRecordType
  status      FinancialRecordStatus @default(DRAFT)
  amount      Decimal
  documentUrl String?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  contract    Contract @relation(fields: [contractId], references: [id])
}

// ===== NOTIFICATION (M6) =====
enum NotificationKind {
  NEW_PROJECT REVIEW_ASSIGNED REVISION_REQUESTED APPROVAL_RESULT
  CONTRACT_DELAY_60 REPORT_DUE_15 SLA_VIOLATION CONSULATE_30
}

model Notification {
  id          String   @id @default(cuid())
  kind        NotificationKind
  title       String
  body        String
  link        String?  // Deep link to entity
  payloadJson Json?
  createdAt   DateTime @default(now())

  dispatches  NotificationDispatch[]
}

model NotificationDispatch {
  id              String   @id @default(cuid())
  notificationId  String
  recipientUserId String
  isRead          Boolean  @default(false)
  readAt          DateTime?
  channel         String   // "INBOX" | "EMAIL_MOCK" | "SMS_MOCK"
  createdAt       DateTime @default(now())

  notification    Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)
  recipient       User         @relation(fields: [recipientUserId], references: [id])

  @@index([recipientUserId, isRead])
}

// ===== CATALOGS (M1) =====
model ProjectType         { id String @id @default(cuid()); code String @unique; name String; isActive Boolean @default(true) }
model IndustrySector      { id String @id @default(cuid()); code String @unique; name String; isActive Boolean @default(true) }
model Market              { id String @id @default(cuid()); code String @unique; name String; isActive Boolean @default(true) }
model PromotionType       { id String @id @default(cuid()); code String @unique; name String; isActive Boolean @default(true) }
model Country             { id String @id @default(cuid()); code String @unique; name String; isActive Boolean @default(true) }

model ScoringCriterion {
  id              String @id @default(cuid())
  programCycleId  String?  // Snapshot per cycle
  code            String
  name            String
  weight          Float
  maxScore        Int
  isActive        Boolean @default(true)
  programCycle    ProgramCycle? @relation(fields: [programCycleId], references: [id])
}

model EvaluationCriterion {
  id              String @id @default(cuid())
  programCycleId  String?
  code            String
  name            String
  weight          Float
  maxScore        Int
  isActive        Boolean @default(true)
  programCycle    ProgramCycle? @relation(fields: [programCycleId], references: [id])
}

model DocumentTemplate {
  id          String   @id @default(cuid())
  code        String   @unique  // "MAU_TO_TRINH" | "MAU_BIEN_BAN_NGHIEM_THU" | "MAU_EMAIL_MOI"
  name        String
  contentHtml String   // Template với placeholder {{variable}}
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ===== ATTACHMENT (polymorphic) =====
model Attachment {
  id          String   @id @default(cuid())
  entityType  String   // "Project" | "Contract" | "Report" | "ProgramCycle"
  entityId    String
  fileName    String
  fileUrl     String   // Path to public/mock-files/...
  fileSize    Int?
  mimeType    String?
  uploadedById String
  createdAt   DateTime @default(now())

  // Optional named relations for type-safe queries
  project     Project?  @relation("ProjectAttachments", fields: [entityId], references: [id], map: "fk_attachment_project")
  contract    Contract? @relation("ContractAttachments", fields: [entityId], references: [id], map: "fk_attachment_contract")
  report      Report?   @relation("ReportAttachments", fields: [entityId], references: [id], map: "fk_attachment_report")

  @@index([entityType, entityId])
}

// ===== AUDIT LOG (M1) =====
model AuditLog {
  id          String   @id @default(cuid())
  userId      String
  action      String   // "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "SUBMIT" | "APPROVE"
  resource    String   // "Project" | "ProgramCycle" | ...
  resourceId  String?
  diffJson    Json?    // Before/after
  ip          String?
  userAgent   String?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
  project     Project? @relation(fields: [resourceId], references: [id], map: "fk_audit_project")

  @@index([userId, createdAt])
  @@index([resource, resourceId])
}
```

> **Lưu ý SQLite:** Decimal sẽ map thành REAL trong SQLite (chấp nhận được cho prototype). Production migrate sang Postgres → Decimal đúng nghĩa.

---

## 4. State Machine Implementation (Câu hỏi 3)

### 4.1. Quyết định: **Status field + guard functions** (KHÔNG XState v5)

**Lý do:**

| Cách tiếp cận | Pros | Cons | Phù hợp prototype? |
|---------------|------|------|-------------------|
| XState v5 | Visualizer đẹp, statechart formal | Bundle size +~30KB; setup phức tạp; persistence cần actor; learning curve cho 1 dev | KHÔNG — over-engineering |
| Discriminated unions reducer | Type-safe transitions | Phải tự code persistence vào DB; không trực quan | Vừa đủ nhưng không hơn cách 3 |
| **Status field (enum) + guard functions** | Đơn giản, đúng với cách Prisma + DB hoạt động; dễ debug; dễ seed mock data ở mọi state | Không có visualizer | **CHỌN** |

### 4.2. Pattern triển khai

```typescript
// lib/workflows/programCycle.ts

import { ProgramCycleStatus } from "@prisma/client";

// 1. Định nghĩa transition table (single source of truth)
const TRANSITIONS: Record<ProgramCycleStatus, ProgramCycleStatus[]> = {
  DRAFT:               ["READY"],
  READY:               ["OPEN_REGISTRATION", "DRAFT"],
  OPEN_REGISTRATION:   ["CLOSED_REGISTRATION"],
  CLOSED_REGISTRATION: ["EVALUATING", "OPEN_REGISTRATION"], // Cho phép gia hạn
  EVALUATING:          ["APPROVED"],
  APPROVED:            ["COMPLETED"],
  COMPLETED:           [],
};

// 2. Guard: kiểm tra transition hợp lệ
export function canTransitionCycle(
  from: ProgramCycleStatus,
  to: ProgramCycleStatus
): boolean {
  return TRANSITIONS[from].includes(to);
}

// 3. Guards nghiệp vụ (precondition)
export const cycleGuards = {
  canOpen: (cycle: ProgramCycle): { ok: boolean; reason?: string } => {
    if (!cycle.scanDocumentUrl) return { ok: false, reason: "Chưa upload công văn" };
    if (!cycle.registrationCloseAt) return { ok: false, reason: "Chưa cấu hình hạn nộp" };
    if (!cycle.totalBudget) return { ok: false, reason: "Chưa cấu hình ngân sách" };
    return { ok: true };
  },
  canCreateProject: (cycle: ProgramCycle): boolean =>
    cycle.status === "OPEN_REGISTRATION",
};

// 4. Server action wrapper
export async function transitionCycle(
  cycleId: string,
  to: ProgramCycleStatus,
  userId: string
) {
  const cycle = await prisma.programCycle.findUniqueOrThrow({ where: { id: cycleId } });
  if (!canTransitionCycle(cycle.status, to)) {
    throw new Error(`Không thể chuyển ${cycle.status} → ${to}`);
  }
  // Áp guard nghiệp vụ tương ứng nếu có
  if (to === "OPEN_REGISTRATION") {
    const guard = cycleGuards.canOpen(cycle);
    if (!guard.ok) throw new Error(guard.reason);
  }
  return prisma.$transaction([
    prisma.programCycle.update({ where: { id: cycleId }, data: { status: to } }),
    prisma.auditLog.create({
      data: { userId, action: "TRANSITION", resource: "ProgramCycle", resourceId: cycleId, diffJson: { from: cycle.status, to } }
    }),
  ]);
}
```

### 4.3. Áp dụng cho các entity khác

Cùng pattern cho:
- **Project** (16 trạng thái): table tương tự
- **Contract** (6 trạng thái)
- **ScoreSheet** (DRAFT → SUBMITTED, không revert)
- **Report** (DRAFT → SUBMITTED → RETURNED → SUBMITTED → ACCEPTED)
- **OrganizationProfile** (DRAFT → SUBMITTED → APPROVED/REJECTED)

Mọi state machine sống ở `lib/workflows/<entity>.ts`. Test bằng unit test thuần (input/output) không cần infrastructure.

---

## 5. Component Organization (Câu hỏi 4)

### 5.1. Quyết định: **Hybrid** — `components/ui/`, `components/shared/`, **`features/<phân-hệ>/`**

**Lý do:**
- App có 14 phân hệ → flat-by-type (`components/forms/`, `components/tables/`) sẽ phình to nhanh, mỗi folder 50+ files trộn từ nhiều domain
- Pure feature-based làm khó tái sử dụng UI primitives
- Hybrid: shadcn primitives + global shared ở `components/`, business components đi cùng feature folder ở `features/`

### 5.2. Cấu trúc cuối

```
components/
├── ui/                        # shadcn primitives (Button, Card, Dialog, ...)
├── layout/                    # AppShell, AppSidebar, AppTopbar, Breadcrumb
└── shared/                    # Cross-feature reusable
    ├── data-table/            # TanStack Table wrapper, filter bar, pagination
    ├── status-badge/          # StatusBadge với color map theo status enum
    ├── form-fields/           # FormInput, FormSelect, FormDateRangePicker
    ├── attachments/           # AttachmentList, AttachmentUploader (mock)
    ├── empty-state/           # EmptyState với illustration
    ├── confirm-dialog/        # Dialog xác nhận hủy/xóa/nộp
    └── timeline/              # ActivityTimeline, StatusHistory

features/
├── auth/
│   ├── components/            # LoginForm, RoleBadge
│   └── hooks/
├── program-cycle/             # M2.1
│   ├── components/
│   │   ├── CycleStatusStepper.tsx       # 7-state stepper
│   │   ├── CycleConfigForm.tsx
│   │   ├── CycleDetailTabs.tsx
│   │   ├── EmailComposer.tsx
│   │   └── InvitedOrgsTable.tsx
│   └── lib/                   # Feature-local helpers
│       └── format-cycle.ts
├── organization/              # M2.2
│   └── components/
│       ├── OrgProfileForm.tsx
│       ├── ContactPersonsField.tsx
│       └── CapabilityEditor.tsx
├── project/                   # M2.3
│   ├── components/
│   │   ├── ProjectWizard/             # 6-step wizard root
│   │   │   ├── index.tsx
│   │   │   ├── Step1GeneralInfo.tsx
│   │   │   ├── Step2Objectives.tsx
│   │   │   ├── Step3Budget.tsx
│   │   │   ├── Step4Manager.tsx
│   │   │   ├── Step5Documents.tsx
│   │   │   └── Step6Review.tsx
│   │   ├── ProjectStatusBadge.tsx
│   │   ├── ProjectTimeline.tsx
│   │   ├── ProjectDetailTabs.tsx
│   │   └── ProjectVersionDiff.tsx
│   ├── lib/
│   │   ├── project-schema.ts          # Zod schemas per step
│   │   └── project-store.ts           # Zustand store cho wizard
│   └── hooks/
├── review/                    # M2.4 (chuyên viên kiểm tra)
├── evaluation/                # M3
│   └── components/
│       ├── CouncilForm.tsx
│       ├── CouncilMemberPicker.tsx
│       ├── ScoreSheetForm.tsx        # Phiếu chấm động theo tiêu chí
│       └── ScoreAggregationTable.tsx
├── approval/                  # M3
├── contract/                  # M4
├── implementation/            # M4
├── amendment/                 # M4
├── report/                    # M5
├── acceptance/                # M5
├── financial/                 # M5
├── dashboard/                 # M6
├── notification/              # M6
├── catalog/                   # M1 — 8 lists
│   └── components/
│       └── CatalogCRUDPage.tsx        # Generic CRUD reusable cho 8 catalogs
├── user/                      # M1
├── role/                      # M1
└── audit/                     # M1
```

**Quy tắc:**
- Component < 300 dòng → tách subcomponent vào folder cùng tên
- Component dùng > 1 feature → promote lên `components/shared/`
- KHÔNG import cross-feature trực tiếp; nếu cần share, thông qua `components/shared/` hoặc `lib/services/`

---

## 6. Server Actions vs API Routes Policy (Câu hỏi 5)

### 6.1. Quyết định: **Server Actions cho 95% trường hợp**

| Use case | Server Action | API Route | Lý do |
|----------|:-:|:-:|------|
| Form submit (tạo/sửa đề án, chấm điểm, ...) | ✅ | | Type-safe end-to-end, không cần fetch boilerplate |
| Click button update status (open cycle, submit project) | ✅ | | Same as above |
| Upload file (mock) | ✅ | | Server Action hỗ trợ FormData |
| Delete record | ✅ | | |
| Login / NextAuth | | ✅ | NextAuth yêu cầu route handler `[...nextauth]` |
| Download PDF (`/api/pdf/de-an/[id]`) | | ✅ | Browser cần URL trực tiếp; route handler trả Buffer/Stream |
| Download Excel (`/api/excel/export/...`) | | ✅ | Same |
| File download `/api/file/[id]` | | ✅ | Stream file từ public/mock-files với Content-Disposition |
| Webhook nhận từ ngoài | | ✅ | (Không có trong POC) |
| Cron / scheduled job (warning SLA) | | ✅ | Trigger qua `/api/cron/*` từ vercel cron hoặc test button |

### 6.2. Quy ước Server Action

```typescript
// app/(app)/de-an/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { canCreateProject } from "@/lib/workflows/programCycle";
import { CreateProjectSchema } from "@/features/project/lib/project-schema";

// Pattern: validate input → check auth → check permission → check business guard → mutate → audit → revalidate
export async function createProject(input: unknown) {
  // 1. Auth
  const session = await auth();
  if (!session) throw new Error("Chưa đăng nhập");

  // 2. RBAC
  if (!can(session.user.role, "de-an", "create"))
    throw new Error("Không có quyền tạo đề án");

  // 3. Validate
  const data = CreateProjectSchema.parse(input);

  // 4. Business guard
  const cycle = await prisma.programCycle.findUniqueOrThrow({ where: { id: data.programCycleId } });
  if (!canCreateProject(cycle)) throw new Error("Chu kỳ chưa mở đăng ký");

  // 5. Mutate + audit (transaction)
  const project = await prisma.$transaction(async (tx) => {
    const p = await tx.project.create({ data: { ...data, createdById: session.user.id } });
    await tx.auditLog.create({
      data: { userId: session.user.id, action: "CREATE", resource: "Project", resourceId: p.id }
    });
    return p;
  });

  // 6. Revalidate
  revalidatePath("/de-an");
  return { ok: true, projectId: project.id };
}
```

### 6.3. Data fetching: **Server Components là default**

- Page component (`page.tsx`) là RSC → đọc data từ Prisma trực tiếp, không cần API route
- TanStack Query CHỈ dùng client-side khi cần refetch nhiều/optimistic update (vd: dashboard widget refresh, notification inbox poll)

---

## 7. RBAC Architecture (Câu hỏi 6)

### 7.1. Quyết định: **3 lớp enforcement**

```
┌──────────────────────────────────────────────────────────┐
│ Lớp 1: Middleware (route guard)                           │
│  - Check authenticated                                    │
│  - Redirect /login nếu chưa auth                          │
│  - KHÔNG check role ở đây (overhead + URL không role-tied)│
└──────────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────────┐
│ Lớp 2: Layout / Page (UI guard)                           │
│  - Layout (app)/layout.tsx: load session 1 lần            │
│  - Sidebar render menu items qua `getMenuItems(role)`     │
│  - Page check `can(role, resource, "read")` → 403 page   │
└──────────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────────┐
│ Lớp 3: Server Action / Service (data guard) ← AUTHORITATIVE│
│  - Mọi action call `can(role, resource, action)` đầu hàm  │
│  - Đây là chỗ DUY NHẤT có thể trust để bảo vệ data        │
│  - Filter query theo organizationId nếu role = DONVI      │
└──────────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────────┐
│ Lớp 4 (optional): Component-level (UI polish)             │
│  - <Can resource="de-an" action="approve"> Button </Can>  │
│  - Ẩn nút thay vì show rồi báo lỗi (UX tốt hơn)           │
└──────────────────────────────────────────────────────────┘
```

### 7.2. `lib/permissions.ts` shape

```typescript
// lib/permissions.ts
export const ROLES = {
  ADMIN: "ADMIN",
  BANQL: "BANQL",
  CHUYENVIEN: "CHUYENVIEN",
  HOIDONG: "HOIDONG",
  DONVI: "DONVI",
  TAICHINH: "TAICHINH",
  LANHDAO: "LANHDAO",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
export type Resource = "chuong-trinh" | "de-an" | "tham-dinh" | "hop-dong" | "trien-khai" | "bao-cao" | "tai-chinh" | "danh-muc" | "nguoi-dung" | "thong-bao";
export type Action = "read" | "create" | "update" | "delete" | "submit" | "approve" | "assign" | "score";

// Matrix: [resource][action] = roles allowed
const MATRIX: Record<Resource, Partial<Record<Action, Role[]>>> = {
  "chuong-trinh": {
    read: ["ADMIN", "BANQL", "DONVI", "HOIDONG", "LANHDAO"],
    create: ["BANQL"],
    update: ["BANQL"],
    approve: ["LANHDAO"],
  },
  "de-an": {
    read: ["ADMIN", "BANQL", "CHUYENVIEN", "HOIDONG", "DONVI", "LANHDAO"],
    create: ["DONVI"],
    update: ["DONVI", "BANQL"],
    submit: ["DONVI"],
    approve: ["LANHDAO"],
    assign: ["BANQL"],
  },
  "tham-dinh": {
    read: ["BANQL", "HOIDONG", "LANHDAO"],
    score: ["HOIDONG"],
  },
  // ... 14 modules
};

export function can(role: Role, resource: Resource, action: Action): boolean {
  return MATRIX[resource]?.[action]?.includes(role) ?? false;
}

// Sidebar menu builder
export function getMenuItems(role: Role): MenuItem[] {
  return ALL_MENU_ITEMS.filter(item => can(role, item.resource, "read"));
}
```

### 7.3. Sidebar dynamic

`components/layout/AppSidebar.tsx` (RSC):

```tsx
import { auth } from "@/lib/auth";
import { getMenuItems } from "@/lib/permissions";

export async function AppSidebar() {
  const session = await auth();
  const items = getMenuItems(session!.user.role);
  return <nav>{items.map(item => <MenuLink {...item} />)}</nav>;
}
```

### 7.4. Row-level security cho DONVI

Trong service:
```typescript
// Đơn vị chỉ thấy đề án của tổ chức mình
const projects = await prisma.project.findMany({
  where: {
    ...(session.user.role === "DONVI"
      ? { organizationId: session.user.organizationId }
      : {}),
  },
});
```

---

## 8. Mock Data Architecture (Câu hỏi 7)

### 8.1. Cấu trúc seed

```
prisma/
├── schema.prisma
├── seed.ts                    # Entry point (idempotent)
└── seed/
    ├── users.ts
    ├── organizations.ts
    ├── catalogs.ts
    ├── program-cycles.ts      # 3 cycles: 2024 (COMPLETED), 2025 (APPROVED), 2026 (OPEN_REGISTRATION)
    ├── projects.ts            # 12-15 projects covering all statuses
    ├── councils.ts
    ├── contracts.ts
    ├── reports.ts
    ├── notifications.ts
    └── helpers/
        ├── vietnamese-names.ts   # Real Vietnamese names array
        ├── real-orgs.ts          # VITAS, VINATEX, LEFASO, ...
        ├── date-scatter.ts       # Distribute dates relative to today
        └── factory.ts            # Builder helpers
```

### 8.2. Idempotency pattern

```typescript
// prisma/seed.ts
async function main() {
  await seedRoles();          // upsert by code
  await seedUsers();          // upsert by username
  await seedCatalogs();       // upsert by code
  await seedOrganizations();  // upsert by code (VITAS, VINATEX...)
  await seedProgramCycles();  // upsert by year
  await seedProjects();       // upsert by code (XTTM-2026-001...)
  await seedCouncils();
  // ...
}
```

Mọi entity có `unique` field → dùng `upsert` để chạy lại nhiều lần không nhân bản.

### 8.3. Vietnamese realism

```typescript
// prisma/seed/helpers/real-orgs.ts
export const REAL_ORGS = [
  { code: "VITAS",   name: "Hiệp hội Dệt may Việt Nam",          type: "ASSOCIATION" },
  { code: "VINATEX", name: "Tập đoàn Dệt May Việt Nam",          type: "ENTERPRISE" },
  { code: "LEFASO",  name: "Hiệp hội Da giày - Túi xách VN",     type: "ASSOCIATION" },
  { code: "VASEP",   name: "Hiệp hội Chế biến và XK Thủy sản VN", type: "ASSOCIATION" },
  { code: "VCCI",    name: "Liên đoàn TM&CN Việt Nam",            type: "ASSOCIATION" },
  // ... 10-12 đơn vị
];

// prisma/seed/helpers/vietnamese-names.ts
export const VN_FULL_NAMES = [
  "Nguyễn Văn An", "Trần Thị Bình", "Lê Quang Cường", "Phạm Thanh Dũng",
  "Hoàng Mai Linh", "Vũ Đức Minh", "Đặng Thu Hà", "Bùi Xuân Hồng", ...
];
```

### 8.4. Date scatter cho SLA demo

```typescript
// prisma/seed/helpers/date-scatter.ts
const TODAY = new Date();
export const dates = {
  past: (days: number)   => addDays(TODAY, -days),
  future: (days: number) => addDays(TODAY, days),
};

// Trong projects.ts:
const projects = [
  // Đề án 1: HĐ ký đúng hạn (45 ngày sau approval)
  { ..., approvalDate: dates.past(45), contractSignedDate: dates.past(40) },
  // Đề án 2: HĐ chậm 65 ngày — TRIGGER WARNING 60-day
  { ..., approvalDate: dates.past(65), contractSignedDate: null },
  // Đề án 3: Sự kiện QT 25 ngày tới, chưa liên hệ TV — TRIGGER WARNING 30-day
  { ..., plannedStartAt: dates.future(25), contactedConsulate: false },
  // Đề án 4: Hoạt động xong 18 ngày trước, chưa nộp BC — TRIGGER WARNING 15-day
  { ..., actualEndAt: dates.past(18), reportSubmittedAt: null },
];
```

---

## 9. Build Order / Dependency Graph (Câu hỏi 8)

### 9.1. Đồ thị phụ thuộc

```
                    M0 Bootstrap (Next + Prisma + shadcn + NextAuth)
                              │
                              ▼
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
   M1.user/role          M1.catalogs         M1.audit-log
   (parallel)            (parallel)          (lazy — phase cuối)
         │                    │
         └────────────────────┘
                    │
                    ▼
            M2.1 ProgramCycle  ◀── Hero flow gate
                    │
                    ▼
            M2.2 Organization (Đơn vị chủ trì)
                    │
                    ▼
            M2.3 Project Wizard (6 steps)
                    │
                    ▼
            M2.4 Receive + Assign + Review
                    │
                    ▼
            M3 Evaluation Council + Score
                    │
                    ▼
            M3 Approval (Tờ trình + Quyết định)  ◀── HERO FLOW DEMO STOPS HERE
                    │
                    ▼
            M4 Contract
                    │
                    ▼
            M4 Implementation Plan + Milestones
                    │
                    ├──────► M4 Amendment (NĐ 28 Điều 13)
                    │
                    ▼
            M5 Reports
                    │
                    ▼
            M5 Acceptance + Liquidation
                    │
                    ▼
            M5 Financial (advance/payment/settlement)
                    │
                    ▼
            M6 Dashboard (sau khi đủ data)
                    │
                    ▼
            M6 Notification (lay across, finalize last)
                    │
                    ▼
            M7 Polish + Demo prep
```

### 9.2. Critical path đến hero flow

**Tối thiểu để demo M2-M3 hero flow** (theo `🎬 FLOW DEMO CHUẨN`):

| # | Phase | Có thể stub? | Phải real? |
|---|-------|:-:|:-:|
| 1 | M0 Bootstrap | | ✅ Real |
| 2 | M1 User + Role + 8 hardcoded accounts | | ✅ Real |
| 3 | M1 Permission matrix UI | ✅ Stub (có matrix code, UI cấu hình lùi sau) | |
| 4 | M1 8 Catalogs CRUD | ✅ Stub seed-only cho 5/8 | 3 must real (loại đề án, ngành, tiêu chí thẩm định) |
| 5 | M2.1 ProgramCycle CRUD + state machine + email composer | | ✅ Real |
| 6 | M2.2 OrgProfile CRUD | | ✅ Real |
| 7 | M2.3 Project 6-step wizard | | ✅ Real |
| 8 | M2.4 Receive + Assign + Checklist + Score sơ bộ | | ✅ Real |
| 9 | M3 Council + ScoreSheet + Aggregate | | ✅ Real |
| 10 | M3 Approval (tờ trình + decision) | | ✅ Real |
| 11 | M4 Contract | ✅ Stub list page only | |
| 12 | M5 Reports/Acceptance | ✅ Stub list page | |
| 13 | M6 Dashboard | ✅ Stub trừ widgets cảnh báo SLA | Real cảnh báo (60d HĐ, 30d ngoại giao, 15d BC) |
| 14 | M6 Notification inbox | ✅ Real seed data, UI list đơn giản | |

**Có thể stub hoàn toàn cho hero demo, làm sau:**
- M5 Financial (tạm ứng/quyết toán) — chỉ cần list page với mock data
- M4 Amendment — show button "Đề nghị điều chỉnh" disabled hoặc dialog "Sẽ phát triển"
- Audit log UI (data vẫn ghi vào DB từ đầu, UI có thể làm phase cuối)

### 9.3. Khuyến nghị xếp lịch theo phase GSD

| GSD Phase | Module | Output |
|-----------|--------|--------|
| Phase 1 | M0 + M1 (user/role/catalog seed) | Login working, sidebar render theo role |
| Phase 2 | M2.1 ProgramCycle | BQL tạo cycle, state machine 7 trạng thái, gating |
| Phase 3 | M2.2 + M2.3 OrgProfile + Project Wizard | Đơn vị tạo đề án, multi-step form, lưu nháp |
| Phase 4 | M2.4 + M3 Receive → Score → Approval | Hero flow end-to-end |
| Phase 5 | M4 Contract + Implementation | |
| Phase 6 | M4 Amendment + M5 Reports | |
| Phase 7 | M5 Acceptance + Liquidation + Financial | |
| Phase 8 | M6 Dashboard + Notification | |
| Phase 9 | M7 Polish + Mock data scatter + Demo script | |

---

## 10. Multi-Step Form Architecture (Câu hỏi 9)

### 10.1. Quyết định: **Single URL** với step state Zustand + RHF + autosave draft

**Lý do:**

| Pattern | Pros | Cons | Quyết định |
|---------|------|------|-----------|
| URL-per-step (`/de-an/new/buoc-1`, ...) | Browser back/forward; deep link; refresh ko mất step | Phải sync state qua context/store xuyên route; complexity cao; user unfriendly khi lỡ navigate giữa chừng mất data | LOẠI |
| Single URL + step state local | Đơn giản; state sống trong component; nhanh setup | Refresh mất state | Tốt cho form ngắn, không phù hợp cho 6 step |
| **Single URL + Zustand + autosave Draft trong DB** | Đơn giản về URL; refresh không mất data (lấy từ DB draft); user có thể quit và quay lại tiếp | Cần endpoint autosave | **CHỌN** |

### 10.2. Triển khai

```typescript
// features/project/lib/project-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type WizardStore = {
  currentStep: number;
  draftId: string | null;
  formData: Partial<ProjectFormData>;
  setStep: (n: number) => void;
  setDraftId: (id: string) => void;
  patchData: (data: Partial<ProjectFormData>) => void;
  reset: () => void;
};

export const useWizardStore = create<WizardStore>()(
  persist(
    (set) => ({
      currentStep: 1,
      draftId: null,
      formData: {},
      setStep: (n) => set({ currentStep: n }),
      setDraftId: (id) => set({ draftId: id }),
      patchData: (data) => set((s) => ({ formData: { ...s.formData, ...data } })),
      reset: () => set({ currentStep: 1, draftId: null, formData: {} }),
    }),
    { name: "project-wizard" }  // persist localStorage để resume lúc refresh
  )
);
```

```tsx
// app/(app)/de-an/new/page.tsx
"use client";
import { useWizardStore } from "@/features/project/lib/project-store";
import { Step1, Step2, Step3, Step4, Step5, Step6 } from "@/features/project/components/ProjectWizard";

const STEPS = [Step1, Step2, Step3, Step4, Step5, Step6];

export default function NewProjectPage() {
  const { currentStep } = useWizardStore();
  const StepComponent = STEPS[currentStep - 1];
  return (
    <>
      <WizardProgress current={currentStep} total={6} />
      <StepComponent />
    </>
  );
}
```

### 10.3. Validation per step

Mỗi step có Zod schema riêng (partial schema), step cuối validate full schema:

```typescript
// features/project/lib/project-schema.ts
export const Step1Schema = z.object({
  name: z.string().min(5, "Tên đề án ít nhất 5 ký tự"),
  kind: z.nativeEnum(ProjectKind),
  industrySectorId: z.string().cuid(),
});
export const Step2Schema = z.object({ objective: z.string().min(20), ... });
// ...
export const FullProjectSchema = Step1Schema.merge(Step2Schema)...;
```

### 10.4. Autosave draft

Sau mỗi step "Tiếp tục" → call Server Action `saveDraft(draftId, partialData)` → update Project (status DRAFT). Nếu user refresh, RSC load draft từ DB và hydrate Zustand store.

---

## 11. PDF Generation Strategy (Câu hỏi 10)

### 11.1. Quyết định: **`@react-pdf/renderer` server-side**

| Lựa chọn | Vietnamese diacritic | Server-side | Layout |
|----------|:-:|:-:|:-:|
| jsPDF (client) | Cần manual base64 font register, dễ hỏng | ❌ | Nguyên thủy |
| `@react-pdf/renderer` (server) | `Font.register({src: ...ttf})` chuẩn | ✅ `renderToBuffer` | JSX-like, dễ |
| Puppeteer/Playwright HTML→PDF | Tốt | ✅ nhưng nặng | Tốt nhất |

**Chọn `@react-pdf/renderer`** vì:
- Font register tường minh, đơn giản
- `renderToBuffer()` trả Buffer trực tiếp trong API route
- Không cần Puppeteer (heavy dependency)

### 11.2. Cấu trúc

```
features/pdf/
├── fonts/
│   ├── BeVietnamPro-Regular.ttf
│   ├── BeVietnamPro-Bold.ttf
│   └── BeVietnamPro-Italic.ttf
├── templates/
│   ├── DeAnPDF.tsx           # In hồ sơ đề án
│   ├── QuyetDinhPDF.tsx      # Quyết định phê duyệt
│   ├── ToTrinhPDF.tsx        # Tờ trình
│   ├── BienBanNghiemThuPDF.tsx
│   └── HopDongPDF.tsx
└── lib/
    └── render.ts             # renderToBuffer wrapper
```

```tsx
// features/pdf/templates/DeAnPDF.tsx
import { Document, Page, Text, View, Font, StyleSheet } from "@react-pdf/renderer";

Font.register({
  family: "BeVietnamPro",
  fonts: [
    { src: "public/fonts/BeVietnamPro-Regular.ttf" },
    { src: "public/fonts/BeVietnamPro-Bold.ttf", fontWeight: "bold" },
  ],
});

export const DeAnPDF = ({ project }) => (
  <Document>
    <Page size="A4" style={{ fontFamily: "BeVietnamPro", padding: 40 }}>
      <Text style={{ fontWeight: "bold", fontSize: 16 }}>HỒ SƠ ĐỀ ÁN XÚC TIẾN THƯƠNG MẠI</Text>
      <Text>Tên đề án: {project.name}</Text>
      <Text>Đơn vị chủ trì: {project.organization.name}</Text>
      {/* ... */}
    </Page>
  </Document>
);
```

```typescript
// app/api/pdf/de-an/[id]/route.ts
import { renderToBuffer } from "@react-pdf/renderer";
import { DeAnPDF } from "@/features/pdf/templates/DeAnPDF";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const project = await getProjectFull(params.id);
  const buffer = await renderToBuffer(<DeAnPDF project={project} />);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="de-an-${project.code}.pdf"`,
    },
  });
}
```

### 11.3. Font khuyến nghị

**Be Vietnam Pro** (Google Fonts, miễn phí, hỗ trợ đầy đủ tiếng Việt) hoặc **Inter** (cũng OK với diacritic). Tải `.ttf` đặt vào `public/fonts/`.

**Cảnh báo:** Tránh chỉ dựa vào font hệ thống — `@react-pdf/renderer` mặc định dùng Helvetica không có diacritic VN, sẽ render thành ô vuông.

---

## 12. Component Boundaries & Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│ app/(app)/<feature>/page.tsx (SERVER COMPONENT)              │
│   ├─ async fetch via prisma + lib/services                   │
│   ├─ renders <FeatureClientComponent data={...} />           │
│   └─ passes Server Action references as props                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼ (RSC payload)
┌─────────────────────────────────────────────────────────────┐
│ features/<feature>/components/*.tsx ("use client")            │
│   ├─ React Hook Form (form state)                            │
│   ├─ Zustand (UI state: wizard step, sidebar collapse)       │
│   ├─ TanStack Query (poll/refresh notifications, dashboard)  │
│   ├─ Calls Server Action on submit/click                     │
│   └─ shadcn/ui primitives + components/shared                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼ (form action / direct call)
┌─────────────────────────────────────────────────────────────┐
│ app/(app)/<feature>/actions.ts ("use server")                 │
│   ├─ auth() → check session                                  │
│   ├─ can() → RBAC check                                      │
│   ├─ Zod validate                                            │
│   ├─ workflow guard (canTransition...)                       │
│   ├─ prisma.$transaction(mutate + audit)                     │
│   └─ revalidatePath()                                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ lib/services/<entity>.ts (pure business logic, optional)      │
│   - Complex calculations (score aggregation, budget rollup)  │
│   - Reusable across actions + RSC + API routes               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ lib/prisma.ts (PrismaClient singleton)                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
                    SQLite (dev.db)
```

---

## 13. Anti-Patterns (Tránh)

| Anti-pattern | Vì sao xấu | Thay bằng |
|--------------|-----------|-----------|
| Tạo API route cho mọi mutation | Boilerplate, mất type safety, phải fetch ở client | Server Actions |
| RBAC chỉ ở middleware | Không bảo vệ data, action có thể bị gọi tùy ý | RBAC trong Server Action (lớp 3 authoritative) |
| Status string literal rải rác (`if (status === "draft")`) | Typo, không refactor được | Prisma enum + import |
| Nested folder phân quyền theo role (`(banql)/de-an`) | Duplicate route, user 2 role bị kẹt | Single `(app)`, sidebar dynamic |
| useReducer cho form | Boilerplate, không có validation tích hợp | React Hook Form + Zod |
| useState cho server state | Không có cache, double-fetch | RSC fetch hoặc TanStack Query |
| Tạo helper sớm cho 2 chỗ giống nhau | Premature abstraction | Đợi 3+ chỗ rồi extract |
| Ghi business logic trong React component | Không tái sử dụng được, khó test | Tách `lib/services/<entity>.ts` |
| Soft delete khắp mọi entity | Phình schema, khó query | Chỉ ở Project + Contract |
| Hardcode list giá trị enum trong UI | Không sync với schema | Import từ `@prisma/client` enum |

---

## 14. Scalability Considerations

| Concern | POC (10-15 records) | Production (estimate) |
|---------|--------------------|-----------------------|
| Database | SQLite file | PostgreSQL (migrate Prisma schema) |
| Auth | NextAuth Credentials, 8 acc cứng | NextAuth + SSO Bộ Công Thương + USB token integration |
| File storage | `public/mock-files/` | S3-compatible (MinIO / AWS S3) |
| PDF generation | Sync trong route handler | Queue (BullMQ) cho file lớn |
| Notification | DB inbox + mock email | Real SMTP/SMS gateway |
| Audit log | Same DB, basic | Append-only WORM storage |
| Search | Prisma `contains` (LIKE) | Full-text (Postgres tsvector / Meilisearch) |
| Sessions | JWT in cookie | Same hoặc redis-backed |

POC architecture **migration path rõ ràng** — không lock-in vào SQLite/NextAuth Credentials. Cấu trúc folder + service layer giữ nguyên khi production hóa.

---

## 15. Sources

**Verified high-confidence:**
- [Next.js 15 App Router — Project Structure (official)](https://nextjs.org/docs/app/getting-started/project-structure) — HIGH (official)
- [File-system conventions: Route Groups (official)](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) — HIGH (official)
- [Next.js Server Actions: The Complete Guide (2026)](https://makerkit.dev/blog/tutorials/nextjs-server-actions) — MEDIUM
- [Server Actions vs Route Handlers: When to Use Each in Next.js](https://makerkit.dev/blog/tutorials/server-actions-vs-route-handlers) — MEDIUM
- [Next.js 15 Server Actions vs Route Handlers (DEV.to)](https://dev.to/whoffagents/nextjs-15-server-actions-vs-route-handlers-when-to-use-each-i-got-this-wrong-for-3-months-49hm) — MEDIUM

**Architecture & RBAC:**
- [How to Use Middleware for Role Based Access Control in Next js 15 App Router](https://www.jigz.dev/blogs/how-to-use-middleware-for-role-based-access-control-in-next-js-15-app-router) — MEDIUM
- [RBAC in Next.js — Practical Guide for Multi-Role (Medium)](https://medium.com/@seemantkamlapuri88/rbac-in-next-js-a-practical-guide-for-multi-role-access-permissions-37c62b8d9153) — MEDIUM
- [Best Practices for Organizing Your Next.js 15 (DEV.to, 2025)](https://dev.to/bajrayejoon/best-practices-for-organizing-your-nextjs-15-2025-53ji) — MEDIUM
- [The Ultimate Guide to Organizing Your Next.js 15 Project Structure (Wisp CMS)](https://www.wisp.blog/blog/the-ultimate-guide-to-organizing-your-nextjs-15-project-structure) — MEDIUM
- [Next.js 15 Project Structure: Full-Stack Guide (2026)](https://www.groovyweb.co/blog/nextjs-project-structure-full-stack) — MEDIUM

**Prisma:**
- [Prisma Schema Design: Relationships, Enums, and Indexes That Scale](https://dev.to/whoffagents/prisma-schema-design-relationships-enums-and-indexes-that-scale-9gm) — MEDIUM
- [Implementing Entity Audit Log with Prisma (Medium)](https://medium.com/@gayanper/implementing-entity-audit-log-with-prisma-9cd3c15f6b8e) — MEDIUM
- [Prisma Advanced Patterns — Viprasol](https://viprasol.com/blog/prisma-advanced-patterns/) — MEDIUM

**State machines:**
- [XState v5 is here (Stately blog)](https://stately.ai/blog/2023-12-01-xstate-v5) — HIGH (official)
- [State Machines (Stately docs)](https://stately.ai/docs/states) — HIGH (official)

**Forms:**
- [Building a reusable multi-step form with React Hook Form and Zod (LogRocket)](https://blog.logrocket.com/building-reusable-multi-step-form-react-hook-form-zod/) — MEDIUM
- [React Hook Form Multi-Step Tutorial: Zustand + Zod + Shadcn](https://www.buildwithmatija.com/blog/master-multi-step-forms-build-a-dynamic-react-form-in-6-simple-steps) — MEDIUM

**PDF:**
- [react-pdf vs @react-pdf/renderer vs jsPDF 2026 — PkgPulse Blog](https://www.pkgpulse.com/blog/react-pdf-vs-react-pdf-renderer-vs-jspdf-pdf-in-react-2026) — MEDIUM
- [Render PDF server-side with NextJS (react-pdf discussion)](https://github.com/diegomura/react-pdf/discussions/2402) — MEDIUM
- [PDF generation with React Components using Next.js at Server Side (Medium)](https://medium.com/@stanleyfok/pdf-generation-with-react-componenets-using-next-js-at-server-side-ee9c2dea06a7) — MEDIUM

**Domain source documents (project repo):**
- `d:/Thaodnp/XTTM/.planning/PROJECT.md` — HIGH (project context)
- `d:/Thaodnp/XTTM/CLAUDE.md` — HIGH (module list, RBAC, folder structure starting point)
- `d:/Thaodnp/XTTM/_extracted_quytrinh.txt` — HIGH (27-step process, 190 functions)
