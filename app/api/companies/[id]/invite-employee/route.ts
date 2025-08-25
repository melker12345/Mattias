import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail, generateInvitationEmail } from '@/lib/email'
import crypto from 'crypto'

const inviteEmployeeSchema = z.object({
  name: z.string().min(1, 'Namn är obligatoriskt'),
  email: z.string().email('Ogiltig e-postadress'),
  personalNumber: z.string().min(10, 'Personnummer måste vara minst 10 tecken'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id
    const body = await request.json()
    const { name, email, personalNumber } = inviteEmployeeSchema.parse(body)

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
          // Keep existing personal number if it matches, otherwise update
          personalNumber: existingUser.personalNumber === personalNumber
            ? existingUser.personalNumber
            : personalNumber,
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
        updatedUser.name,
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

    // Generate temporary password for new user
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

    // Create new user
    const employee = await prisma.user.create({
      data: {
        name,
        email,
        personalNumber,
        password: tempPassword, // In production, this should be hashed
        role: 'EMPLOYEE',
        companyId: companyId,
        bankIdVerified: false,
        id06Eligible: false,
      },
    })

    // Create invitation record
    await prisma.invitation.create({
      data: {
        email: employee.email,
        token: invitationToken,
        companyId: companyId,
        expiresAt: invitationExpiresAt,
        isExistingUser: false,
        temporaryPassword: tempPassword,
      },
    })

    // Send invitation email
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/signin`
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/${invitationToken}`
    
    const emailData = generateInvitationEmail(
      employee.name,
      employee.email,
      company.name,
      tempPassword,
      loginUrl,
      invitationUrl,
      false // isExistingUser = false
    )

    const emailSent = await sendEmail(emailData)

    if (!emailSent) {
      console.error('Failed to send invitation email:', employee.email)
    }

    return NextResponse.json(
      {
        message: 'Anställd inbjuden framgångsrikt!',
        employee: {
          id: employee.id,
          email: employee.email,
          name: employee.name,
          personalNumber: employee.personalNumber,
          role: employee.role,
          bankIdVerified: employee.bankIdVerified,
          id06Eligible: employee.id06Eligible,
        },
        emailSent,
        existingUser: false,
        invitationToken,
        invitationUrl,
        nextSteps: [
          'Anställd har skapats och inbjudits',
          'E-post har skickats med inloggningsuppgifter',
          'Alternativt kan användaren använda inbjudningslänken',
          'Användaren måste verifiera sin identitet med BankID',
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
