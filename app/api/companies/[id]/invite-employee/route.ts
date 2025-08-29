import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail, generateInvitationEmail } from '@/lib/email'
import crypto from 'crypto'

const inviteEmployeeSchema = z.object({
  name: z.string().min(1, 'Namn är obligatoriskt'),
  email: z.string().email('Ogiltig e-postadress'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id
    const body = await request.json()
    const { name, email } = inviteEmployeeSchema.parse(body)

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      return NextResponse.json(
        { message: 'Företag hittades inte' },
        { status: 404 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    // Generate unique invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex')
    const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    if (existingUser) {
      // If user exists, check if they're already part of this company
      if (existingUser.companyId === companyId) {
        return NextResponse.json(
          { message: 'Användaren är redan anställd i detta företag' },
          { status: 400 }
        )
      }

      // If user exists but is not part of this company, add them to the company
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          companyId: companyId,
          role: 'EMPLOYEE',
        },
      })

      // Create invitation record
      await prisma.invitation.create({
        data: {
          email: updatedUser.email,
          token: invitationToken,
          companyId: companyId,
          expiresAt: invitationExpiresAt,
          isExistingUser: true,
        },
      })

      // Send invitation email to existing user
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/signin`
      const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/${invitationToken}`
      
      const emailData = generateInvitationEmail(
        updatedUser.name || 'Användare',
        updatedUser.email,
        company.name,
        'Ditt befintliga lösenord', // They use their existing password
        loginUrl,
        invitationUrl,
        true // isExistingUser = true
      )

      const emailSent = await sendEmail(emailData)

      if (!emailSent) {
        console.error('Failed to send invitation email to existing user:', updatedUser.email)
      }

      return NextResponse.json(
        {
          message: 'Befintlig användare har lagts till i företaget',
          employee: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            personalNumber: updatedUser.personalNumber,
            role: updatedUser.role,
            bankIdVerified: updatedUser.bankIdVerified,
            id06Eligible: updatedUser.id06Eligible,
          },
          emailSent,
          existingUser: true,
          invitationToken,
          invitationUrl,
          nextSteps: [
            'Befintlig användare har lagts till i företaget',
            'Användaren kan logga in med sina befintliga uppgifter',
            'Alternativt kan användaren använda inbjudningslänken',
            'Användaren måste verifiera sin identitet med BankID om inte redan gjort',
            'Efter BankID-verifiering kan anställd ta kurser och få ID06-certifikat'
          ]
        },
        { status: 200 }
      )
    }

    // For new users, we don't create the account here
    // They will create it during the signup process with the invitation token
    // We only store the invitation information

    // Create invitation record for new user
    await prisma.invitation.create({
      data: {
        email: email,
        token: invitationToken,
        companyId: companyId,
        expiresAt: invitationExpiresAt,
        isExistingUser: false,
        // Store the name in the invitation for later use
        name: name,
      },
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
          'Användaren kan skapa sitt konto via inbjudningslänken',
          'Alternativt kan användaren använda inbjudningslänken direkt',
          'Efter konto skapas måste användaren verifiera sin identitet med BankID',
          'Efter BankID-verifiering kan anställd ta kurser och få ID06-certifikat'
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
