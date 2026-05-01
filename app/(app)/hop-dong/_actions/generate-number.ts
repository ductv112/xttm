'use server';

// generateContractNumber — Phase 8 Plan 08-01 Task 2.
// Atomic counter from existing Contract.contractNo for given year.
// Format: XTTM/YYYY/NNN
// Race-safe: uses unique constraint on Contract.contractNo. Caller retry if collision.

import { prisma } from '@/lib/prisma';
import { formatContractNumber } from '@/lib/amendment-rules';

/**
 * Compute next contract number for a year. Reads max sequence from existing
 * Contract.contractNo where prefix matches XTTM/{year}/, increments by 1.
 *
 * NOTE: Caller must wrap creation in try/catch; if unique constraint trips
 * (rare race), retry by calling this function again.
 */
export async function generateContractNumber(year: number): Promise<string> {
  const prefix = `XTTM/${year}/`;
  const existing = await prisma.contract.findMany({
    where: { contractNo: { startsWith: prefix } },
    select: { contractNo: true },
  });

  let maxSeq = 0;
  for (const c of existing) {
    const tail = c.contractNo.slice(prefix.length);
    const n = Number.parseInt(tail, 10);
    if (Number.isFinite(n) && n > maxSeq) {
      maxSeq = n;
    }
  }

  return formatContractNumber(year, maxSeq + 1);
}
