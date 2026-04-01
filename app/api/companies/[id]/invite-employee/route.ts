import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { sendEmail, generateInvitationEmail } from '@/lib/email'
import crypto from 'crypto'
import { encryptPersonnummer, normalisePersonnummer } from '@/lib/encryption'

const inviteEmployeeSchema = z.object({
  name: z.string().min(1, 'Namn är obligatoriskt'),
  email: z.string().email('Ogiltig e-postadress'),
  personnummer: z.string().min(10, 'Ogiltigt personnummer'),
  phone: z.string().min(8, 'Ogiltigt telefonnummer'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id
    const body = await request.json()
    const { name, email, personnummer, phone } = inviteEmployeeSchema.parse(body)

    const personnummerEncrypted = encryptPersonnummer(normalisePersonnummer(personnummer))

    const admin = createAdminClient()

    const { data: company } = await admin.from('companies').select('id, name').eq('id', companyId).single()
    if (!company) {
      return NextResponse.json({ message: 'Företag hittades inte' }, { status: 404 })
    }

    const { data: existingUser } = await admin.from('users').select('id, email, name, company_id, role, id06_eligible').eq('email', email).maybeSingle()

    // Generate unique invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex')
    const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    if (existingUser) {
      if (existingUser.company_id === companyId) {
        return NextResponse.json({ message: 'Användaren är redan anställd i detta företag' }, { status: 400 })
      }

      await admin.from('users').update({ company_id: companyId, role: 'EMPLOYEE' }).eq('id', existingUser.id)

      await admin.from('invitations').insert({
        email: existingUser.email,
        token: invitationToken,
        company_id: companyId,
        expires_at: invitationExpiresAt.toISOString(),
        is_existing_user: true,
        phone,
        personnummer_encrypted: personnummerEncrypted,
      })

      // Send invitation email to existing user
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/signin`
      const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/${invitationToken}`
      
      const emailData = generateInvitationEmail(
        existingUser.name || 'Användare',
        existingUser.email,
        company.name,
        'Ditt befintliga lösenord', // They use their existing password
        loginUrl,
        invitationUrl,
        true // isExistingUser = true
      )

      const emailSent = await sendEmail(emailData)

      if (!emailSent) {
        console.error('Failed to send invitation email to existing user:', existingUser.email)
      }

      return NextResponse.json(
        {
          message: 'Befintlig användare har lagts till i företaget',
          employee: {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            role: 'EMPLOYEE',
            id06Eligible: existingUser.id06_eligible,
          },
          emailSent,
          existingUser: true,
          invitationToken,
          invitationUrl,
          nextSteps: [
            'Befintlig användare har lagts till i företaget',
            'Användaren kan logga in med sina befintliga uppgifter',
            'Alternativt kan användaren använda inbjudningslänken'
          ]
        },
        { status: 200 }
      )
    }

    // For new users, we don't create the account here
    // They will create it during the signup process with the invitation token
    // We only store the invitation information

    await admin.from('invitations').insert({
      email,
      name,
      phone,
      personnummer_encrypted: personnummerEncrypted,
      token: invitationToken,
      company_id: companyId,
      expires_at: invitationExpiresAt.toISOString(),
      is_existing_user: false,
    })

    // Send invitation email
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/signin`
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/${invitationToken}`
    
    const emailData = generateInvitationEmail(
      name,
      email,
      company.name,
      undefined, // No temporary password for new users
      loginUrl,
      invitationUrl,
      false // isExistingUser = false
    )

    const emailSent = await sendEmail(emailData)

    if (!emailSent) {
      console.error('Failed to send invitation email:', email)
    }

    return NextResponse.json(
      {
        message: 'Anställd inbjuden framgångsrikt!',
        invitation: {
          email: email,
          name: name,
        },
        emailSent,
        existingUser: false,
        invitationToken,
        invitationUrl,
        nextSteps: [
          'Inbjudan har skickats till användaren',
          'E-post har skickats med inbjudningslänk',
          'Användaren skapar sitt konto via inbjudningslänken och verifierar med personnummer och telefon',
          'När identiteten är bekräftad kan anställd ta kurser och få ID06-certifikat'
        ]
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error inviting employee:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Ogiltig data', errors: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { message: 'Ett fel uppstod vid inbjudan av anställd' },
      { status: 500 }
    )
  }
}
