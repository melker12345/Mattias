import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; employeeId: string } }
) {
  try {
    const companyId = params.id
    const employeeId = params.employeeId

    const admin = createAdminClient()

    const { data: company } = await admin.from('companies').select('id').eq('id', companyId).maybeSingle()
    if (!company) return NextResponse.json({ message: 'Företag hittades inte' }, { status: 404 })

    const { data: employee } = await admin.from('users').select('id, name, email')
      .eq('id', employeeId).eq('company_id', companyId).eq('role', 'EMPLOYEE').maybeSingle()
    if (!employee) return NextResponse.json({ message: 'Anställd hittades inte eller tillhör inte detta företag' }, { status: 404 })

    await admin.from('users').update({ company_id: null, role: 'INDIVIDUAL' }).eq('id', employeeId)

    return NextResponse.json(
      { message: 'Anställd har tagits bort från företaget', employee: { id: employee.id, name: employee.name, email: employee.email } },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error removing employee:', error)
    return NextResponse.json(
      { message: 'Ett fel uppstod vid borttagning av anställd' },
      { status: 500 }
    )
  }
}
