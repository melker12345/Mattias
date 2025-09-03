import {
  validateCoursePayment,
  validateCompanySubscription,
  validateUserAccess,
  canEnrollInCourse,
} from '../../lib/payment-validation'
import { prisma } from '../../lib/prisma'

jest.mock('../../lib/prisma')

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Payment Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateCoursePayment', () => {
    it('should return valid access for paid enrollment', async () => {
      mockPrisma.enrollment.findUnique.mockResolvedValue({
        id: 'enrollment-123',
        userId: 'user-123',
        courseId: 'course-123',
        isPaid: true,
        paidAt: new Date(),
        isGift: false,
        course: { id: 'course-123', title: 'Test Course' },
        payment: { id: 'payment-123', status: 'succeeded' },
      } as any)

      const result = await validateCoursePayment('user-123', 'course-123')

      expect(result).toEqual({
        isValid: true,
        hasAccess: true,
        paymentStatus: 'paid',
        message: 'Payment confirmed',
      })
    })

    it('should return valid access for gift enrollment', async () => {
      mockPrisma.enrollment.findUnique.mockResolvedValue({
        id: 'enrollment-123',
        userId: 'user-123',
        courseId: 'course-123',
        isPaid: false,
        isGift: true,
        giftedBy: 'admin-123',
        course: { id: 'course-123', title: 'Test Course' },
      } as any)

      const result = await validateCoursePayment('user-123', 'course-123')

      expect(result).toEqual({
        isValid: true,
        hasAccess: true,
        paymentStatus: 'gift',
        message: 'Access granted via gift',
      })
    })

    it('should return invalid access for no enrollment', async () => {
      mockPrisma.enrollment.findUnique.mockResolvedValue(null)

      const result = await validateCoursePayment('user-123', 'course-123')

      expect(result).toEqual({
        isValid: false,
        hasAccess: false,
        paymentStatus: 'none',
        message: 'No enrollment found',
      })
    })

    it('should return pending status for unpaid enrollment with payment intent', async () => {
      mockPrisma.enrollment.findUnique.mockResolvedValue({
        id: 'enrollment-123',
        userId: 'user-123',
        courseId: 'course-123',
        isPaid: false,
        isGift: false,
        stripePaymentId: 'pi_test_123',
        course: { id: 'course-123', title: 'Test Course' },
      } as any)

      const result = await validateCoursePayment('user-123', 'course-123')

      expect(result).toEqual({
        isValid: false,
        hasAccess: false,
        paymentStatus: 'pending',
        message: 'Payment is being processed',
      })
    })
  })

  describe('validateCompanySubscription', () => {
    it('should return valid access for active subscription', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      mockPrisma.company.findUnique.mockResolvedValue({
        id: 'company-123',
        paymentStatus: 'PAID',
        isActive: true,
        planEndDate: futureDate,
      } as any)

      const result = await validateCompanySubscription('company-123')

      expect(result).toEqual({
        isValid: true,
        hasAccess: true,
        paymentStatus: 'paid',
        expiresAt: futureDate,
        message: 'Active subscription',
      })
    })

    it('should return invalid access for expired subscription', async () => {
      const pastDate = new Date()
      pastDate.setFullYear(pastDate.getFullYear() - 1)

      mockPrisma.company.findUnique.mockResolvedValue({
        id: 'company-123',
        paymentStatus: 'PAID',
        isActive: true,
        planEndDate: pastDate,
      } as any)

      const result = await validateCompanySubscription('company-123')

      expect(result).toEqual({
        isValid: false,
        hasAccess: false,
        paymentStatus: 'failed',
        message: 'Subscription expired',
      })
    })

    it('should return pending status for pending payment', async () => {
      mockPrisma.company.findUnique.mockResolvedValue({
        id: 'company-123',
        paymentStatus: 'PENDING',
        isActive: false,
      } as any)

      const result = await validateCompanySubscription('company-123')

      expect(result).toEqual({
        isValid: false,
        hasAccess: false,
        paymentStatus: 'pending',
        message: 'Payment is being processed',
      })
    })
  })

  describe('validateUserAccess', () => {
    it('should grant admin access to everything', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-123',
        role: 'ADMIN',
        email: 'admin@example.com',
      } as any)

      const result = await validateUserAccess('admin-123', 'course_learning', 'course-123')

      expect(result).toEqual({
        isValid: true,
        hasAccess: true,
        paymentStatus: 'paid',
        message: 'Admin access',
      })
    })

    it('should validate course access for regular users', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        role: 'USER',
        email: 'user@example.com',
      } as any)

      mockPrisma.enrollment.findUnique.mockResolvedValue({
        id: 'enrollment-123',
        userId: 'user-123',
        courseId: 'course-123',
        isPaid: true,
        paidAt: new Date(),
        isGift: false,
      } as any)

      const result = await validateUserAccess('user-123', 'course_learning', 'course-123')

      expect(result).toEqual({
        isValid: true,
        hasAccess: true,
        paymentStatus: 'paid',
        message: 'Payment confirmed',
      })
    })
  })

  describe('canEnrollInCourse', () => {
    it('should allow enrollment for published course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'course-123',
        title: 'Test Course',
        isPublished: true,
      } as any)

      mockPrisma.enrollment.findUnique.mockResolvedValue(null)

      const result = await canEnrollInCourse('user-123', 'course-123')

      expect(result).toEqual({
        canEnroll: true,
        reason: 'Payment required for enrollment',
        requiresPayment: true,
      })
    })

    it('should prevent enrollment for unpublished course', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'course-123',
        title: 'Test Course',
        isPublished: false,
      } as any)

      const result = await canEnrollInCourse('user-123', 'course-123')

      expect(result).toEqual({
        canEnroll: false,
        reason: 'Course is not available',
        requiresPayment: false,
      })
    })

    it('should prevent enrollment if already enrolled and paid', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'course-123',
        title: 'Test Course',
        isPublished: true,
      } as any)

      mockPrisma.enrollment.findUnique.mockResolvedValue({
        id: 'enrollment-123',
        userId: 'user-123',
        courseId: 'course-123',
        isPaid: true,
        isGift: false,
      } as any)

      const result = await canEnrollInCourse('user-123', 'course-123')

      expect(result).toEqual({
        canEnroll: false,
        reason: 'Already enrolled',
        requiresPayment: false,
      })
    })
  })
})
