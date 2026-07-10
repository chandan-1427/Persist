import argon2 from "argon2";

// OWASP-recommended minimums for argon2id
const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, HASH_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    // Malformed hash or internal error — treat as failed verification, never throw to caller
    return false;
  }
}

// Precomputed hash of a random string, used to defeat timing attacks on signin
// (see routes/auth.ts) — keeps verify() cost constant whether or not the user exists.
export const DUMMY_PASSWORD_HASH = await hashPassword(crypto.randomUUID());