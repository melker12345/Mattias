import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
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

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        companyId: invitation.companyId,
        companyName: invitation.company.name,
        isExistingUser: invitation.isExistingUser,
        temporaryPassword: invitation.temporaryPassword,
        expiresAt: invitation.expiresAt,
      },
    })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av inbjudningen' },
      { status: 500 }
    )
  }
}
