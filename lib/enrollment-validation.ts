import { prisma } from './prisma'
import { validateCompanyPayment } from './payment-validation'

export interface EnrollmentValidation {
  canEnroll: boolean
  reason: string
  requiresPayment: boolean
  coursePurchaseId?: string
}

/**
 * SECURE: Validate if a user can enroll in a course
 * This is the single source of truth for enrollment validation
 */
export async function validateEnrollmentEligibility(
  userId: string, 
  courseId: string,
  bypassPayment = false, // Only for admin gifts
  adminUserId?: string
): Promise<EnrollmentValidation> {
  try {
    // Get user and course data
    const [user, course] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { company: true }
      }),
      prisma.course.findUnique({
        where: { id: courseId }
      })
    ])

    if (!user) {
      return {
        canEnroll: false,
        reason: 'Användare hittades inte',
        requiresPayment: false
      }
    }

    if (!course) {
      return {
        canEnroll: false,
        reason: 'Kurs hittades inte',
        requiresPayment: false
      }
    }

    if (!course.isPublished) {
      return {
        canEnroll: false,
        reason: 'Kursen är inte publicerad',
        requiresPayment: false
      }
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId
        }
      }
    })

    if (existingEnrollment) {
      return {
        canEnroll: false,
        reason: 'Användaren är redan registrerad för denna kurs',
        requiresPayment: false
      }
    }

    // If it's an admin gift, validate admin permissions
    if (bypassPayment && adminUserId) {
      const admin = await prisma.user.findUnique({
        where: { id: adminUserId }
      })

      if (!admin || admin.role !== 'ADMIN') {
        return {
          canEnroll: false,
          reason: 'Endast administratörer kan ge bort kurser',
          requiresPayment: false
        }
      }

      // Admin gifts are always allowed
      return {
        canEnroll: true,
        reason: 'Administratörsgåva',
        requiresPayment: false
      }
    }

    // If course is free, allow enrollment
    if (course.price === 0) {
      return {
        canEnroll: true,
        reason: 'Gratis kurs',
        requiresPayment: false
      }
    }

    // Check if user is admin (admins get free access)
    if (user.role === 'ADMIN') {
      return {
        canEnroll: true,
        reason: 'Administratörsbehörighet',
        requiresPayment: false
      }
    }

    // For paid courses, check if user/company has purchased access
    if (user.companyId) {
      // Company user - check company purchases
      const companyValidation = await validateCompanyPayment(user.companyId)
      
      if (!companyValidation.isValid) {
        return {
          canEnroll: false,
          reason: `Företagets betalning är inte giltig: ${companyValidation.message}`,
          requiresPayment: true
        }
      }

      // Check if company has purchased this course
      const coursePurchase = await prisma.coursePurchase.findFirst({
        where: {
          companyId: user.companyId,
          courseId: courseId
        },
        orderBy: {
          purchasedAt: 'desc'
        }
      })

      if (!coursePurchase) {
        return {
          canEnroll: false,
          reason: 'Företaget har inte köpt denna kurs',
          requiresPayment: true
        }
      }

      return {
        canEnroll: true,
        reason: 'Företagsköp',
        requiresPayment: false,
        coursePurchaseId: coursePurchase.id
      }
    } else {
      // Individual user - for now, require payment
      // TODO: Implement individual payment system
      return {
        canEnroll: false,
        reason: 'Individuella köp stöds inte ännu',
        requiresPayment: true
      }
    }

  } catch (error) {
    console.error('Enrollment validation error:', error)
    return {
      canEnroll: false,
      reason: 'Ett fel uppstod vid validering av registrering',
      requiresPayment: false
    }
  }
}

/**
 * SECURE: Create an enrollment with full validation
 */
export async function createSecureEnrollment(
  userId: string,
  courseId: string,
  options: {
    isGift?: boolean
    giftedBy?: string
    giftReason?: string
    coursePurchaseId?: string
  } = {}
) {
  try {
    // Validate enrollment eligibility
    const validation = await validateEnrollmentEligibility(
      userId, 
      courseId, 
      options.isGift, 
      options.giftedBy
    )

    if (!validation.canEnroll) {
      throw new Error(validation.reason)
    }

    // Create the enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: userId,
        courseId: courseId,
        coursePurchaseId: options.coursePurchaseId || validation.coursePurchaseId || null,
        isGift: options.isGift || false,
        giftedBy: options.giftedBy || null,
        giftedAt: options.isGift ? new Date() : null,
        giftReason: options.giftReason || null
      }
    })

    return {
      success: true,
      enrollment,
      message: 'Registrering skapad framgångsrikt'
    }

  } catch (error) {
    console.error('Secure enrollment creation error:', error)
    return {
      success: false,
      enrollment: null,
      message: error instanceof Error ? error.message : 'Ett fel uppstod vid registrering'
    }
  }
}

/**
 * SECURE: Validate course access for learning
 */
export async function validateCourseAccess(userId: string, courseId: string): Promise<boolean> {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId
        }
      },
      include: {
        coursePurchase: {
          include: {
            company: true
          }
        }
      }
    })

    if (!enrollment) {
      return false
    }

    // If it's a gift, access is always allowed
    if (enrollment.isGift) {
      return true
    }

    // If no course purchase (admin or free course), allow access
    if (!enrollment.coursePurchase) {
      return true
    }

    // Validate company payment status
    const companyValidation = await validateCompanyPayment(enrollment.coursePurchase.companyId)
    return companyValidation.isValid

  } catch (error) {
    console.error('Course access validation error:', error)
    return false
  }
}
