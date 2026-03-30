import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

// Mock AuthContext — Home renders role-gated cards based on user state
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}))

describe('Home Page', () => {
  it('renders the main heading', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAuth } = require('@/context/AuthContext')
      ; (useAuth as jest.Mock).mockReturnValue({ user: null, logout: jest.fn() })

    render(<Home />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/Secure Your Future with/i)
    expect(heading).toHaveTextContent(/EnsureVault/i)
  })

  it('renders Sign In button when not logged in', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAuth } = require('@/context/AuthContext')
      ; (useAuth as jest.Mock).mockReturnValue({ user: null, logout: jest.fn() })

    render(<Home />)
    expect(screen.getByText(/Sign in to EnsureVault/i)).toBeInTheDocument()
    // Admin portal card should NOT be visible for unauthenticated users
    expect(screen.queryByText(/Admin & Agents/i)).not.toBeInTheDocument()
  })

  it('renders all portal cards for admin role', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAuth } = require('@/context/AuthContext')
      ; (useAuth as jest.Mock).mockReturnValue({
        user: { name: 'Admin', role: 'admin', user_id: 0 },
        logout: jest.fn(),
      })

    render(<Home />)
    expect(screen.getByText(/Customer Portal/i)).toBeInTheDocument()
    expect(screen.getByText(/Admin & Agents/i)).toBeInTheDocument()
    expect(screen.getByText(/Risk Engine/i)).toBeInTheDocument()
  })

  it('hides Admin & Agents card for customer role', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAuth } = require('@/context/AuthContext')
      ; (useAuth as jest.Mock).mockReturnValue({
        user: { name: 'Amit Patel', role: 'customer', user_id: 1, customer_id: 1 },
        logout: jest.fn(),
      })

    render(<Home />)
    expect(screen.getByText(/My Portfolio/i)).toBeInTheDocument()
    expect(screen.queryByText(/Admin & Agents/i)).not.toBeInTheDocument()
  })
})
