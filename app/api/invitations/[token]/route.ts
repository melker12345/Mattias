import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
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

    if (!invitation) {
      return NextResponse.json(
        { message: 'Inbjudningslänk hittades inte' },
        { status: 404 }
      )
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { message: 'Inbjudningslänk har gått ut' },
        { status: 410 }
      )
    }

    if (invitation.used) {
      return NextResponse.json(
        { message: 'Inbjudningslänk har redan använts' },
        { status: 410 }
      )
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        companyId: invitation.company_id,
        companyName: (invitation.company as any)?.name,
        isExistingUser: invitation.is_existing_user,
        temporaryPassword: invitation.temporary_password,
        expiresAt: invitation.expires_at,
        hasPersonnummer: !!invitation.personnummer_encrypted,
        phone: invitation.phone ?? null,
      },
    })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av inbjudningen' },
      { status: 500 }
    )
  }
}
