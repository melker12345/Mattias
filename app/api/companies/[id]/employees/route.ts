import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id

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

    // Get all employees for this company
    const employees = await prisma.user.findMany({
      where: { 
        companyId: companyId,
        role: 'EMPLOYEE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        personalNumber: true,
        bankIdVerified: true,
        bankIdVerifiedAt: true,
        id06Eligible: true,
        createdAt: true,
        updatedAt: true,
        // Get enrollment and certificate counts
        enrollments: {
          select: {
            id: true,
            completedAt: true
          }
        },
        certificates: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the frontend interface
    const transformedEmployees = employees.map(employee => {
      const enrolledCourses = employee.enrollments.length
      const completedCourses = employee.enrollments.filter(e => e.completedAt).length
      const certificates = employee.certificates.length
      
      return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        personalNumber: employee.personalNumber,
        bankIdVerified: employee.bankIdVerified,
        id06Eligible: employee.id06Eligible,
        enrolledCourses,
        completedCourses,
        certificates,
        lastActivity: employee.updatedAt ? new Date(employee.updatedAt).toLocaleDateString('sv-SE') : 'Aldrig',
        createdAt: employee.createdAt,
        status: employee.bankIdVerified ? 'VERIFIED' : 'PENDING_BANKID'
      }
    })

    return NextResponse.json({
      employees: transformedEmployees,
      company: {
        id: company.id,
        name: company.name
      }
    })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av anställda' },
      { status: 500 }
    )
  }
}
