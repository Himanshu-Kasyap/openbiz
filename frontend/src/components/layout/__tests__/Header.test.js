import { render, screen } from '@testing-library/react'
import Header from '../Header'

describe('Header Component', () => {
  it('renders logo and brand name', () => {
    render(<Header />)
    
    expect(screen.getByText('U')).toBeInTheDocument()
    expect(screen.getByText('Udyam Registration')).toBeInTheDocument()
  })

  it('renders navigation links on desktop', () => {
    render(<Header />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Registration')).toBeInTheDocument()
    expect(screen.getByText('Help')).toBeInTheDocument()
  })

  it('renders mobile menu button', () => {
    render(<Header />)
    
    const menuButton = screen.getByLabelText('Open menu')
    expect(menuButton).toBeInTheDocument()
    expect(menuButton).toHaveClass('md:hidden')
  })

  it('has correct navigation structure', () => {
    render(<Header />)
    
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('hidden', 'md:flex')
  })

  it('logo links to home page', () => {
    render(<Header />)
    
    const logoLink = screen.getByRole('link', { name: /udyam/i })
    expect(logoLink).toHaveAttribute('href', '/')
  })

  it('applies responsive classes correctly', () => {
    const { container } = render(<Header />)
    
    const header = container.firstChild
    expect(header).toHaveClass('bg-white', 'shadow-sm', 'border-b', 'border-gray-200')
  })

  it('navigation links have correct hrefs', () => {
    render(<Header />)
    
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Registration' })).toHaveAttribute('href', '/registration')
    expect(screen.getByRole('link', { name: 'Help' })).toHaveAttribute('href', '/help')
  })
})