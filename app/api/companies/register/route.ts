import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const companyRegistrationSchema = z.object({
  organizationNumber: z.string().regex(/^\d{6}-\d{4}$/, 'Organisationsnummer måste vara i formatet XXXXXX-XXXX'),
  name: z.string().min(2, 'Företagsnamn måste vara minst 2 tecken'),
  contactPerson: z.string().min(2, 'Kontaktperson måste vara minst 2 tecken'),
  email: z.string().email('Ogiltig e-postadress'),
  phone: z.string().min(6, 'Telefonnummer måste vara minst 6 tecken'),
  address: z.string().min(5, 'Adress måste vara minst 5 tecken'),
  password: z.string().min(8, 'Lösenord måste vara minst 8 tecken'),
  confirmPassword: z.string().min(8, 'Bekräfta lösenord måste vara minst 8 tecken'),
  plan: z.string().optional(),
  paymentStatus: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Lösenorden matchar inte",
  path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationNumber, name, contactPerson, email, phone, address, password, plan, paymentStatus } = companyRegistrationSchema.parse(body)

    const admin = createAdminClient()

    // Check if company already exists
    const { data: existingCompany } = await admin
      .from('companies')
      .select('id')
      .eq('organization_number', organizationNumber)
      .maybeSingle()

    if (existingCompany) {
      return NextResponse.json(
        { message: 'Ett företag med detta organisationsnummer finns redan registrerat' },
        { status: 400 }
      )
    }

    const COMPANY_PRICE = 1500

    // Create company
    const { data: company, error: companyError } = await admin
      .from('companies')
      .insert({
        organization_number: organizationNumber,
        name,
        contact_person: contactPerson,
        email,
        phone,
        address,
        verified: false,
        plan: plan ?? 'STANDARD',
        plan_price: COMPANY_PRICE,
        plan_start_date: new Date().toISOString(),
        plan_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        payment_status: paymentStatus ?? 'PENDING',
      })
      .select()
      .single()

    if (companyError || !company) {
      console.error('Company create error:', companyError)
      return NextResponse.json({ message: 'Kunde inte skapa företag' }, { status: 500 })
    }

    // Create invoice
    await admin.from('invoices').insert({
      company_id: company.id,
      invoice_number: `INV-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      amount: COMPANY_PRICE,
      currency: 'SEK',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING',
    })

    // Create Supabase Auth user (handles password hashing)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: contactPerson, role: 'COMPANY_ADMIN' },
      email_confirm: true,
    })

    if (authError || !authData.user) {
      // Rollback company
      await admin.from('companies').delete().eq('id', company.id)
      return NextResponse.json(
        { message: authError?.message?.includes('already registered')
            ? 'E-postadressen används redan'
            : 'Kunde inte skapa användarkonto' },
        { status: 400 }
      )
    }

    // Create public.users profile
    await admin.from('users').insert({
      id: authData.user.id,
      email,
      name: contactPerson,
      role: 'COMPANY_ADMIN',
      company_id: company.id,
    })

    return NextResponse.json(
      {
        message: 'Företag registrerat framgångsrikt! Du kan nu logga in med din e-postadress och lösenord.',
        company: { id: company.id, name: company.name, organizationNumber, contactPerson, email, verified: false },
        adminUser: { id: authData.user.id, email, name: contactPerson, role: 'COMPANY_ADMIN' },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Ogiltig data', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Company registration error:', error)
    return NextResponse.json(
      { message: 'Ett fel uppstod vid registrering av företag' },
      { status: 500 }
    )
  }
}
