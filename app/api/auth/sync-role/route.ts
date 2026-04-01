import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Called after sign-in to ensure ADMIN_EMAIL user has role='ADMIN'
 * in both the Prisma DB and Supabase auth metadata.
 * Safe to call repeatedly — only acts if email matches ADMIN_EMAIL.
 */
export async function POST() {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ synced: false }, { status: 401 })
    }

    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json({ synced: false, reason: 'not admin email' })
    }

    // Update Supabase auth metadata so middleware JWT check works
    const adminClient = createAdminClient()
    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, role: 'ADMIN' },
    })

    // Upsert profile row so the user always exists in public.users
    await adminClient
      .from('users')
      .upsert(
        { id: user.id, email: user.email!, name: user.user_metadata?.name ?? null, role: 'ADMIN' },
        { onConflict: 'id' }
      )

    return NextResponse.json({ synced: true })
  } catch (err) {
    console.error('[sync-role]', err)
    return NextResponse.json({ synced: false, error: 'Internal error' }, { status: 500 })
  }
}
