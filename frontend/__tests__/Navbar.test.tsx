import { render, screen } from '@testing-library/react'
import Navbar from '@/components/Navbar'

// Mock Next.js router — Navbar calls useRouter() for logout redirect
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}))

// Mock AuthContext — default: no user (logged out)
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: null, logout: jest.fn() }),
}))

describe('Navbar Component', () => {
  it('renders the branding text EnsureVault', () => {
    render(<Navbar />)
    expect(screen.getByText(/EnsureVault/i)).toBeInTheDocument()
  })

  it('renders Sign in button when user is not logged in', () => {
    render(<Navbar />)
    expect(screen.getByText(/Sign in/i)).toBeInTheDocument()
  })

  it('renders customer nav links when logged in as customer', () => {
    // Override the mock for this test only
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAuth } = require('@/context/AuthContext')
      ; (useAuth as jest.Mock).mockReturnValueOnce({
        user: { name: 'Amit Patel', role: 'customer', user_id: 1 },
        logout: jest.fn(),
      })
    render(<Navbar />)
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/New Claim/i)).toBeInTheDocument()
    expect(screen.getByText(/Calculator/i)).toBeInTheDocument()
    // Management should NOT be visible for customers
    expect(screen.queryByText(/Management/i)).not.toBeInTheDocument()
  })
})
