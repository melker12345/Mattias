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

    // Get employee details with enrollments and progress
    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
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
        enrollments: {
          select: {
            id: true,
            enrolledAt: true,
            completedAt: true,
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                duration: true,
                lessons: {
                  select: {
                    id: true,
                    title: true,
                    order: true,
                    progress: {
                      where: { userId: employeeId },
                      select: { id: true, completed: true, completedAt: true }
                    }
                  },
                  orderBy: { order: 'asc' }
                }
              }
            }
          },
          orderBy: { enrolledAt: 'desc' }
        },
        certificates: {
          select: { id: true, certificateNumber: true, issuedAt: true, id06Verified: true }
        }
      }
    })

    if (!employee) {
      return NextResponse.json(
        { message: 'Anställd hittades inte' },
        { status: 404 }
      )
    }

    // Transform the data to include progress percentages
    const transformedEmployee = {
      ...employee,
      enrollments: employee.enrollments.map(enrollment => {
        const totalLessons = enrollment.course.lessons.length
        const completedLessons = enrollment.course.lessons.filter(lesson => 
          lesson.progress.some(p => p.completed)
        ).length
        const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

        return {
          ...enrollment,
          course: {
            ...enrollment.course,
            totalLessons,
            completedLessons,
            progressPercentage,
            lessons: enrollment.course.lessons.map(lesson => ({
              ...lesson,
              completed: lesson.progress.some(p => p.completed),
              completedAt: lesson.progress.find(p => p.completed)?.completedAt || null
            }))
          }
        }
      })
    }

    return NextResponse.json({ employee: transformedEmployee })
  } catch (error) {
    console.error('Error fetching employee details:', error)
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av anställds detaljer' },
      { status: 500 }
    )
  }
}
