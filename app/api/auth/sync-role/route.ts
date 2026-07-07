import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Called after sign-in to keep the Supabase auth metadata (role + companyId) in
 * sync with the public.users profile, which is the source of truth. The client
 * reads role/companyId from user_metadata (e.g. the company dashboard), so this
 * ensures those are correct after login. ADMIN_EMAIL always resolves to ADMIN.
 * Safe to call repeatedly.
 */
export async function POST() {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ synced: false }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Profile is the source of truth for role + company association.
    const { data: profile } = await adminClient
      .from('users')
      .select('role, company_id, name')
      .eq('id', user.id)
      .maybeSingle()

    const isAdminEmail = !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL
    const role = isAdminEmail ? 'ADMIN' : (profile?.role ?? user.user_metadata?.role ?? 'INDIVIDUAL')
    const companyId = profile?.company_id ?? null

    // Keep auth metadata aligned so the client picks up role + companyId.
    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, role, companyId },
    })

    // Ensure the ADMIN_EMAIL user always has a profile row.
    if (isAdminEmail) {
      await adminClient
        .from('users')
        .upsert(
          { id: user.id, email: user.email!, name: user.user_metadata?.name ?? profile?.name ?? null, role: 'ADMIN' },
          { onConflict: 'id' }
        )
    }

    return NextResponse.json({ synced: true, role, companyId })
  } catch (err) {
    console.error('[sync-role]', err)
    return NextResponse.json({ synced: false, error: 'Internal error' }, { status: 500 })
  }
}
