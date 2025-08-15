/**
 * @fileoverview Unit tests for LoadingSpinner components
 * @author Udyam Frontend Team
 * @version 1.0.0
 */

import { render, screen } from '@testing-library/react'
import LoadingSpinner, { LoadingOverlay, InlineLoading } from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveAttribute('aria-label', 'Loading...')
    
    const svg = spinner.querySelector('svg')
    expect(svg).toHaveClass('w-6', 'h-6', 'text-primary-600', 'animate-spin')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />)
    let svg = screen.getByRole('status').querySelector('svg')
    expect(svg).toHaveClass('w-4', 'h-4')

    rerender(<LoadingSpinner size="md" />)
    svg = screen.getByRole('status').querySelector('svg')
    expect(svg).toHaveClass('w-6', 'h-6')

    rerender(<LoadingSpinner size="lg" />)
    svg = screen.getByRole('status').querySelector('svg')
    expect(svg).toHaveClass('w-8', 'h-8')

    rerender(<LoadingSpinner size="xl" />)
    svg = screen.getByRole('status').querySelector('svg')
    expect(svg).toHaveClass('w-12', 'h-12')
  })

  it('renders with different colors', () => {
    const { rerender } = render(<LoadingSpinner color="primary" />)
    let svg = screen.getByRole('status').querySelector('svg')
    expect(svg).toHaveClass('text-primary-600')

    rerender(<LoadingSpinner color="secondary" />)
    svg = screen.getByRole('status').querySelector('svg')
    expect(svg).toHaveClass('text-secondary-600')

    rerender(<LoadingSpinner color="white" />)
    svg = screen.getByRole('status').querySelector('svg')
    expect(svg).toHaveClass('text-white')
  })

  it('renders with custom label', () => {
    render(<LoadingSpinner label="Processing..." />)
    
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveAttribute('aria-label', 'Processing...')
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-spinner" />)
    
    expect(screen.getByRole('status')).toHaveClass('custom-spinner')
  })
})

describe('LoadingOverlay', () => {
  it('renders with default props', () => {
    render(<LoadingOverlay />)
    
    const overlay = screen.getByRole('status').closest('div')
    expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50', 'bg-white', 'bg-opacity-90')
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders with custom message', () => {
    render(<LoadingOverlay message="Saving data..." />)
    
    expect(screen.getByText('Saving data...')).toBeInTheDocument()
  })

  it('renders with transparent background', () => {
    render(<LoadingOverlay transparent={true} />)
    
    const overlay = screen.getByRole('status').closest('div')
    expect(overlay).toHaveClass('bg-black', 'bg-opacity-25')
  })

  it('renders without message when empty string provided', () => {
    render(<LoadingOverlay message="" />)
    
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<LoadingOverlay className="custom-overlay" />)
    
    const overlay = screen.getByRole('status').closest('div')
    expect(overlay).toHaveClass('custom-overlay')
  })
})

describe('InlineLoading', () => {
  it('renders with default props', () => {
    render(<InlineLoading />)
    
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    
    const container = screen.getByRole('status').closest('div')
    expect(container).toHaveClass('py-4')
  })

  it('renders with custom message', () => {
    render(<InlineLoading message="Fetching data..." />)
    
    expect(screen.getByText('Fetching data...')).toBeInTheDocument()
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<InlineLoading size="sm" />)
    let container = screen.getByRole('status').closest('div')
    expect(container).toHaveClass('py-2')
    expect(screen.getByText('Loading...')).toHaveClass('text-xs')

    rerender(<InlineLoading size="md" />)
    container = screen.getByRole('status').closest('div')
    expect(container).toHaveClass('py-4')
    expect(screen.getByText('Loading...')).toHaveClass('text-sm')

    rerender(<InlineLoading size="lg" />)
    container = screen.getByRole('status').closest('div')
    expect(container).toHaveClass('py-8')
    expect(screen.getByText('Loading...')).toHaveClass('text-base')
  })

  it('applies custom className', () => {
    render(<InlineLoading className="custom-inline" />)
    
    const container = screen.getByRole('status').closest('div')
    expect(container).toHaveClass('custom-inline')
  })
})