import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.FORTNOX_CLIENT_SECRET = 'fortnox_secret_123'
process.env.FORTNOX_ACCESS_TOKEN = 'fortnox_token_123'
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
process.env.ADMIN_EMAIL = 'admin@example.com'

// Mock Supabase clients
jest.mock('./lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      delete: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
    auth: {
      admin: {
        getUserById: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        updateUserById: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    },
  })),
}))

jest.mock('./lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}))

// Mock Fortnox
jest.mock('./lib/fortnox', () => ({
  fortnox: {
    createOrUpdateCustomer: jest.fn().mockResolvedValue('CUST-001'),
    createCourseInvoice: jest.fn().mockResolvedValue('INV-001'),
    createCompanyInvoice: jest.fn().mockResolvedValue('INV-002'),
    testConnection: jest.fn().mockResolvedValue(true),
  },
  createFortnoxCustomerFromPayment: jest.fn().mockResolvedValue('CUST-001'),
  createInvoiceFromPayment: jest.fn().mockResolvedValue('INV-001'),
}))

// Mock fetch globally
global.fetch = jest.fn()

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
    redirect: jest.fn(),
    next: jest.fn(),
  },
}))

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}
