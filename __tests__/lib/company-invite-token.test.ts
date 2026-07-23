import { createCompanyInviteToken, verifyCompanyInviteToken } from '@/lib/company-invite-token';

// Ensure a signing secret exists regardless of the test environment.
process.env.COMPANY_INVITE_SECRET = process.env.COMPANY_INVITE_SECRET || 'test-secret-for-company-invite-tokens';

describe('company invite token', () => {
  const companyId = '661ba142-c677-497d-b20a-040305fb3006';

  it('round-trips a valid token', () => {
    const token = createCompanyInviteToken(companyId);
    expect(verifyCompanyInviteToken(token)).toEqual({ companyId });
  });

  it('rejects a tampered payload', () => {
    const token = createCompanyInviteToken(companyId);
    const [, sig] = token.split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ cid: 'attacker', exp: Date.now() + 100000 })).toString('base64url');
    expect(verifyCompanyInviteToken(`${forgedPayload}.${sig}`)).toBeNull();
  });

  it('rejects an expired token', () => {
    const token = createCompanyInviteToken(companyId, -1000); // already expired
    expect(verifyCompanyInviteToken(token)).toBeNull();
  });

  it('rejects malformed input', () => {
    expect(verifyCompanyInviteToken('')).toBeNull();
    expect(verifyCompanyInviteToken('nope')).toBeNull();
    expect(verifyCompanyInviteToken(undefined)).toBeNull();
    expect(verifyCompanyInviteToken('a.b.c')).toBeNull();
  });
});
