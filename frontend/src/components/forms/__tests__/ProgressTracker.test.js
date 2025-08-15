import { render, screen } from '@testing-library/react'
import ProgressTracker from '../ProgressTracker'

describe('ProgressTracker', () => {
  const defaultProps = {
    currentStep: 1,
    completedSteps: [false, false]
  }

  it('renders progress tracker with default step labels', () => {
    render(<ProgressTracker {...defaultProps} />)
    
    expect(screen.getAllByText('Aadhaar Verification')).toHaveLength(2) // Desktop and mobile (current step)
    expect(screen.getByText('PAN & Personal Details')).toBeInTheDocument() // Desktop only (not current step)
  })

  it('highlights current step correctly', () => {
    render(<ProgressTracker {...defaultProps} currentStep={1} />)
    
    const step1 = screen.getByText('1')
    expect(step1.closest('div')).toHaveClass('bg-primary-600')
  })

  it('shows completed steps with checkmark', () => {
    render(
      <ProgressTracker 
        {...defaultProps} 
        currentStep={2} 
        completedSteps={[true, false]} 
      />
    )
    
    // Step 1 should show checkmark (SVG path)
    const checkmarkPath = document.querySelector('path[d*="16.707 5.293"]')
    expect(checkmarkPath).toBeInTheDocument()
  })

  it('displays mobile step information', () => {
    render(<ProgressTracker {...defaultProps} currentStep={1} />)
    
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    expect(screen.getAllByText('Aadhaar Verification')).toHaveLength(2) // Desktop and mobile
  })

  it('uses custom step labels when provided', () => {
    const customLabels = ['Custom Step 1', 'Custom Step 2']
    render(
      <ProgressTracker 
        {...defaultProps} 
        stepLabels={customLabels} 
      />
    )
    
    expect(screen.getAllByText('Custom Step 1')).toHaveLength(2) // Desktop and mobile (current step)
    expect(screen.getByText('Custom Step 2')).toBeInTheDocument() // Desktop only (not current step)
  })

  it('shows connector line between steps', () => {
    render(<ProgressTracker {...defaultProps} />)
    
    // Check for connector line (hidden on mobile, visible on desktop)
    const connectors = document.querySelectorAll('.w-16.h-0\\.5')
    expect(connectors).toHaveLength(1)
  })

  it('applies correct styling for completed steps', () => {
    render(
      <ProgressTracker 
        {...defaultProps} 
        currentStep={2} 
        completedSteps={[true, false]} 
      />
    )
    
    // First step should have success styling (check for SVG instead of number)
    const successContainer = document.querySelector('.bg-success-600.border-success-600')
    expect(successContainer).toBeInTheDocument()
    
    // Connector should be green for completed step
    const connector = document.querySelector('.bg-success-600.w-16')
    expect(connector).toBeInTheDocument()
  })
})