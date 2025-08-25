import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token

    // Find invitation by token
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!invitation) {
      return NextResponse.json(
        { message: 'Inbjudningslänk hittades inte' },
        { status: 404 }
      )
    }

    // Check if invitation has expired
    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { message: 'Inbjudningslänk har gått ut' },
        { status: 410 }
      )
    }

    // Check if invitation has already been used
    if (invitation.used) {
      return NextResponse.json(
        { message: 'Inbjudningslänk har redan använts' },
        { status: 410 }
      )
    }

    // Mark invitation as used
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    })

    // If it's a new user, ensure they exist and are properly set up
    if (!invitation.isExistingUser) {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: invitation.email },
      })

      if (!existingUser) {
        // Create the user if they don't exist
        await prisma.user.create({
          data: {
            email: invitation.email,
            name: invitation.email.split('@')[0], // Use email prefix as name
            personalNumber: '', // Will be filled later
            password: invitation.temporaryPassword || '',
            role: 'EMPLOYEE',
            companyId: invitation.companyId,
            bankIdVerified: false,
            id06Eligible: false,
          },
        })
      } else {
        // Update existing user to be part of the company
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            companyId: invitation.companyId,
            role: 'EMPLOYEE',
          },
        })
      }
    }

    return NextResponse.json({
      message: 'Inbjudning accepterad framgångsrikt',
      invitation: {
        email: invitation.email,
        companyName: invitation.company.name,
        isExistingUser: invitation.isExistingUser,
      },
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { message: 'Ett fel uppstod vid acceptering av inbjudningen' },
      { status: 500 }
    )
  }
}
