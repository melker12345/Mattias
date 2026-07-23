import { NextRequest, NextResponse } from 'next/server'
import { requireCompanyAccess, isNextResponse } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptPersonnummer, normalisePersonnummer, isValidPersonnummer } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

// PUT — the company fills in / corrects an employee's identity. Because the
// company vouches for the details (moving verification off BankID), this also
// marks the employee as identity_verified. The company can overwrite even the
// otherwise-locked name/personnummer, since those changes are exactly what the
// user must route through their company or an admin.
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; employeeId: string } }
) {
  try {
    const companyId = params.id
    const access = await requireCompanyAccess(companyId)
    if (isNextResponse(access)) return access
    const employeeId = params.employeeId

    const body = await request.json()
    const { name, personnummer, phone } = body as { name?: string; personnummer?: string; phone?: string }

    const admin = createAdminClient()

    const { data: employee } = await admin.from('users').select('id')
      .eq('id', employeeId).eq('company_id', companyId).eq('role', 'EMPLOYEE').maybeSingle()
    if (!employee) return NextResponse.json({ message: 'Anställd hittades inte eller tillhör inte detta företag' }, { status: 404 })

    const update: Record<string, unknown> = {}
    if (name !== undefined) update.name = name?.trim() || null
    if (phone !== undefined) update.phone = phone?.trim() || null
    if (personnummer !== undefined && personnummer.trim()) {
      if (!isValidPersonnummer(personnummer)) {
        return NextResponse.json({ message: 'Ogiltigt personnummer' }, { status: 400 })
      }
      update.personnummer_encrypted = encryptPersonnummer(normalisePersonnummer(personnummer))
    }

    // Company vouches for these details.
    if (update.name && update.personnummer_encrypted) update.identity_verified = true

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ message: 'Inga ändringar' }, { status: 400 })
    }

    const { error } = await admin.from('users').update(update).eq('id', employeeId)
    if (error) {
      console.error('Employee identity update error:', error)
      return NextResponse.json({ message: 'Kunde inte spara uppgifterna' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Uppgifterna sparades' })
  } catch (error) {
    console.error('Error updating employee identity:', error)
    return NextResponse.json({ message: 'Ett fel uppstod' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; employeeId: string } }
) {
  try {
    const companyId = params.id
    const access = await requireCompanyAccess(companyId)
    if (isNextResponse(access)) return access
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
