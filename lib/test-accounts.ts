/**
 * Paywall-exempt test accounts — one per account type — for testing features
 * behind the payment wall without going through Fortnox/checkout.
 *
 * Configured via env (no emails are hard-coded in the bundle):
 *   ADMIN_EMAIL          - platform admin (also grants the ADMIN role elsewhere)
 *   TEST_EMPLOYEE_EMAIL  - individual / employee test account
 *   TEST_COMPANY_EMAIL   - company-admin test account
 *
 * An exempt user gets complimentary course access, and a company whose
 * COMPANY_ADMIN is exempt is treated as having a valid subscription. This is a
 * testing convenience only — it never grants any elevated role or data access,
 * it only skips payment. Leave the env vars unset in production to disable.
 */
export function paywallExemptEmails(): string[] {
  return [
    process.env.ADMIN_EMAIL,
    process.env.TEST_EMPLOYEE_EMAIL,
    process.env.TEST_COMPANY_EMAIL,
  ]
    .filter((e): e is string => !!e && e.trim().length > 0)
    .map((e) => e.trim().toLowerCase());
}

/** True if the given email is a configured paywall-exempt test account. */
export function isPaywallExempt(email: string | null | undefined): boolean {
  if (!email) return false;
  return paywallExemptEmails().includes(email.toLowerCase());
}

/**
 * Whether an exempt test account currently has its bypass enabled (admin can
 * toggle this per account in the Users tab). Fail-open: if the
 * `paywall_bypass_active` column doesn't exist yet (migration not run) or the
 * lookup fails, returns true so existing test accounts keep working.
 * Call only after isPaywallExempt(email) is true to avoid an extra query for
 * normal users.
 */
export async function isBypassActiveForUser(
  admin: { from: (t: string) => any },
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await admin
      .from('users')
      .select('paywall_bypass_active')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return true;
    return data.paywall_bypass_active !== false;
  } catch {
    return true;
  }
}
