/**
 * @fileoverview Unit tests for ErrorMessage component
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

import { render, screen, fireEvent } from '@testing-library/react'
import ErrorMessage from '../ErrorMessage'

describe('ErrorMessage', () => {
  it('renders error message correctly', () => {
    render(<ErrorMessage message="Test error message" />)
    
    expect(screen.getByText('Test error message')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders with error variant by default', () => {
    render(<ErrorMessage message="Error message" />)
    
    const container = screen.getByRole('alert')
    expect(container).toHaveClass('bg-error-50', 'border-error-200', 'text-error-800')
  })

  it('renders with warning variant', () => {
    render(<ErrorMessage message="Warning message" variant="warning" />)
    
    const container = screen.getByRole('alert')
    expect(container).toHaveClass('bg-warning-50', 'border-warning-200', 'text-warning-800')
  })

  it('renders with info variant', () => {
    render(<ErrorMessage message="Info message" variant="info" />)
    
    const container = screen.getByRole('alert')
    expect(container).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<ErrorMessage message="Small message" size="sm" />)
    expect(screen.getByRole('alert')).toHaveClass('p-3', 'text-sm')

    rerender(<ErrorMessage message="Medium message" size="md" />)
    expect(screen.getByRole('alert')).toHaveClass('p-4', 'text-sm')

    rerender(<ErrorMessage message="Large message" size="lg" />)
    expect(screen.getByRole('alert')).toHaveClass('p-5', 'text-base')
  })

  it('shows icon by default', () => {
    render(<ErrorMessage message="Error with icon" />)
    
    const icon = screen.getByRole('alert').querySelector('svg')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveClass('text-error-600')
  })

  it('hides icon when showIcon is false', () => {
    render(<ErrorMessage message="Error without icon" showIcon={false} />)
    
    const icon = screen.getByRole('alert').querySelector('svg')
    expect(icon).not.toBeInTheDocument()
  })

  it('renders dismissible error with close button', () => {
    const onDismiss = jest.fn()
    render(
      <ErrorMessage 
        message="Dismissible error" 
        dismissible={true} 
        onDismiss={onDismiss} 
      />
    )
    
    const dismissButton = screen.getByLabelText('Dismiss')
    expect(dismissButton).toBeInTheDocument()
    
    fireEvent.click(dismissButton)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('renders children content', () => {
    render(
      <ErrorMessage message="Error with children">
        <div>Additional error details</div>
      </ErrorMessage>
    )
    
    expect(screen.getByText('Error with children')).toBeInTheDocument()
    expect(screen.getByText('Additional error details')).toBeInTheDocument()
  })

  it('renders only children when no message provided', () => {
    render(
      <ErrorMessage>
        <div>Only children content</div>
      </ErrorMessage>
    )
    
    expect(screen.getByText('Only children content')).toBeInTheDocument()
  })

  it('returns null when no message and no children', () => {
    const { container } = render(<ErrorMessage />)
    expect(container.firstChild).toBeNull()
  })

  it('applies custom className', () => {
    render(<ErrorMessage message="Custom class" className="custom-error" />)
    
    expect(screen.getByRole('alert')).toHaveClass('custom-error')
  })

  it('has proper accessibility attributes', () => {
    render(<ErrorMessage message="Accessible error" />)
    
    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'polite')
  })

  it('renders correct icon for each variant', () => {
    const { rerender } = render(<ErrorMessage message="Error" variant="error" />)
    let icon = screen.getByRole('alert').querySelector('svg')
    expect(icon).toHaveClass('text-error-600')

    rerender(<ErrorMessage message="Warning" variant="warning" />)
    icon = screen.getByRole('alert').querySelector('svg')
    expect(icon).toHaveClass('text-warning-600')

    rerender(<ErrorMessage message="Info" variant="info" />)
    icon = screen.getByRole('alert').querySelector('svg')
    expect(icon).toHaveClass('text-blue-600')
  })
})