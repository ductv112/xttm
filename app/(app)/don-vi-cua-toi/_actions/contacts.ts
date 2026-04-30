'use server';

// contacts.ts — addContact / updateContact / deleteContact (CRUD inline trên contactsJson array).
// Each operation parses existing JSON, applies mutation, validates with contactInternal schema,
// writes back. Status guard: chỉ DRAFT/REJECTED cho phép edit (SUBMITTED frozen).
// Cross-tenant guard via session.organizationId.

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAuditLog } from '@/lib/audit';
import { parseContacts, type OrgProfileContact } from '@/lib/workflows/orgProfile';

import { contactInternal } from './types';

// Add contact — id auto-generated server-side
const addContactInputSchema = contactInternal.omit({ id: true });
export type AddContactInput = z.infer<typeof addContactInputSchema>;

const updateContactInputSchema = contactInternal;
export type UpdateContactInput = z.infer<typeof updateContactInputSchema>;

export type ContactsActionResult = {
  contacts: OrgProfileContact[];
};

async function loadProfileForCaller() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập');
  }
  const orgId = session.user.organizationId;
  if (!orgId) {
    throw new Error('Tài khoản của bạn chưa được gán đơn vị');
  }
  const profile = await prisma.organizationProfile.findUnique({
    where: { organizationId: orgId },
  });
  if (!profile) {
    throw new Error('Hồ sơ chưa được khởi tạo — vui lòng tải lại trang');
  }
  if (profile.status === 'SUBMITTED') {
    throw new Error('Hồ sơ đang chờ phê duyệt — không thể chỉnh sửa đầu mối');
  }
  return profile;
}

// =============================================================================
// addContact
// =============================================================================

async function addContactImpl(
  input: AddContactInput,
): Promise<ContactsActionResult> {
  const profile = await loadProfileForCaller();

  const parsed = addContactInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? 'Dữ liệu đầu mối không hợp lệ',
    );
  }

  const existing = parseContacts(profile.contactsJson);
  if (existing.length >= 20) {
    throw new Error('Tối đa 20 đầu mối liên hệ trong hồ sơ');
  }

  const newContact: OrgProfileContact = {
    id: randomUUID(),
    name: parsed.data.name,
    title: parsed.data.title ?? '',
    role: parsed.data.role,
    email: parsed.data.email,
    phone: parsed.data.phone,
  };

  const next = [...existing, newContact];
  await prisma.organizationProfile.update({
    where: { id: profile.id },
    data: { contactsJson: JSON.stringify(next) },
  });

  revalidatePath('/don-vi-cua-toi');
  return { contacts: next };
}

export const addContact = withAuditLog<[AddContactInput], ContactsActionResult>(
  {
    action: 'UPDATE',
    resource: 'don-vi-chu-tri',
    captureAfter: (r) => ({ contactCount: r.contacts.length }),
  },
  addContactImpl,
);

// =============================================================================
// updateContact
// =============================================================================

async function updateContactImpl(
  input: UpdateContactInput,
): Promise<ContactsActionResult> {
  const profile = await loadProfileForCaller();

  const parsed = updateContactInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? 'Dữ liệu đầu mối không hợp lệ',
    );
  }

  const existing = parseContacts(profile.contactsJson);
  const idx = existing.findIndex((c) => c.id === parsed.data.id);
  if (idx === -1) {
    throw new Error('Không tìm thấy đầu mối liên hệ để cập nhật');
  }

  const next = [...existing];
  next[idx] = {
    id: parsed.data.id,
    name: parsed.data.name,
    title: parsed.data.title ?? '',
    role: parsed.data.role,
    email: parsed.data.email,
    phone: parsed.data.phone,
  };

  await prisma.organizationProfile.update({
    where: { id: profile.id },
    data: { contactsJson: JSON.stringify(next) },
  });

  revalidatePath('/don-vi-cua-toi');
  return { contacts: next };
}

export const updateContact = withAuditLog<
  [UpdateContactInput],
  ContactsActionResult
>(
  {
    action: 'UPDATE',
    resource: 'don-vi-chu-tri',
    resourceIdFromArgs: ([input]) => input?.id ?? null,
    captureAfter: (r) => ({ contactCount: r.contacts.length }),
  },
  updateContactImpl,
);

// =============================================================================
// deleteContact
// =============================================================================

const deleteContactIdSchema = z
  .string()
  .min(1, 'Mã đầu mối không hợp lệ')
  .max(64, 'Mã đầu mối không hợp lệ');

async function deleteContactImpl(
  contactId: string,
): Promise<ContactsActionResult> {
  const profile = await loadProfileForCaller();

  const idParse = deleteContactIdSchema.safeParse(contactId);
  if (!idParse.success) {
    throw new Error(idParse.error.issues[0]?.message ?? 'Mã đầu mối không hợp lệ');
  }

  const existing = parseContacts(profile.contactsJson);
  const next = existing.filter((c) => c.id !== idParse.data);
  if (next.length === existing.length) {
    throw new Error('Không tìm thấy đầu mối liên hệ để xóa');
  }

  await prisma.organizationProfile.update({
    where: { id: profile.id },
    data: { contactsJson: JSON.stringify(next) },
  });

  revalidatePath('/don-vi-cua-toi');
  return { contacts: next };
}

export const deleteContact = withAuditLog<[string], ContactsActionResult>(
  {
    action: 'DELETE',
    resource: 'don-vi-chu-tri',
    resourceIdFromArgs: ([id]) => id,
    captureAfter: (r) => ({ contactCount: r.contacts.length }),
  },
  deleteContactImpl,
);
