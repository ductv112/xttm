---
phase: 05-m2.3-khai-báo-nộp-đề-án
plan: 01
title: Schema verify + state machine + server actions + seed cho Project
wave: 1
autonomous: yes
depends_on: []
files_modified:
  - prisma/schema.prisma
  - lib/workflows/project.ts
  - prisma/seed.ts
  - prisma/seed/projects.ts
  - lib/audit-types.ts
  - app/(app)/de-an/_actions/types.ts
  - app/(app)/de-an/_actions/list-mine.ts
  - app/(app)/de-an/_actions/get-detail.ts
  - app/(app)/de-an/_actions/save-draft.ts
  - app/(app)/de-an/_actions/submit.ts
  - app/(app)/de-an/_actions/withdraw.ts
  - app/(app)/de-an/_actions/copy-from-previous.ts
  - app/(app)/de-an/_actions/list-previous.ts
  - app/(app)/de-an/_actions/upload-document.ts
requirements: [PROJ-01, PROJ-03, PROJ-12, PROJ-13, PROJ-14, PROJ-15, PROJ-17, PROJ-18, PROJ-19, PROJ-20, PROJ-21, PROJ-22]
---

<objective>
Build complete server-side foundation cho Phase 5: Project state machine với gating logic, 9 server actions, ProjectVersion snapshot pattern, parentProjectId for đề án 2 năm, mock seed.
</objective>

<threat_model>
- T-05-01-01 (high): Đơn vị submit đề án ngoài chu kỳ OPEN — guard via canTransitionProject + active cycle check
- T-05-01-02 (high): Cross-tenant access — entity-aware filter (where: { organizationId: session.user.organizationId })
- T-05-01-03 (medium): Mass assignment — Zod whitelist
- T-05-01-04 (medium): Path traversal — UUID filename + path.resolve guard for documents
</threat_model>

<must_haves>
1. State machine: DRAFT → SUBMITTED → ASSIGNED → IN_REVIEW → (SUPPLEMENT_REQUIRED → RESUBMITTED → IN_REVIEW)* → VALID → EVALUATING → APPROVED → IN_PROGRESS → COMPLETED
2. SUBMITTED → DRAFT (rút hồ sơ if not assigned)
3. parentProjectId for đề án 2 năm
4. ProjectVersion snapshot on each resubmit
5. 5+ seeded projects covering diverse states
</must_haves>

<task n="1" id="05-01-01" type="schema-and-workflow">
<read_first>
- d:/Thaodnp/XTTM/prisma/schema.prisma
- d:/Thaodnp/XTTM/lib/workflows/project.ts (skeleton)
- d:/Thaodnp/XTTM/lib/workflows/programCycle.ts (pattern)
- d:/Thaodnp/XTTM/lib/workflows/orgProfile.ts (pattern)
- d:/Thaodnp/XTTM/lib/audit-types.ts
</read_first>

<action>
1. Verify Project model in schema.prisma has: id, programCycleId (FK), organizationId (FK), parentProjectId (FK self-ref nullable), kind (enum from catalog), name, year (Int), status (enum), generalInfoJson (Json — industry/market/country/promotion/timeRange), objectivesJson, planJson, budgetJson (rows + total), pmContactId, documents (Attachment relation), submittedAt, assignedToUserId, version (Int default 1), createdById, createdAt, updatedAt. ADD missing fields.
2. Add ProjectVersion model: id, projectId, versionNumber, snapshotJson (full project data at time), createdAt, createdById, reason. ADD if missing.
3. Run `npx prisma db push --accept-data-loss`.
4. Implement complete `lib/workflows/project.ts`:
   - Import enum ProjectStatus
   - Export TRANSITIONS table covering all 11 states + amendments
   - Export canTransitionProject(from, to)
   - Export validateGuards(project) checking: name min 5 chars, kind set, industrySectorIds.length >= 1, planRows.length >= 1, budgetRows.length >= 1, pmContactId set, programCycle.status === OPEN_REGISTRATION (for SUBMITTED transition)
   - Export ALLOWED_NEXT_STATES
   - Export PROJECT_STATUS_LABELS
   - Export PROJECT_STATUS_BADGE_THEME
5. Add audit types: PROJECT_SAVE_DRAFT, PROJECT_SUBMIT, PROJECT_WITHDRAW, PROJECT_RESUBMIT, PROJECT_COPY_FROM_PREVIOUS, PROJECT_UPLOAD_DOCUMENT
6. `npx tsc --noEmit` exit 0
7. Commit: `feat(05-01): Project state machine + ProjectVersion + audit types`
</action>

<acceptance_criteria>
- prisma db push successful
- lib/workflows/project.ts contains TRANSITIONS, canTransitionProject, validateGuards, ALLOWED_NEXT_STATES, PROJECT_STATUS_LABELS, PROJECT_STATUS_BADGE_THEME
- ProjectVersion model exists in schema
- npx tsc --noEmit exit 0
</acceptance_criteria>

<done_when>Schema + workflow + audit types committed.</done_when>
</task>

<task n="2" id="05-01-02" type="server-actions">
<read_first>
- d:/Thaodnp/XTTM/lib/workflows/project.ts (just created)
- d:/Thaodnp/XTTM/app/(app)/chuong-trinh/_actions/create.ts (pattern)
- d:/Thaodnp/XTTM/app/(app)/don-vi-cua-toi/_actions/get-or-create.ts
- d:/Thaodnp/XTTM/lib/audit.ts
- d:/Thaodnp/XTTM/lib/permissions-db.ts
</read_first>

<action>
Create 9 server actions in `app/(app)/de-an/_actions/`:

1. `types.ts` — Zod schemas: generalInfoInternal (zod.object), objectivesInternal, planInternal, budgetInternal, pmContactInternal, documentInternal. Re-export at bottom.

2. `list-mine.ts`:
```
'use server'
import { auth } from '@/lib/auth'; import { prisma } from '@/lib/prisma';
export async function listMyProjects({ year, status, kind }: { year?: number; status?: string; kind?: string } = {}) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error('UNAUTHORIZED');
  return prisma.project.findMany({ where: { organizationId: session.user.organizationId, ...(year && { year }), ...(status && { status: status as any }), ...(kind && { kind }) }, orderBy: { createdAt: 'desc' }, include: { programCycle: true } });
}
```

3. `get-detail.ts`: action `getProjectDetail(id)` — verify session.user.organizationId === project.organizationId OR canFromDB('project', 'view'), return with documents + parent + child + versions

4. `save-draft.ts`: action `saveDraftProject(input)` — accept full draft form data, find existing DRAFT project by org+year+programCycleId or create new, update or create with status DRAFT, withAuditLog. Used by autosave.

5. `submit.ts`: action `submitProject(projectId)` — get project, validateGuards, canTransition(DRAFT, SUBMITTED), check programCycle.status === OPEN_REGISTRATION, create ProjectVersion snapshot, transition + submittedAt, audit, notification BQL. If 2-year flag: also create year+1 record với parentProjectId + status TENTATIVE

6. `withdraw.ts`: action `withdrawProject(projectId)` — verify status SUBMITTED + assignedToUserId null, transition SUBMITTED → DRAFT, audit

7. `copy-from-previous.ts`: action `copyFromPrevious(sourceProjectId)` — get source project, create new draft with prefilled data (name + " (sao chép)"), kind, generalInfoJson (without timeRange), objectivesJson, planJson, budgetJson — leave name + year for user to update

8. `list-previous.ts`: action `listPreviousProjects()` — return projects of same organization từ last year, status APPROVED+, for the copy dialog

9. `upload-document.ts`: action with FormData — validate file type (PDF/DOC/DOCX/XLSX/JPG/PNG) + max 10MB + magic byte for PDF, save to storage/uploads/de-an/[projectId]/[uuid], create Attachment

All wrap with withAuditLog where mutations. All use 'use server'. Type-check after each. Commit batches:
- Batch A: types.ts + list-mine.ts + get-detail.ts + list-previous.ts (read-only)
- Batch B: save-draft.ts + submit.ts + withdraw.ts (writes)
- Batch C: copy-from-previous.ts + upload-document.ts (specials)
</action>

<acceptance_criteria>
- 9 action files exist
- Each starts with 'use server'
- Each mutation has withAuditLog
- Each protected has authorization check
- npx tsc --noEmit exit 0
</acceptance_criteria>

<done_when>9 actions in 3 commits, tsc clean.</done_when>
</task>

<task n="3" id="05-01-03" type="seed">
<read_first>
- d:/Thaodnp/XTTM/prisma/seed.ts
- d:/Thaodnp/XTTM/prisma/seed/orgProfiles.ts (pattern)
- d:/Thaodnp/XTTM/lib/date.ts
</read_first>

<action>
Create `prisma/seed/projects.ts`:
- Export `seedProjects(prisma)` async
- Find ProgramCycle 2026 (OPEN_REGISTRATION) and 2025 (COMPLETED)
- Find approved orgs (LEFASO, VITAS — only APPROVED OrganizationProfile có thể tạo project)
- Seed 6 mock projects:
  1. **LEFASO 2025 đề án A** (status APPROVED, năm 2025, programCycle 2025) — historical
  2. **LEFASO 2026 đề án mới** (status SUBMITTED, năm 2026) — recent submission
  3. **VITAS 2026 đề án triển lãm** (status DRAFT, năm 2026) — đang soạn
  4. **VITAS 2026 đề án đoàn ra** (status IN_REVIEW, năm 2026) — đang được kiểm tra
  5. **LEFASO 2026 đề án 2 năm part 1** (status SUBMITTED, năm 2026, parentProjectId null) + **LEFASO 2027 đề án 2 năm part 2** (status TENTATIVE, năm 2027, parentProjectId = part 1 id)
  6. (Pair with #5 above)
- Each project has realistic name (e.g., "Hội chợ Vietnam Da giày & Túi xách 2026 — Quảng bá tại EU"), generalInfoJson with industrySectorIds + marketIds + countryIds + promotionTypeIds + timeRange, objectivesJson with HTML rich text content, planJson with 3-5 planRows, budgetJson with 5-8 budget rows totaling realistic VND figures (500M - 2B VND range), pmContactId from org profile contacts

Add `await seedProjects(prisma)` to prisma/seed.ts main entry.

Run `npm run db:seed` — verify project counts match.

Commit: `feat(05-01): seed 6 mock projects covering all states + đề án 2 năm pair`
</action>

<acceptance_criteria>
- File exists prisma/seed/projects.ts
- prisma/seed.ts imports seedProjects
- DB query: prisma.project.count() returns ≥6
- Status mix: APPROVED=1, SUBMITTED=2, DRAFT=1, IN_REVIEW=1, TENTATIVE=1
- Đề án 2 năm pair: 1 project có parentProjectId null + 1 project có parentProjectId set (linking)
- npx tsc --noEmit exit 0
</acceptance_criteria>

<done_when>Seed file + 6 projects in DB, committed.</done_when>
</task>

<verification>npm run build exit 0. Update STATE.md, ROADMAP.md.</verification>
