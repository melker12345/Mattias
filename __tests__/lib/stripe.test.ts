import type { CoursePaymentData, CompanyPaymentData } from '../../lib/types/payment'

describe('Stripe Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('formatAmount', () => {
    it('should format amounts correctly', () => {
      // Import the actual function for testing
      const { formatAmount } = require('../../lib/stripe')
      
      // Test SEK formatting
      expect(formatAmount(9999, 'SEK')).toContain('99')
      expect(formatAmount(9999, 'SEK')).toContain('kr')
    })
  })

  describe('isValidWebhookEventType', () => {
    it('should validate webhook event types', () => {
      const { isValidWebhookEventType } = require('../../lib/stripe')
      
      expect(isValidWebhookEventType('checkout.session.completed')).toBe(true)
      expect(isValidWebhookEventType('payment_intent.succeeded')).toBe(true)
      expect(isValidWebhookEventType('payment_intent.payment_failed')).toBe(true)
      expect(isValidWebhookEventType('invalid.event.type')).toBe(false)
    })
  })

  describe('Stripe functions exist', () => {
    it('should export required functions', () => {
      const stripeModule = require('../../lib/stripe')
      
      expect(typeof stripeModule.createCourseCheckoutSession).toBe('function')
      expect(typeof stripeModule.createCompanyCheckoutSession).toBe('function')
      expect(typeof stripeModule.formatAmount).toBe('function')
      expect(typeof stripeModule.isValidWebhookEventType).toBe('function')
    })
  })
})