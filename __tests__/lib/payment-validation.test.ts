import {
  validateCoursePayment,
  validateCompanySubscription,
  validateUserAccess,
  canEnrollInCourse,
} from '../../lib/payment-validation'

// ── Supabase admin mock ──────────────────────────────────────────────────────
const mockSingle = jest.fn()
const mockMaybeSingle = jest.fn()

// Build a chainable mock: from().select().eq().eq()...single/maybeSingle
function makeChain(terminal: { single: jest.Mock; maybeSingle: jest.Mock }): any {
  const chain: any = {
    eq: jest.fn(() => chain),
    select: jest.fn(() => chain),
    single: terminal.single,
    maybeSingle: terminal.maybeSingle,
  }
  return chain
}

const mockFrom = jest.fn(() => makeChain({ single: mockSingle, maybeSingle: mockMaybeSingle }))

jest.mock('../../lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockFrom }),
}))

// ── Tests ────────────────────────────────────────────────────────────────────
describe('Payment Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFrom.mockImplementation(() => makeChain({ single: mockSingle, maybeSingle: mockMaybeSingle }))
  })

  describe('validateCoursePayment', () => {
    it('should return valid access for paid enrollment', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { id: 'enrollment-123', user_id: 'user-123', course_id: 'course-123',
          is_paid: true, paid_at: new Date().toISOString(), is_gift: false },
        error: null,
      })

      const result = await validateCoursePayment('user-123', 'course-123')

      expect(result).toEqual({
        isValid: true,
        hasAccess: true,
        paymentStatus: 'paid',
        message: 'Payment confirmed',
      })
    })

    it('should return valid access for gift enrollment', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { id: 'enrollment-123', user_id: 'user-123', course_id: 'course-123',
          is_paid: false, paid_at: null, is_gift: true },
        error: null,
      })

      const result = await validateCoursePayment('user-123', 'course-123')

      expect(result).toEqual({
        isValid: true,
        hasAccess: true,
        paymentStatus: 'gift',
        message: 'Access granted via gift',
      })
    })

    it('should return invalid access for no enrollment', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null })

      const result = await validateCoursePayment('user-123', 'course-123')

      expect(result).toEqual({
        isValid: false,
        hasAccess: false,
        paymentStatus: 'none',
        message: 'No enrollment found',
      })
    })

    it('should return pending status for unpaid enrollment with fortnox invoice', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { id: 'enrollment-123', user_id: 'user-123', course_id: 'course-123',
          is_paid: false, paid_at: null, is_gift: false, fortnox_invoice_id: 'INV-001' },
        error: null,
      })

      const result = await validateCoursePayment('user-123', 'course-123')

      expect(result).toEqual({
        isValid: false,
        hasAccess: false,
        paymentStatus: 'pending',
        message: 'Invoice sent — awaiting payment',
      })
    })
  })

  describe('validateCompanySubscription', () => {
    it('should return valid access for active subscription', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      mockSingle.mockResolvedValue({
        data: { payment_status: 'PAID', is_active: true, plan_end_date: futureDate.toISOString() },
        error: null,
      })

      const result = await validateCompanySubscription('company-123')

      expect(result.isValid).toBe(true)
      expect(result.hasAccess).toBe(true)
      expect(result.paymentStatus).toBe('paid')
      expect(result.message).toBe('Active subscription')
    })

    it('should return invalid access for expired subscription', async () => {
      const pastDate = new Date()
      pastDate.setFullYear(pastDate.getFullYear() - 1)

      mockSingle.mockResolvedValue({
        data: { payment_status: 'PAID', is_active: true, plan_end_date: pastDate.toISOString() },
        error: null,
      })

      const result = await validateCompanySubscription('company-123')

      expect(result).toEqual({
        isValid: false,
        hasAccess: false,
        paymentStatus: 'failed',
        message: 'Subscription expired',
      })
    })

    it('should return pending status for pending payment', async () => {
      mockSingle.mockResolvedValue({
        data: { payment_status: 'PENDING', is_active: false, plan_end_date: null },
        error: null,
      })

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
      mockSingle.mockResolvedValue({
        data: { role: 'ADMIN', company_id: null },
        error: null,
      })

      const result = await validateUserAccess('admin-123', 'course_learning', 'course-123')

      expect(result).toEqual({
        isValid: true,
        hasAccess: true,
        paymentStatus: 'paid',
        message: 'Admin access',
      })
    })

    it('should validate course access for regular users', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { role: 'USER', company_id: null },
        error: null,
      })
      mockMaybeSingle.mockResolvedValue({
        data: { is_paid: true, paid_at: new Date().toISOString(), is_gift: false },
        error: null,
      })

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
    it('should allow enrollment for published course with no existing enrollment', async () => {
      mockSingle.mockResolvedValue({
        data: { is_published: true },
        error: null,
      })
      mockMaybeSingle.mockResolvedValue({ data: null, error: null })

      const result = await canEnrollInCourse('user-123', 'course-123')

      expect(result).toEqual({
        canEnroll: true,
        reason: 'Payment required for enrollment',
        requiresPayment: true,
      })
    })

    it('should prevent enrollment for unpublished course', async () => {
      mockSingle.mockResolvedValue({
        data: { is_published: false },
        error: null,
      })

      const result = await canEnrollInCourse('user-123', 'course-123')

      expect(result).toEqual({
        canEnroll: false,
        reason: 'Course is not available',
        requiresPayment: false,
      })
    })

    it('should prevent enrollment if already enrolled and paid', async () => {
      mockSingle.mockResolvedValue({
        data: { is_published: true },
        error: null,
      })
      mockMaybeSingle.mockResolvedValue({
        data: { is_paid: true, is_gift: false },
        error: null,
      })

      const result = await canEnrollInCourse('user-123', 'course-123')

      expect(result).toEqual({
        canEnroll: false,
        reason: 'Already enrolled',
        requiresPayment: false,
      })
    })
  })
})
