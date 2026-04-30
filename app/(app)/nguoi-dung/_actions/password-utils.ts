// Password generation utilities — pure functions, no DB / auth dependencies.
// Kept separate from `'use server'` files because Next.js 15 forbids non-async
// exports from server action modules; this module is server-only via callers
// but safe to mark as plain TS (we never import it from client components).

const TEMP_LENGTH = 12;

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
// Excluded ambiguous characters (' " ` \ /) from symbol pool to ease manual entry
const SYMBOLS = '!@#$%^&*';
const ALL = LOWER + UPPER + DIGITS + SYMBOLS;

function pick(charset: string): string {
  const idx = Math.floor(Math.random() * charset.length);
  return charset[idx]!;
}

/**
 * Generate a 12-char temp password with at least 1 lowercase, 1 uppercase,
 * 1 digit, 1 symbol, padded with random chars from full pool then shuffled.
 *
 * Note: Math.random is OK for POC mock auth — production should use crypto.randomBytes.
 */
export function generateTempPassword(): string {
  const required = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)];
  const filler: string[] = [];
  for (let i = 0; i < TEMP_LENGTH - required.length; i++) {
    filler.push(pick(ALL));
  }
  const all = [...required, ...filler];
  // Fisher-Yates shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j]!, all[i]!];
  }
  return all.join('');
}
