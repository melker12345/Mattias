/**
 * Temporary demo / staging: bypass payment walls (Fortnox, subscription checks, checkout).
 *
 * Set in `.env.local`:
 *   NEXT_PUBLIC_DISABLE_PAYMENTS=true
 *
 * Optional (server-only, e.g. scripts): DISABLE_PAYMENTS=true
 *
 * Client components need `NEXT_PUBLIC_` — rebuild after changing.
 */
export function isPaymentsDisabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_DISABLE_PAYMENTS === 'true' ||
    process.env.DISABLE_PAYMENTS === 'true'
  )
}
