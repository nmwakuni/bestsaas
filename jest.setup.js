// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.BETTER_AUTH_SECRET = 'test-secret-key-for-testing-purposes-minimum-32-characters'
process.env.BETTER_AUTH_URL = 'http://localhost:3000'
process.env.MPESA_CONSUMER_KEY = 'test_consumer_key'
process.env.MPESA_CONSUMER_SECRET = 'test_consumer_secret'
process.env.MPESA_BUSINESS_SHORT_CODE = '174379'
process.env.MPESA_PASSKEY = 'test_passkey'
process.env.AT_API_KEY = 'test_at_api_key'
process.env.AT_USERNAME = 'sandbox'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})
