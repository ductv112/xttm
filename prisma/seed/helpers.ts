import bcrypt from 'bcryptjs';

export const BCRYPT_COST = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export function logSeedStep(name: string, count: number) {
  console.log(`✓ Seeded ${name}: ${count}`);
}
