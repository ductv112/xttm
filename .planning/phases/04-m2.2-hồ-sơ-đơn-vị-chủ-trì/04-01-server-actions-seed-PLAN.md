---
phase: 04-m2.2-hồ-sơ-đơn-vị-chủ-trì
plan: 01
title: Server actions + workflow + seed cho OrganizationProfile
wave: 1
autonomous: yes
depends_on: []
files_modified:
  - prisma/schema.prisma
  - lib/workflows/orgProfile.ts
  - prisma/seed.ts
  - prisma/seed/orgProfiles.ts
  - app/(app)/don-vi-cua-toi/_actions/types.ts
  - app/(app)/don-vi-cua-toi/_actions/get-or-create.ts
  - app/(app)/don-vi-cua-toi/_actions/update.ts
  - app/(app)/don-vi-cua-toi/_actions/submit.ts
  - app/(app)/don-vi-cua-toi/_actions/upload-document.ts
  - app/(app)/don-vi-cua-toi/_actions/contacts.ts
  - app/(app)/don-vi-chu-tri/_actions/list.ts
  - app/(app)/don-vi-chu-tri/_actions/approve.ts
  - app/(app)/don-vi-chu-tri/_actions/reject.ts
requirements: [ORG-01, ORG-02, ORG-03, ORG-04, ORG-05, ORG-06, ORG-07, ORG-08]
---

<objective>
Build foundation cho Phase 4: schema extensions if needed, complete state machine workflow, server actions cho cả 2 vai trò (đơn vị và BQL), seed mock data 5 orgs với statuses khác nhau.
</objective>

<threat_model>
- T-04-01-01 (high): Đơn vị tự gán APPROVED status — mitigated bởi state machine guard + canFromDB('org-profile', 'approve') only BANQL/ADMIN
- T-04-01-02 (medium): File path traversal trong upload-document — mitigated qua UUID filename + path.resolve guard
- T-04-01-03 (medium): Mass assignment trong update — mitigated qua Zod whitelist
- T-04-01-04 (low): Cross-tenant access (đơn vị A xem hồ sơ đơn vị B) — mitigated qua session.user.organizationId === orgProfile.organizationId check
</threat_model>

<must_haves>
**Truths:**
1. Đơn vị chủ trì login → tự động có OrganizationProfile DRAFT (auto-create từ Organization)
2. Đơn vị cập nhật được fields legalInfo, capabilities, contacts, documents
3. Đơn vị submit hồ sơ → status DRAFT → SUBMITTED + audit log + mock notification cho BQL
4. BQL list các profile SUBMITTED → click vào → approve hoặc reject với reason
5. State transitions correct: DRAFT → SUBMITTED → APPROVED/REJECTED, REJECTED → DRAFT, APPROVED stays after edit

**Artifacts:**
- lib/workflows/orgProfile.ts với TRANSITIONS table
- 8 server actions wrapped với canFromDB + withAuditLog
- Seed: 5 orgs với 5 OrganizationProfile (1 APPROVED, 1 SUBMITTED, 1 REJECTED, 2 DRAFT)
</must_haves>

<task n="1" id="04-01-01" type="schema-and-workflow">
<read_first>
- d:/Thaodnp/XTTM/prisma/schema.prisma (current OrganizationProfile model)
- d:/Thaodnp/XTTM/lib/workflows/orgProfile.ts (skeleton)
- d:/Thaodnp/XTTM/lib/workflows/programCycle.ts (pattern reference)
- d:/Thaodnp/XTTM/lib/audit-types.ts
</read_first>

<action>
1. Read prisma/schema.prisma — verify OrganizationProfile has: id, organizationId (FK unique), legalInfo Json (taxCode, address, representativeName, representativeTitle, businessType), capabilities Json (description, achievements, pastProjects), contacts Json[] (name, title, role enum, email, phone), documents (Attachment relation), status enum, rejectionReason String?, submittedAt, approvedAt, approvedById, createdAt, updatedAt. If fields missing, ADD them.
2. Verify enum OrgProfileStatus = DRAFT | SUBMITTED | APPROVED | REJECTED. Add if missing.
3. Run `npx prisma db push --accept-data-loss` if schema changed.
4. Replace `lib/workflows/orgProfile.ts` with complete state machine following the programCycle.ts pattern:
   - Import OrgProfileStatus enum from @prisma/client
   - Export TRANSITIONS const: Record<status, status[]> với { DRAFT: ['SUBMITTED'], SUBMITTED: ['APPROVED', 'REJECTED'], APPROVED: ['DRAFT'], REJECTED: ['DRAFT'] }
   - Export canTransitionOrgProfile(from, to): boolean
   - Export validateGuards(profile): { ok: boolean, errors: string[] } — check: legalInfo.taxCode required + address required + representativeName required + capabilities.description min 50 chars + contacts.length >= 1
   - Export ALLOWED_NEXT_STATES function
   - Export ORG_PROFILE_STATUS_LABELS: Record<status, string> với labels tiếng Việt
   - Export ORG_PROFILE_STATUS_BADGE_THEME: Record<status, 'default'|'success'|'destructive'|'warning'>
5. Add OrgProfile audit types to lib/audit-types.ts: ORG_PROFILE_SUBMIT, ORG_PROFILE_APPROVE, ORG_PROFILE_REJECT, ORG_PROFILE_UPDATE.
6. Run `npx tsc --noEmit` — exit 0.
7. Commit: `feat(04-01): OrgProfile state machine + audit types + schema verify`.
</action>

<acceptance_criteria>
- Read d:/Thaodnp/XTTM/lib/workflows/orgProfile.ts — contains TRANSITIONS, canTransitionOrgProfile, validateGuards, ALLOWED_NEXT_STATES, ORG_PROFILE_STATUS_LABELS, ORG_PROFILE_STATUS_BADGE_THEME (grep all 6 names found)
- Read d:/Thaodnp/XTTM/lib/audit-types.ts — contains ORG_PROFILE_SUBMIT, ORG_PROFILE_APPROVE, ORG_PROFILE_REJECT, ORG_PROFILE_UPDATE (grep 4 names found)
- `npx tsc --noEmit` exits 0
</acceptance_criteria>

<done_when>Workflow + audit types created/extended, tsc clean, committed.</done_when>
</task>

<task n="2" id="04-01-02" type="server-actions">
<read_first>
- d:/Thaodnp/XTTM/lib/workflows/orgProfile.ts (just created)
- d:/Thaodnp/XTTM/app/(app)/chuong-trinh/_actions/create.ts (pattern reference)
- d:/Thaodnp/XTTM/lib/audit.ts
- d:/Thaodnp/XTTM/lib/permissions-db.ts
</read_first>

<action>
Create server actions following the chuong-trinh/_actions pattern:

**For đơn vị chủ trì** (`app/(app)/don-vi-cua-toi/_actions/`):

1. `types.ts` — export internal Zod schemas (legalInfoInternal, capabilitiesInternal, contactsInternal — each as z.object(...))
2. `get-or-create.ts`:
```
'use server'
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function getOrCreateMyProfile() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error('UNAUTHORIZED');
  const orgId = session.user.organizationId;
  let profile = await prisma.organizationProfile.findUnique({ where: { organizationId: orgId }, include: { documents: true, organization: true } });
  if (!profile) {
    profile = await prisma.organizationProfile.create({ data: { organizationId: orgId, status: 'DRAFT', legalInfo: {}, capabilities: {}, contacts: [] }, include: { documents: true, organization: true } });
  }
  return profile;
}
```
3. `update.ts`: action `updateMyProfile(input: { legalInfo?, capabilities?, contacts? })` — verify session.user.organizationId === profile.organizationId, status === DRAFT (cannot edit while SUBMITTED), Zod parse each section, prisma update, withAuditLog wrap
4. `submit.ts`: action `submitMyProfile()` — get profile, validateGuards, canTransitionOrgProfile(DRAFT, SUBMITTED), update status + submittedAt = now, audit, mock notification to BANQL users
5. `upload-document.ts`: action `uploadProfileDocument(formData)` — accept PDF/JPG/PNG, max 10MB, max 10 docs/profile, magic byte check, save to storage/uploads/org-profile/[orgId]/[uuid], create Attachment record
6. `contacts.ts`: actions addContact / updateContact / deleteContact — array manipulation on profile.contacts JSON

**For BQL** (`app/(app)/don-vi-chu-tri/_actions/`):

7. `list.ts`: action `listOrgProfiles({ status?, search? })` — verify canFromDB('org-profile', 'view'), filter by status (default SUBMITTED), search by org name with diacritics removal
8. `approve.ts`: action `approveOrgProfile(profileId)` — verify canFromDB('org-profile', 'approve'), canTransition(SUBMITTED, APPROVED), update status + approvedAt + approvedById, audit, mock notification to đơn vị
9. `reject.ts`: action `rejectOrgProfile(profileId, reason: string)` — Zod validate reason min 10 chars, transition SUBMITTED → REJECTED with rejectionReason, audit, mock notification

All actions wrap with withAuditLog. All have `'use server'`. Run `npx tsc --noEmit` after each batch. Commit each batch.
</action>

<acceptance_criteria>
- Files exist: types.ts, get-or-create.ts, update.ts, submit.ts, upload-document.ts, contacts.ts trong don-vi-cua-toi/_actions/
- Files exist: list.ts, approve.ts, reject.ts trong don-vi-chu-tri/_actions/
- Each file starts with `'use server'`
- Each mutation action contains `withAuditLog`
- Each protected action contains `canFromDB(`
- `npx tsc --noEmit` exit 0
</acceptance_criteria>

<done_when>9 server actions committed, tsc clean.</done_when>
</task>

<task n="3" id="04-01-03" type="seed">
<read_first>
- d:/Thaodnp/XTTM/prisma/seed.ts
- d:/Thaodnp/XTTM/prisma/seed/organizations.ts (existing 7 orgs)
- d:/Thaodnp/XTTM/lib/date.ts
</read_first>

<action>
Create `prisma/seed/orgProfiles.ts`:
- Export `seedOrgProfiles(prisma)` async function
- For each of 5 main orgs (LEFASO, VITAS, VINATEX, VASEP, VCCI), create OrganizationProfile via prisma.organizationProfile.upsert
- Status assignments:
  - LEFASO: APPROVED (approvedAt = daysAgo(60), approvedById = user banql)
  - VITAS: SUBMITTED (submittedAt = daysAgo(5))
  - VINATEX: REJECTED (rejectionReason = "Hồ sơ năng lực chưa đầy đủ — vui lòng bổ sung danh sách 3 đề án XTTM gần nhất kèm kết quả định lượng.")
  - VASEP: DRAFT
  - VCCI: DRAFT
- Each profile có realistic legalInfo (taxCode realistic VN tax code format, address Vietnamese, representativeName + title)
- capabilities với mô tả 100+ chars + 2-3 pastProjects
- contacts với 2-3 đầu mối (chủ tịch, chủ nhiệm, điều phối)

Add `await seedOrgProfiles(prisma)` to prisma/seed.ts main entry.

Run `npm run db:seed` — verify counts: 5 OrganizationProfile rows, 5 different statuses (1 each except DRAFT=2).

Run `npx tsc --noEmit`.
Commit: `feat(04-01): seed 5 OrganizationProfile mock với mọi trạng thái`.
</action>

<acceptance_criteria>
- File exists: d:/Thaodnp/XTTM/prisma/seed/orgProfiles.ts
- prisma/seed.ts contains `seedOrgProfiles`
- DB query: prisma.organizationProfile.count() returns ≥5
- Status mix verified: APPROVED=1, SUBMITTED=1, REJECTED=1, DRAFT=2
- `npx tsc --noEmit` exit 0
</acceptance_criteria>

<done_when>Seed file created, db:seed run, 5 profiles in DB, committed.</done_when>
</task>

<verification>
After all tasks: run `npm run build` exit 0, `npx tsc --noEmit` exit 0. Update STATE.md (plan 1/2 complete in Phase 4), update ROADMAP.md, mark ORG-01..08 complete in REQUIREMENTS.md (server actions implement them).
</verification>
