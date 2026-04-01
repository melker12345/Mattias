import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; employeeId: string } }
) {
  try {
    const companyId = params.id
    const employeeId = params.employeeId

    const admin = createAdminClient()

    const { data: company } = await admin.from('companies').select('id').eq('id', companyId).maybeSingle()
    if (!company) return NextResponse.json({ message: 'Företag hittades inte' }, { status: 404 })

    const { data: employee } = await admin.from('users').select('id, email, name, identity_verified')
      .eq('id', employeeId).eq('company_id', companyId).eq('role', 'EMPLOYEE').maybeSingle()
    if (!employee) return NextResponse.json({ message: 'Anställd hittades inte' }, { status: 404 })

    if (employee.identity_verified) {
      return NextResponse.json({ message: 'Anställd är redan verifierad' }, { status: 400 })
    }

    const { data: invitation } = await admin.from('invitations').select('id, email, expires_at, is_existing_user, token')
      .eq('email', employee.email).eq('company_id', companyId).eq('used', false)
      .gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(1).maybeSingle()

    if (!invitation) return NextResponse.json({ message: 'Ingen aktiv inbjudning hittades' }, { status: 404 })

    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/${invitation.token}`
    return NextResponse.json({
      invitationUrl,
      invitation: { id: invitation.id, email: invitation.email, expiresAt: invitation.expires_at, isExistingUser: invitation.is_existing_user },
    })
  } catch (error) {
    console.error('Error fetching invitation link:', error)
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av inbjudningslänk' },
      { status: 500 }
    )
  }
}
