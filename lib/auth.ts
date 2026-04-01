import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: string
  companyId: string | null
}

/**
 * Get the current authenticated user from Supabase session + public.users profile.
 * Returns null if not authenticated or user profile not found.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) return null

    const admin = createAdminClient()
    const { data: dbUser } = await admin
      .from('users')
      .select('id, email, name, role, company_id')
      .eq('id', user.id)
      .single()

    if (!dbUser) return null

    // ADMIN_EMAIL in .env always grants admin regardless of DB role
    if (process.env.ADMIN_EMAIL && dbUser.email === process.env.ADMIN_EMAIL) {
      dbUser.role = 'ADMIN'
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      companyId: dbUser.company_id,
    }
  } catch {
    return null
  }
}

/**
 * Use in API route handlers. Returns the user or a 401 NextResponse.
 */
export async function requireAuth(): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ message: 'Du måste vara inloggad' }, { status: 401 })
  }
  return user
}

/**
 * Use in API route handlers. Returns the user only if they have the ADMIN role,
 * otherwise returns a 403 NextResponse.
 */
export async function requireAdmin(): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ message: 'Du måste vara inloggad' }, { status: 401 })
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Åtkomst nekad' }, { status: 403 })
  }
  return user
}

export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse
}
