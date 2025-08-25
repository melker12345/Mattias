import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
}).refine((data) => data.password === data.confirmPassword, {
  message: "Lösenorden matchar inte",
  path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationNumber, name, contactPerson, email, phone, address, password } = companyRegistrationSchema.parse(body)

    // Check if company already exists
    const existingCompany = await prisma.company.findUnique({
      where: { organizationNumber },
    })

    if (existingCompany) {
      return NextResponse.json(
        { message: 'Ett företag med detta organisationsnummer finns redan registrerat' },
        { status: 400 }
      )
    }

    // Check if email is already used
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'E-postadressen används redan av en annan användare' },
        { status: 400 }
      )
    }

    // Create company
    const company = await prisma.company.create({
      data: {
        organizationNumber,
        name,
        contactPerson,
        email,
        phone,
        address,
        verified: false, // Will be verified manually or through business registration check
      },
    })

    // Create company admin user
    const hashedPassword = await import('bcryptjs').then(bcrypt => 
      bcrypt.hash(password, 12)
    )

    const companyAdmin = await prisma.user.create({
      data: {
        email,
        name: contactPerson,
        password: hashedPassword,
        role: 'COMPANY_ADMIN',
        companyId: company.id,
        bankIdVerified: false, // Company admins don't need BankID initially
      },
    })

    return NextResponse.json(
      { 
        message: 'Företag registrerat framgångsrikt! Du kan nu logga in med din e-postadress och lösenord.',
        company: {
          id: company.id,
          name: company.name,
          organizationNumber: company.organizationNumber,
          contactPerson: company.contactPerson,
          email: company.email,
          verified: company.verified,
        },
        adminUser: {
          id: companyAdmin.id,
          email: companyAdmin.email,
          name: companyAdmin.name,
          role: companyAdmin.role,
        }
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
