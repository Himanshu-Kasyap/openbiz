import { render, screen } from '@testing-library/react'
import Home from '../pages/index'

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    
    expect(screen.getByRole('heading', { name: /udyam registration portal/i })).toBeInTheDocument()
  })

  it('renders the description text', () => {
    render(<Home />)
    
    expect(screen.getByText(/complete your udyam registration process/i)).toBeInTheDocument()
  })

  it('renders the start registration button', () => {
    render(<Home />)
    
    const startButtons = screen.getAllByRole('link', { name: /start registration/i })
    expect(startButtons.length).toBeGreaterThan(0)
    expect(startButtons[0]).toHaveAttribute('href', '/registration')
  })

  it('renders the learn more button', () => {
    render(<Home />)
    
    const learnMoreButton = screen.getByRole('link', { name: /learn more/i })
    expect(learnMoreButton).toBeInTheDocument()
    expect(learnMoreButton).toHaveAttribute('href', '/help')
  })

  it('renders the registration process steps', () => {
    render(<Home />)
    
    expect(screen.getByRole('heading', { name: /registration process/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /aadhaar verification/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /pan & personal details/i })).toBeInTheDocument()
  })

  it('renders step descriptions', () => {
    render(<Home />)
    
    expect(screen.getByText(/verify your identity using your 12-digit aadhaar/i)).toBeInTheDocument()
    expect(screen.getByText(/provide your pan number and complete/i)).toBeInTheDocument()
  })

  it('renders step numbers', () => {
    render(<Home />)
    
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})