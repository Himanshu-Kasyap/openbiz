import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/router'
import Registration from '../pages/registration'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}))

// Mock the validation utilities
jest.mock('../utils/validation', () => ({
  validators: {
    isValidAadhaar: jest.fn(),
    isValidOTP: jest.fn(),
    isValidPAN: jest.fn(),
    cleanNumeric: jest.fn((value) => value.replace(/\D/g, ''))
  }
}))

const { validators } = require('../utils/validation')

describe('Registration Workflow Integration', () => {
  const mockPush = jest.fn()
  const mockReplace = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    useRouter.mockReturnValue({
      query: {},
      push: mockPush,
      replace: mockReplace
    })
    
    // Set up default validation responses
    validators.isValidAadhaar.mockReturnValue(false)
    validators.isValidOTP.mockReturnValue(false)
    validators.isValidPAN.mockReturnValue(false)
  })

  it('renders initial registration page with step 1', () => {
    render(<Registration />)
    
    expect(screen.getByText('Udyam Registration')).toBeInTheDocument()
    expect(screen.getByText('Complete your micro, small, or medium enterprise registration')).toBeInTheDocument()
    expect(screen.getByText('Aadhaar Verification')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
  })

  it('shows progress tracker with correct current step', () => {
    render(<Registration />)
    
    // Should show step 1 as active
    const step1Indicator = screen.getByText('1')
    expect(step1Indicator.closest('div')).toHaveClass('bg-primary-600')
    
    // Step 2 should not be active
    const step2Indicator = screen.getByText('2')
    expect(step2Indicator.closest('div')).not.toHaveClass('bg-primary-600')
  })

  it('completes step 1 Aadhaar verification workflow', async () => {
    const user = userEvent.setup()
    validators.isValidAadhaar.mockReturnValue(true)
    validators.isValidOTP.mockReturnValue(true)
    
    render(<Registration />)
    
    // Enter Aadhaar number
    const aadhaarInput = screen.getByPlaceholderText('Enter 12-digit Aadhaar number')
    await user.type(aadhaarInput, '123456789012')
    
    // Send OTP
    const sendOtpButton = screen.getByText('Send OTP')
    fireEvent.click(sendOtpButton)
    
    // Wait for OTP input to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter 6-digit OTP')).toBeInTheDocument()
    })
    
    // Enter OTP
    const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP')
    await user.type(otpInput, '123456')
    
    // Should auto-verify and complete step
    await waitFor(() => {
      expect(screen.getByText('Aadhaar verification completed successfully!')).toBeInTheDocument()
    })
  })

  it('advances to step 2 after completing step 1', async () => {
    const user = userEvent.setup()
    validators.isValidAadhaar.mockReturnValue(true)
    validators.isValidOTP.mockReturnValue(true)
    
    render(<Registration />)
    
    // Complete step 1
    const aadhaarInput = screen.getByPlaceholderText('Enter 12-digit Aadhaar number')
    await user.type(aadhaarInput, '123456789012')
    
    const sendOtpButton = screen.getByText('Send OTP')
    fireEvent.click(sendOtpButton)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter 6-digit OTP')).toBeInTheDocument()
    })
    
    const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP')
    await user.type(otpInput, '123456')
    
    // Should auto-advance to step 2
    await waitFor(() => {
      expect(screen.getByText('PAN & Personal Details')).toBeInTheDocument()
    }, { timeout: 2000 })
    
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument()
  })

  it('completes step 2 PAN verification workflow', async () => {
    const user = userEvent.setup()
    validators.isValidPAN.mockReturnValue(true)
    
    // Start on step 2
    useRouter.mockReturnValue({
      query: { step: '2' },
      push: mockPush,
      replace: mockReplace
    })
    
    render(<Registration />)
    
    // Fill out PAN form
    const panInput = screen.getByPlaceholderText('Enter PAN number (e.g., ABCDE1234F)')
    await user.type(panInput, 'ABCDE1234F')
    
    const nameInput = screen.getByPlaceholderText('Enter your full name')
    await user.type(nameInput, 'John Doe')
    
    const dobInput = screen.getByDisplayValue('')
    await user.type(dobInput, '1990-01-01')
    
    const genderSelect = screen.getByRole('combobox')
    await user.selectOptions(genderSelect, 'male')
    
    // Submit step 2
    const submitButton = screen.getByText('Complete Step 2')
    expect(submitButton).not.toBeDisabled()
    
    fireEvent.click(submitButton)
    
    // Should show loading state
    expect(submitButton).toBeDisabled()
  })

  it('navigates between steps using navigation buttons', async () => {
    validators.isValidAadhaar.mockReturnValue(true)
    validators.isValidOTP.mockReturnValue(true)
    
    const user = userEvent.setup()
    render(<Registration />)
    
    // Complete step 1 first
    const aadhaarInput = screen.getByPlaceholderText('Enter 12-digit Aadhaar number')
    await user.type(aadhaarInput, '123456789012')
    
    const sendOtpButton = screen.getByText('Send OTP')
    fireEvent.click(sendOtpButton)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter 6-digit OTP')).toBeInTheDocument()
    })
    
    const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP')
    await user.type(otpInput, '123456')
    
    // Wait for step 2
    await waitFor(() => {
      expect(screen.getByText('PAN & Personal Details')).toBeInTheDocument()
    }, { timeout: 2000 })
    
    // Go back to step 1
    const previousButton = screen.getByText('Previous')
    fireEvent.click(previousButton)
    
    expect(screen.getByText('Aadhaar Verification')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
  })

  it('updates URL when navigating between steps', async () => {
    render(<Registration />)
    
    // Should update URL to include step parameter
    expect(mockReplace).toHaveBeenCalledWith('/registration?step=1', undefined, { shallow: true })
  })

  it('preserves form data when navigating between steps', async () => {
    const user = userEvent.setup()
    validators.isValidAadhaar.mockReturnValue(true)
    validators.isValidOTP.mockReturnValue(true)
    
    render(<Registration />)
    
    // Enter data in step 1
    const aadhaarInput = screen.getByPlaceholderText('Enter 12-digit Aadhaar number')
    await user.type(aadhaarInput, '123456789012')
    
    // Complete step 1 and go to step 2
    const sendOtpButton = screen.getByText('Send OTP')
    fireEvent.click(sendOtpButton)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter 6-digit OTP')).toBeInTheDocument()
    })
    
    const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP')
    await user.type(otpInput, '123456')
    
    await waitFor(() => {
      expect(screen.getByText('PAN & Personal Details')).toBeInTheDocument()
    }, { timeout: 2000 })
    
    // Go back to step 1
    const previousButton = screen.getByText('Previous')
    fireEvent.click(previousButton)
    
    // Data should be preserved
    const preservedAadhaarInput = screen.getByPlaceholderText('Enter 12-digit Aadhaar number')
    expect(preservedAadhaarInput).toHaveValue('123456789012')
  })

  it('shows error messages appropriately', () => {
    render(<Registration />)
    
    // Should not show any errors initially
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
  })

  it('completes full registration workflow', async () => {
    const user = userEvent.setup()
    validators.isValidAadhaar.mockReturnValue(true)
    validators.isValidOTP.mockReturnValue(true)
    validators.isValidPAN.mockReturnValue(true)
    
    render(<Registration />)
    
    // Complete step 1
    const aadhaarInput = screen.getByPlaceholderText('Enter 12-digit Aadhaar number')
    await user.type(aadhaarInput, '123456789012')
    
    const sendOtpButton = screen.getByText('Send OTP')
    fireEvent.click(sendOtpButton)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter 6-digit OTP')).toBeInTheDocument()
    })
    
    const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP')
    await user.type(otpInput, '123456')
    
    // Wait for step 2
    await waitFor(() => {
      expect(screen.getByText('PAN & Personal Details')).toBeInTheDocument()
    }, { timeout: 2000 })
    
    // Complete step 2
    const panInput = screen.getByPlaceholderText('Enter PAN number (e.g., ABCDE1234F)')
    await user.type(panInput, 'ABCDE1234F')
    
    const nameInput = screen.getByPlaceholderText('Enter your full name')
    await user.type(nameInput, 'John Doe')
    
    const dobInput = screen.getByDisplayValue('')
    await user.type(dobInput, '1990-01-01')
    
    const genderSelect = screen.getByRole('combobox')
    await user.selectOptions(genderSelect, 'male')
    
    const submitButton = screen.getByText('Complete Step 2')
    fireEvent.click(submitButton)
    
    // Should redirect to success page after completion
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/registration/success')
    })
  })

  it('shows help section at bottom of page', () => {
    render(<Registration />)
    
    expect(screen.getByText('Need Help?')).toBeInTheDocument()
    expect(screen.getByText('Technical Support')).toBeInTheDocument()
    expect(screen.getByText('Registration Guide')).toBeInTheDocument()
  })

  it('handles step initialization from URL query', () => {
    useRouter.mockReturnValue({
      query: { step: '2' },
      push: mockPush,
      replace: mockReplace
    })
    
    render(<Registration />)
    
    expect(screen.getByText('PAN & Personal Details')).toBeInTheDocument()
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument()
  })
})