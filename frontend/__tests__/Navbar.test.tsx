import { render, screen } from '@testing-library/react'
import Navbar from '@/components/Navbar'

describe('Navbar Component', () => {
  it('renders the branding text EnsureVault', () => {
    render(<Navbar />)
    const brandElement = screen.getByText(/EnsureVault/i)
    expect(brandElement).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<Navbar />)
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/New Claim/i)).toBeInTheDocument()
    expect(screen.getByText(/Management/i)).toBeInTheDocument()
    expect(screen.getByText(/Calculator/i)).toBeInTheDocument()
  })
})
