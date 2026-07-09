import crypto from 'crypto';

// Stateless, signed company invite tokens.
//
// A company admin can share one "join link" without us persisting a token per
// share: the token itself carries the company id plus an expiry, signed with an
// HMAC so it cannot be forged. This keeps the feature migration-free.
//
// Format:  base64url(JSON({ cid, exp })) + "." + base64url(HMAC_SHA256(payload))

function secret(): string {
  const s =
    process.env.COMPANY_INVITE_SECRET ||
    process.env.PERSONNUMMER_ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error('No secret available for signing company invite tokens');
  return s;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function sign(payloadB64: string): string {
  return crypto.createHmac('sha256', secret()).update(payloadB64).digest('base64url');
}

/** Default validity for a shared join link. */
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export function createCompanyInviteToken(companyId: string, ttlMs: number = DEFAULT_TTL_MS): string {
  const payload = { cid: companyId, exp: Date.now() + ttlMs };
  const payloadB64 = b64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export interface VerifiedInvite {
  companyId: string;
}

/**
 * Verify a token's signature and expiry. Returns the company id, or null if the
 * token is malformed, tampered with, or expired.
 */
export function verifyCompanyInviteToken(token: string | undefined | null): VerifiedInvite | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payloadB64, providedSig] = token.split('.');
  if (!payloadB64 || !providedSig) return null;

  const expectedSig = sign(payloadB64);
  // Constant-time compare to avoid signature timing leaks.
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload?.cid || typeof payload.exp !== 'number') return null;
    if (Date.now() > payload.exp) return null;
    return { companyId: payload.cid };
  } catch {
    return null;
  }
}
