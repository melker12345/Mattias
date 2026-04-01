import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token

    const admin = createAdminClient()
    const { data: invitation } = await admin
      .from('invitations')
      .select('*, company:companies(id, name)')
      .eq('token', token)
      .single()

    if (!invitation) return NextResponse.json({ message: 'Inbjudningslänk hittades inte' }, { status: 404 })
    if (new Date(invitation.expires_at) < new Date()) return NextResponse.json({ message: 'Inbjudningslänk har gått ut' }, { status: 410 })
    if (invitation.used) return NextResponse.json({ message: 'Inbjudningslänk har redan använts' }, { status: 410 })

    await admin.from('invitations').update({ used: true, used_at: new Date().toISOString() }).eq('id', invitation.id)

    if (invitation.is_existing_user) {
      const { data: existingUser } = await admin.from('users').select('id').eq('email', invitation.email).maybeSingle()
      if (existingUser) {
        await admin.from('users').update({ company_id: invitation.company_id, role: 'EMPLOYEE' }).eq('id', existingUser.id)
      }
    }

    const company = invitation.company as { id: string; name: string }
    return NextResponse.json({
      message: 'Inbjudning accepterad framgångsrikt',
      invitation: { email: invitation.email, companyName: company?.name, isExistingUser: invitation.is_existing_user },
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { message: 'Ett fel uppstod vid acceptering av inbjudningen' },
      { status: 500 }
    )
  }
}
