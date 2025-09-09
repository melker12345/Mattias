import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { companyId, employeeId, courseIds, purchaseType } = await request.json()

    // Validate input
    if (!companyId || !courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      )
    }

    // Check if user has access to this company
    const user = session.user as any
    if (user.role !== 'ADMIN' && user.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get company and validate it exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        employees: true
      }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Get courses and validate they exist
    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds }
      }
    })

    if (courses.length !== courseIds.length) {
      return NextResponse.json(
        { error: 'Some courses not found' },
        { status: 404 }
      )
    }

    // Calculate total price
    const totalPrice = courses.reduce((sum, course) => sum + course.price, 0)
    let finalPrice = totalPrice

    // Apply bulk discount if purchasing for all employees
    if (purchaseType === 'bulk') {
      const discount = totalPrice * 0.15 // 15% bulk discount
      finalPrice = totalPrice - discount
    }

    // Create course purchase record
    const coursePurchase = await prisma.coursePurchase.create({
      data: {
        companyId,
        courseId: courseIds[0], // For now, we'll create one purchase per course
        quantity: purchaseType === 'bulk' ? company.employees.length : 1,
        pricePerUnit: courses[0].price,
        totalAmount: finalPrice
      }
    })

    // Create enrollments
    const enrollments = []

    if (purchaseType === 'individual' && employeeId) {
      // Individual purchase - enroll specific employee
      for (const courseId of courseIds) {
        const enrollment = await prisma.enrollment.create({
          data: {
            userId: employeeId,
            courseId,
            coursePurchaseId: coursePurchase.id,
            enrolledAt: new Date()
          }
        })
        enrollments.push(enrollment)
      }
    } else if (purchaseType === 'bulk') {
      // Bulk purchase - enroll all employees
      for (const employee of company.employees) {
        for (const courseId of courseIds) {
          const enrollment = await prisma.enrollment.create({
            data: {
              userId: employee.id,
              courseId,
              coursePurchaseId: coursePurchase.id,
              enrolledAt: new Date()
            }
          })
          enrollments.push(enrollment)
        }
      }
    }

    // Create invoice for the purchase
    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        invoiceNumber: `INV-COURSE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        amount: finalPrice,
        currency: 'SEK',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: 'PENDING'
      }
    })

    // Add invoice items
    for (const course of courses) {
      await prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          courseId: course.id,
          quantity: purchaseType === 'bulk' ? company.employees.length : 1,
          price: course.price,
          total: purchaseType === 'bulk' ? course.price * company.employees.length : course.price
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: purchaseType === 'individual' 
        ? 'Kurser köpta för anställd'
        : 'Kurser köpta för alla anställda',
      coursePurchase,
      enrollments: enrollments.length,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount
      }
    })

  } catch (error) {
    console.error('Course purchase error:', error)
    return NextResponse.json(
      { error: 'Failed to process course purchase' },
      { status: 500 }
    )
  }
}



