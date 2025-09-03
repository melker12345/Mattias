import { prisma } from './prisma';
import type { PaymentValidationResult } from './types/payment';

/**
 * Validate if a user has paid access to a course
 */
export async function validateCoursePayment(
  userId: string,
  courseId: string
): Promise<PaymentValidationResult> {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        course: true,
        payment: true,
      },
    });

    if (!enrollment) {
      return {
        isValid: false,
        hasAccess: false,
        paymentStatus: 'none',
        message: 'No enrollment found',
      };
    }

    // Check if it's a gift
    if (enrollment.isGift) {
      return {
        isValid: true,
        hasAccess: true,
        paymentStatus: 'gift',
        message: 'Access granted via gift',
      };
    }

    // Check if payment is confirmed
    if (enrollment.isPaid && enrollment.paidAt) {
      return {
        isValid: true,
        hasAccess: true,
        paymentStatus: 'paid',
        message: 'Payment confirmed',
      };
    }

    // Check if payment is pending
    if (enrollment.stripePaymentId && !enrollment.isPaid) {
      return {
        isValid: false,
        hasAccess: false,
        paymentStatus: 'pending',
        message: 'Payment is being processed',
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
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return {
        isValid: false,
        hasAccess: false,
        paymentStatus: 'none',
        message: 'Company not found',
      };
    }

    // Check if subscription is active
    if (company.paymentStatus === 'PAID' && company.isActive) {
      // Check if subscription hasn't expired
      if (!company.planEndDate || company.planEndDate > new Date()) {
        return {
          isValid: true,
          hasAccess: true,
          paymentStatus: 'paid',
          expiresAt: company.planEndDate || undefined,
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
    switch (company.paymentStatus) {
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

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
      return {
        isValid: true,
        hasAccess: true,
        paymentStatus: 'paid',
        message: 'Admin access',
      };
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
        if (user.companyId) {
          return await validateCompanySubscription(user.companyId);
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
    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return {
        canEnroll: false,
        reason: 'Course not found',
        requiresPayment: false,
      };
    }

    if (!course.isPublished) {
      return {
        canEnroll: false,
        reason: 'Course is not available',
        requiresPayment: false,
      };
    }

    // Check existing enrollment
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      if (existingEnrollment.isPaid || existingEnrollment.isGift) {
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
    const payments = await prisma.payment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        enrollment: {
          select: {
            id: true,
            completedAt: true,
            passed: true,
            finalScore: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments;
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
    const payments = await prisma.payment.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    return payments;
  } catch (error) {
    console.error('Company payment history error:', error);
    return [];
  }
}