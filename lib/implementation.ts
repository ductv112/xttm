// Implementation tracking shared types + parsers — Phase 8 Plan 08-01.
// Pure helpers (no Prisma) — used by both client components and server actions.

export type ImplementationMilestone = {
  id: string;
  title: string;
  startDate: string | null; // ISO
  endDate: string | null;
  owner: string;
  progress: number; // 0-100
  note: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
};

export type ImplementationStaff = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
};

export type ImplementationData = {
  milestones: ImplementationMilestone[];
  staff: ImplementationStaff[];
  schedule: {
    start: string | null;
    end: string | null;
    note: string;
  };
};

export function emptyImplementationData(): ImplementationData {
  return {
    milestones: [],
    staff: [],
    schedule: { start: null, end: null, note: '' },
  };
}

export function parseImplementationJson(
  raw: string | null | undefined,
): ImplementationData {
  if (!raw) return emptyImplementationData();
  try {
    const v = JSON.parse(raw);
    if (v && typeof v === 'object') {
      return {
        milestones: Array.isArray(v.milestones) ? v.milestones : [],
        staff: Array.isArray(v.staff) ? v.staff : [],
        schedule:
          v.schedule && typeof v.schedule === 'object'
            ? {
                start: v.schedule.start ?? null,
                end: v.schedule.end ?? null,
                note: v.schedule.note ?? '',
              }
            : { start: null, end: null, note: '' },
      };
    }
  } catch {
    // ignore
  }
  return emptyImplementationData();
}

export type ConsulateContactInput = {
  countryName: string;
  contactName: string;
  contactTitle: string;
  contactPhone: string;
  contactEmail: string;
  contactDate: string; // ISO
  note: string;
};

export function parseConsulateContactJson(
  raw: string | null | undefined,
): ConsulateContactInput | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ConsulateContactInput;
  } catch {
    return null;
  }
}
