import { render, screen, fireEvent } from '@testing-library/react'
import FormNavigation from '../FormNavigation'

describe('FormNavigation', () => {
  const defaultProps = {
    currentStep: 1,
    totalSteps: 2,
    completedSteps: [false, false],
    onPrevious: jest.fn(),
    onNext: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders navigation buttons correctly', () => {
    render(<FormNavigation {...defaultProps} />)
    
    expect(screen.getByText('Next Step')).toBeInTheDocument()
    // Previous button should not be visible on first step
    expect(screen.queryByText('Previous')).not.toBeInTheDocument()
  })

  it('shows previous button on step 2', () => {
    render(<FormNavigation {...defaultProps} currentStep={2} />)
    
    expect(screen.getByText('Previous')).toBeInTheDocument()
    expect(screen.getByText('Next Step')).toBeInTheDocument()
  })

  it('shows complete button on last step', () => {
    render(<FormNavigation {...defaultProps} currentStep={2} />)
    
    expect(screen.getByText('Complete Registration')).toBeInTheDocument()
  })

  it('calls onNext when next button is clicked', () => {
    render(<FormNavigation {...defaultProps} canGoNext />)
    
    const nextButton = screen.getByText('Next Step')
    fireEvent.click(nextButton)
    
    expect(defaultProps.onNext).toHaveBeenCalledTimes(1)
  })

  it('calls onPrevious when previous button is clicked', () => {
    render(<FormNavigation {...defaultProps} currentStep={2} />)
    
    const previousButton = screen.getByText('Previous')
    fireEvent.click(previousButton)
    
    expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1)
  })

  it('disables next button when canGoNext is false', () => {
    render(<FormNavigation {...defaultProps} canGoNext={false} />)
    
    const nextButton = screen.getByText('Next Step')
    expect(nextButton).toBeDisabled()
  })

  it('disables previous button when canGoPrevious is false', () => {
    render(
      <FormNavigation 
        {...defaultProps} 
        currentStep={2} 
        canGoPrevious={false} 
      />
    )
    
    const previousButton = screen.getByText('Previous')
    expect(previousButton).toBeDisabled()
  })

  it('shows loading state on next button', () => {
    render(<FormNavigation {...defaultProps} isLoading />)
    
    const nextButton = screen.getByText('Next Step')
    expect(nextButton).toBeDisabled()
  })

  it('displays step progress correctly', () => {
    render(<FormNavigation {...defaultProps} />)
    
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
  })

  it('shows completed status when step is completed', () => {
    render(
      <FormNavigation 
        {...defaultProps} 
        completedSteps={[true, false]} 
      />
    )
    
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('uses custom button labels when provided', () => {
    render(
      <FormNavigation 
        {...defaultProps} 
        nextLabel="Continue"
        previousLabel="Go Back"
        currentStep={2}
      />
    )
    
    expect(screen.getByText('Continue')).toBeInTheDocument()
    expect(screen.getByText('Go Back')).toBeInTheDocument()
  })

  it('hides progress when showProgress is false', () => {
    render(<FormNavigation {...defaultProps} showProgress={false} />)
    
    expect(screen.queryByText('Step 1 of 2')).not.toBeInTheDocument()
  })

  it('renders help text correctly', () => {
    render(<FormNavigation {...defaultProps} />)
    
    expect(screen.getByText('Complete all required fields to proceed to the next step')).toBeInTheDocument()
  })

  it('shows different help text on last step', () => {
    render(<FormNavigation {...defaultProps} currentStep={2} />)
    
    expect(screen.getByText('Review your information and complete the registration')).toBeInTheDocument()
  })

  it('applies correct button styling and layout', () => {
    render(<FormNavigation {...defaultProps} currentStep={2} />)
    
    const previousButton = screen.getByText('Previous')
    const nextButton = screen.getByText('Complete Registration')
    
    // Check for proper flex layout classes
    expect(previousButton.closest('div')).toHaveClass('order-2', 'sm:order-1')
    expect(nextButton.closest('div')).toHaveClass('order-1', 'sm:order-2')
  })

  it('shows arrow icons on navigation buttons', () => {
    render(<FormNavigation {...defaultProps} currentStep={2} />)
    
    // Previous button should have left arrow
    const previousButton = screen.getByText('Previous')
    const leftArrow = previousButton.querySelector('svg')
    expect(leftArrow).toBeInTheDocument()
    
    // Next button should have right arrow (not on last step for complete button)
    const nextButton = screen.getByText('Complete Registration')
    const rightArrow = nextButton.querySelector('svg')
    expect(rightArrow).not.toBeInTheDocument() // Complete button doesn't have arrow
  })

  it('handles edge case with single step', () => {
    render(
      <FormNavigation 
        {...defaultProps} 
        totalSteps={1}
        currentStep={1}
      />
    )
    
    expect(screen.getByText('Complete Registration')).toBeInTheDocument()
    expect(screen.queryByText('Previous')).not.toBeInTheDocument()
  })

  it('disables buttons during loading state', () => {
    render(
      <FormNavigation 
        {...defaultProps} 
        currentStep={2}
        isLoading
      />
    )
    
    const previousButton = screen.getByText('Previous')
    const nextButton = screen.getByText('Complete Registration')
    
    expect(previousButton).toBeDisabled()
    expect(nextButton).toBeDisabled()
  })
})