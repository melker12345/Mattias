import { createAdminClient } from './supabase/admin';
import type { PaymentValidationResult } from './types/payment';

/**
 * Validate if a user has paid access to a course
 */
export async function validateCoursePayment(
  userId: string,
  courseId: string
): Promise<PaymentValidationResult> {
  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('users')
      .select('role, email')
      .eq('id', userId)
      .maybeSingle();
    const isAdmin =
      profile?.role === 'ADMIN' ||
      (!!process.env.ADMIN_EMAIL && profile?.email === process.env.ADMIN_EMAIL);
    if (isAdmin) {
      return {
        isValid: true,
        hasAccess: true,
        paymentStatus: 'paid',
        message: 'Admin access',
      };
    }

    const { data: enrollment } = await admin
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!enrollment) {
      return {
        isValid: false,
        hasAccess: false,
        paymentStatus: 'none',
        message: 'No enrollment found',
      };
    }

    // Check if it's a gift
    if (enrollment.is_gift) {
      return {
        isValid: true,
        hasAccess: true,
        paymentStatus: 'gift',
        message: 'Access granted via gift',
      };
    }

    // Check if payment is confirmed
    if (enrollment.is_paid && enrollment.paid_at) {
      return {
        isValid: true,
        hasAccess: true,
        paymentStatus: 'paid',
        message: 'Payment confirmed',
      };
    }

    // Check if invoice has been sent but not yet paid
    if (enrollment.fortnox_invoice_id && !enrollment.is_paid) {
      return {
        isValid: false,
        hasAccess: false,
        paymentStatus: 'pending',
        message: 'Invoice sent — awaiting payment',
      };
    }

    return {
      isValid: false,
      hasAccess: false,
      paymentStatus: 'none',
      message: 'Payment required',
    };

  } catch (error) {
    console.error('Course payment validation error:', error);
    return {
      isValid: false,
      hasAccess: false,
      paymentStatus: 'none',
      message: 'Validation error',
    };
  }
}

/**
 * Validate if a company has active subscription
 */
export async function validateCompanySubscription(companyId: string): Promise<PaymentValidationResult> {
  try {
    const admin = createAdminClient();
    const { data: company } = await admin
      .from('companies')
      .select('payment_status, is_active, plan_end_date')
      .eq('id', companyId)
      .single();

    if (!company) {
      return {
        isValid: false,
        hasAccess: false,
        paymentStatus: 'none',
        message: 'Company not found',
      };
    }

    // Check if subscription is active
    if (company.payment_status === 'PAID' && company.is_active) {
      if (!company.plan_end_date || new Date(company.plan_end_date) > new Date()) {
        return {
          isValid: true,
          hasAccess: true,
          paymentStatus: 'paid',
          expiresAt: company.plan_end_date ? new Date(company.plan_end_date) : undefined,
          message: 'Active subscription',
        };
      } else {
        return {
          isValid: false,
          hasAccess: false,
          paymentStatus: 'failed',
          message: 'Subscription expired',
        };
      }
    }

    // Check payment status
    switch (company.payment_status) {
      case 'PENDING':
        return {
          isValid: false,
          hasAccess: false,
          paymentStatus: 'pending',
          message: 'Payment is being processed',
        };
      case 'OVERDUE':
        return {
          isValid: false,
          hasAccess: false,
          paymentStatus: 'failed',
          message: 'Payment is overdue',
        };
      case 'CANCELLED':
        return {
          isValid: false,
          hasAccess: false,
          paymentStatus: 'failed',
          message: 'Subscription cancelled',
        };
      default:
        return {
          isValid: false,
          hasAccess: false,
          paymentStatus: 'none',
          message: 'No active subscription',
        };
    }

  } catch (error) {
    console.error('Company subscription validation error:', error);
    return {
      isValid: false,
      hasAccess: false,
      paymentStatus: 'none',
      message: 'Validation error',
    };
  }
}

/**
 * Validate user access to any resource (used by middleware)
 */
export async function validateUserAccess(
  userId: string,
  resourceType: string,
  resourceId?: string
): Promise<PaymentValidationResult> {
  try {
    const admin = createAdminClient();
    const { data: user } = await admin
      .from('users')
      .select('role, company_id')
      .eq('id', userId)
      .single();

    if (!user) {
      return {
        isValid: false,
        hasAccess: false,
        paymentStatus: 'none',
        message: 'User not found',
      };
    }

    // Admin always has access
    if (user.role === 'ADMIN') {
      return { isValid: true, hasAccess: true, paymentStatus: 'paid', message: 'Admin access' };
    }

    switch (resourceType) {
      case 'course_learning':
        if (!resourceId) {
          return {
            isValid: false,
            hasAccess: false,
            paymentStatus: 'none',
            message: 'Course ID required',
          };
        }
        return await validateCoursePayment(userId, resourceId);

      case 'company_registration':
        if (user.company_id) {
          return await validateCompanySubscription(user.company_id);
        }
        return {
          isValid: false,
          hasAccess: false,
          paymentStatus: 'none',
          message: 'No company association',
        };

      case 'progress_tracking':
        // Basic dashboard access - always allowed for authenticated users
        return {
          isValid: true,
          hasAccess: true,
          paymentStatus: 'paid',
          message: 'Basic access',
        };

      case 'admin_access':
        if (user.role === 'ADMIN') {
          return {
            isValid: true,
            hasAccess: true,
            paymentStatus: 'paid',
            message: 'Admin access',
          };
        }
        return {
          isValid: false,
          hasAccess: false,
          paymentStatus: 'none',
          message: 'Admin role required',
        };

      default:
        return {
          isValid: false,
          hasAccess: false,
          paymentStatus: 'none',
          message: 'Unknown resource type',
        };
    }

  } catch (error) {
    console.error('User access validation error:', error);
    return {
      isValid: false,
      hasAccess: false,
      paymentStatus: 'none',
      message: 'Validation error',
    };
  }
}

/**
 * Check if user can enroll in a course (payment or gift required)
 */
export async function canEnrollInCourse(
  userId: string,
  courseId: string
): Promise<{ canEnroll: boolean; reason: string; requiresPayment: boolean }> {
  try {
    const admin = createAdminClient();
    const { data: course } = await admin.from('courses').select('is_published').eq('id', courseId).single();

    if (!course) {
      return { canEnroll: false, reason: 'Course not found', requiresPayment: false };
    }

    if (!course.is_published) {
      return { canEnroll: false, reason: 'Course is not available', requiresPayment: false };
    }

    const { data: profile } = await admin.from('users').select('role, email').eq('id', userId).maybeSingle();
    const isAdmin =
      profile?.role === 'ADMIN' ||
      (!!process.env.ADMIN_EMAIL && profile?.email === process.env.ADMIN_EMAIL);
    if (isAdmin) {
      const { data: existingEnrollment } = await admin
        .from('enrollments')
        .select('is_paid, is_gift')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();
      if (existingEnrollment?.is_paid || existingEnrollment?.is_gift) {
        return { canEnroll: false, reason: 'Already enrolled', requiresPayment: false };
      }
      return {
        canEnroll: true,
        reason: 'Administratör — ingen betalning krävs',
        requiresPayment: false,
      };
    }

    const { data: existingEnrollment } = await admin
      .from('enrollments').select('is_paid, is_gift').eq('user_id', userId).eq('course_id', courseId).maybeSingle();

    if (existingEnrollment) {
      if (existingEnrollment.is_paid || existingEnrollment.is_gift) {
        return {
          canEnroll: false,
          reason: 'Already enrolled',
          requiresPayment: false,
        };
      }
      
      // Has enrollment but not paid - can proceed with payment
      return {
        canEnroll: true,
        reason: 'Payment required to complete enrollment',
        requiresPayment: true,
      };
    }

    // No existing enrollment - payment required
    return {
      canEnroll: true,
      reason: 'Payment required for enrollment',
      requiresPayment: true,
    };

  } catch (error) {
    console.error('Enrollment validation error:', error);
    return {
      canEnroll: false,
      reason: 'Validation error',
      requiresPayment: false,
    };
  }
}

/**
 * Get user's payment history
 */
export async function getUserPaymentHistory(userId: string) {
  try {
    const admin = createAdminClient();
    const { data: payments } = await admin
      .from('payments')
      .select('*, course:courses(id, title), enrollment:enrollments(id, completed_at, passed, final_score)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return payments ?? [];
  } catch (error) {
    console.error('Payment history error:', error);
    return [];
  }
}

/**
 * Get company's payment history
 */
export async function getCompanyPaymentHistory(companyId: string) {
  try {
    const admin = createAdminClient();
    const { data: payments } = await admin
      .from('payments')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    return payments ?? [];
  } catch (error) {
    console.error('Company payment history error:', error);
    return [];
  }
}