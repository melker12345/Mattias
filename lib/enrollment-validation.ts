import { createAdminClient } from './supabase/admin'
import { validateCompanySubscription } from './payment-validation'

export interface EnrollmentValidation {
  canEnroll: boolean
  reason: string
  requiresPayment: boolean
  coursePurchaseId?: string
  /** Platform admin — no charge; enrollment marked paid for consistency */
  complimentaryAccess?: boolean
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
    const admin = createAdminClient()
    const [{ data: user }, { data: course }] = await Promise.all([
      admin.from('users').select('id, email, role, company_id').eq('id', userId).single(),
      admin.from('courses').select('id, price, is_published, passing_score').eq('id', courseId).single(),
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

    let userRole = user.role as string
    if (process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL) {
      userRole = 'ADMIN'
    }

    if (!course.is_published) {
      return {
        canEnroll: false,
        reason: 'Kursen är inte publicerad',
        requiresPayment: false
      }
    }

    const { data: existingEnrollment } = await admin
      .from('enrollments').select('id').eq('user_id', userId).eq('course_id', courseId).maybeSingle()

    if (existingEnrollment) {
      return {
        canEnroll: false,
        reason: 'Användaren är redan registrerad för denna kurs',
        requiresPayment: false
      }
    }

    if (bypassPayment && adminUserId) {
      const { data: adminUser } = await admin.from('users').select('role, email').eq('id', adminUserId).single()
      const gifterIsAdmin =
        adminUser &&
        (adminUser.role === 'ADMIN' ||
          (process.env.ADMIN_EMAIL && adminUser.email === process.env.ADMIN_EMAIL))
      if (!gifterIsAdmin) {
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
    if ((course.price as number) === 0) {
      return {
        canEnroll: true,
        reason: 'Gratis kurs',
        requiresPayment: false
      }
    }

    // Check if user is admin (admins get free access)
    if (userRole === 'ADMIN') {
      return {
        canEnroll: true,
        reason: 'Administratörsbehörighet',
        requiresPayment: false,
        complimentaryAccess: true,
      }
    }

    // For paid courses, check if user/company has purchased access
    if (user.company_id) {
      const companyValidation = await validateCompanySubscription(user.company_id)
      if (!companyValidation.isValid) {
        return { canEnroll: false, reason: `Företagets betalning är inte giltig: ${companyValidation.message}`, requiresPayment: true }
      }

      const { data: coursePurchase } = await admin
        .from('course_purchases')
        .select('id')
        .eq('company_id', user.company_id)
        .eq('course_id', courseId)
        .order('purchased_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!coursePurchase) {
        return {
          canEnroll: false,
          reason: 'Företaget har inte köpt denna kurs',
          requiresPayment: true
        }
      }

      return { canEnroll: true, reason: 'Företagsköp', requiresPayment: false, coursePurchaseId: coursePurchase.id }
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

    const admin = createAdminClient()
    const row: Record<string, unknown> = {
      user_id: userId,
      course_id: courseId,
      course_purchase_id: options.coursePurchaseId ?? validation.coursePurchaseId ?? null,
      is_gift: options.isGift ?? false,
      gifted_by: options.giftedBy ?? null,
      gifted_at: options.isGift ? new Date().toISOString() : null,
      gift_reason: options.giftReason ?? null,
    }
    if (validation.complimentaryAccess) {
      row.is_paid = true
      row.paid_at = new Date().toISOString()
      row.payment_amount = 0
      row.payment_method = 'admin_complimentary'
    }
    const { data: enrollment, error } = await admin.from('enrollments').insert(row)
      .select()
      .single()
    if (error) throw error

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
    const admin = createAdminClient()
    const { data: profile } = await admin.from('users').select('role, email').eq('id', userId).maybeSingle()
    const isAdmin =
      profile?.role === 'ADMIN' ||
      (!!process.env.ADMIN_EMAIL && profile?.email === process.env.ADMIN_EMAIL)
    if (isAdmin) return true

    const { data: enrollment } = await admin
      .from('enrollments')
      .select('is_gift, course_purchase_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (!enrollment) return false
    if (enrollment.is_gift || !enrollment.course_purchase_id) return true

    const { data: purchase } = await admin
      .from('course_purchases').select('company_id').eq('id', enrollment.course_purchase_id).single()
    if (!purchase) return false

    const companyValidation = await validateCompanySubscription(purchase.company_id)
    return companyValidation.isValid

  } catch (error) {
    console.error('Course access validation error:', error)
    return false
  }
}
