import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; employeeId: string } }
) {
  try {
    const companyId = params.id
    const employeeId = params.employeeId

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

    // Get employee
    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        companyId: companyId,
        role: 'EMPLOYEE'
      },
      select: {
        id: true,
        email: true,
        name: true,
        bankIdVerified: true
      }
    })

    if (!employee) {
      return NextResponse.json(
        { message: 'Anställd hittades inte' },
        { status: 404 }
      )
    }

    // If employee is already verified, no need for invitation link
    if (employee.bankIdVerified) {
      return NextResponse.json(
        { message: 'Anställd är redan verifierad' },
        { status: 400 }
      )
    }

    // Find the most recent valid invitation for this employee
    const invitation = await prisma.invitation.findFirst({
      where: {
        email: employee.email,
        companyId: companyId,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { message: 'Ingen aktiv inbjudning hittades' },
        { status: 404 }
      )
    }

    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/${invitation.token}`

    return NextResponse.json({
      invitationUrl,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
        isExistingUser: invitation.isExistingUser
      }
    })
  } catch (error) {
    console.error('Error fetching invitation link:', error)
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av inbjudningslänk' },
      { status: 500 }
    )
  }
}
