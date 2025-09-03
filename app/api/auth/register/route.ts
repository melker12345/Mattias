import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Namnet måste vara minst 2 tecken'),
  email: z.string().email('Ogiltig e-postadress'),
  password: z.string().min(6, 'Lösenordet måste vara minst 6 tecken'),
  invitationToken: z.string().nullable().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, invitationToken } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'En användare med denna e-postadress finns redan' },
        { status: 400 }
      )
    }

    // If invitation token is provided, validate it
    let invitation = null
    if (invitationToken) {
      invitation = await prisma.invitation.findUnique({
        where: { token: invitationToken },
        include: { company: true },
      })

      if (!invitation) {
        return NextResponse.json(
          { message: 'Ogiltig inbjudningslänk' },
          { status: 400 }
        )
      }

      if (invitation.used) {
        return NextResponse.json(
          { message: 'Inbjudningslänken har redan använts' },
          { status: 400 }
        )
      }

      if (new Date(invitation.expiresAt) < new Date()) {
        return NextResponse.json(
          { message: 'Inbjudningslänken har gått ut' },
          { status: 400 }
        )
      }

      if (invitation.email !== email) {
        return NextResponse.json(
          { message: 'E-postadressen matchar inte inbjudningen' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with invitation data if available
    const userData: any = {
      name: invitation?.name || name, // Use invitation name if available
      email,
      password: hashedPassword,
      role: invitation ? 'EMPLOYEE' : 'INDIVIDUAL',
    }

    if (invitation) {
      userData.companyId = invitation.companyId
    }

    const user = await prisma.user.create({
      data: userData,
    })

    // Mark invitation as used if it exists
    if (invitation) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          used: true,
          usedAt: new Date(),
        },
      })
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { 
        message: invitation ? 'Användare skapad och ansluten till företaget framgångsrikt' : 'Användare skapad framgångsrikt',
        user: userWithoutPassword 
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

    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Ett fel uppstod vid registrering' },
      { status: 500 }
    )
  }
}
