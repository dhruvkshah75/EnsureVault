import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/Secure Your Future with/i)
    expect(heading).toHaveTextContent(/EnsureVault/i)
  })

  it('renders the action cards', () => {
    render(<Home />)
    expect(screen.getByText(/Customer Portal/i)).toBeInTheDocument()
    expect(screen.getByText(/Admin & Agents/i)).toBeInTheDocument()
    expect(screen.getByText(/Risk Engine/i)).toBeInTheDocument()
  })
})
