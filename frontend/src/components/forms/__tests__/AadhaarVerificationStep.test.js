import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AadhaarVerificationStep from '../AadhaarVerificationStep'

// Mock the validation utilities
jest.mock('../../../utils/validation', () => ({
  validators: {
    isValidAadhaar: jest.fn(),
    isValidOTP: jest.fn(),
    cleanNumeric: jest.fn((value) => value.replace(/\D/g, ''))
  }
}))

const { validators } = require('../../../utils/validation')

describe('AadhaarVerificationStep', () => {
  const defaultProps = {
    formData: {},
    onDataChange: jest.fn(),
    onStepComplete: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    validators.isValidAadhaar.mockReturnValue(false)
    validators.isValidOTP.mockReturnValue(false)
  })

  it('renders step header and Aadhaar input', () => {
    render(<AadhaarVerificationStep {...defaultProps} />)
    
    expect(screen.getByText('Aadhaar Verification')).toBeInTheDocument()
    expect(screen.getByText('Verify your identity using your 12-digit Aadhaar number')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter 12-digit Aadhaar number')).toBeInTheDocument()
  })

  it('calls onDataChange when Aadhaar number changes', async () => {
    const user = userEvent.setup()
    render(<AadhaarVerificationStep {...defaultProps} />)
    
    const aadhaarInput = screen.getByPlaceholderText('Enter 12-digit Aadhaar number')
    await user.type(aadhaarInput, '123456789012')
    
    expect(defaultProps.onDataChange).toHaveBeenCalledWith({
      aadhaarNumber: '123456789012',
      otp: ''
    })
  })

  it('shows Send OTP button when Aadhaar is valid', () => {
    validators.isValidAadhaar.mockReturnValue(true)
    
    render(
      <AadhaarVerificationStep 
        {...defaultProps} 
        formData={{ aadhaarNumber: '123456789012' }} 
      />
    )
    
    expect(screen.getByText('Send OTP')).toBeInTheDocument()
  })

  it('sends OTP and shows OTP input section', async () => {
    validators.isValidAadhaar.mockReturnValue(true)
    
    render(
      <AadhaarVerificationStep 
        {...defaultProps} 
        formData={{ aadhaarNumber: '123456789012' }} 
      />
    )
    
    const sendOtpButton = screen.getByText('Send OTP')
    fireEvent.click(sendOtpButton)
    
    // Should show loading state
    expect(screen.getByText('Send OTP')).toBeDisabled()
    
    // Wait for OTP section to appear
    await waitFor(() => {
      expect(screen.getByText('OTP has been sent to your registered mobile number')).toBeInTheDocument()
    })
    
    expect(screen.getByPlaceholderText('Enter 6-digit OTP')).toBeInTheDocument()
  })

  it('verifies OTP and completes step', async () => {
    validators.isValidAadhaar.mockReturnValue(true)
    validators.isValidOTP.mockReturnValue(true)
    
    render(
      <AadhaarVerificationStep 
        {...defaultProps} 
        formData={{ 
          aadhaarNumber: '123456789012',
          otp: '123456'
        }} 
      />
    )
    
    // Simulate OTP already sent
    const sendOtpButton = screen.getByText('Send OTP')
    fireEvent.click(sendOtpButton)
    
    await waitFor(() => {
      expect(screen.getByText('Verify OTP')).toBeInTheDocument()
    })
    
    const verifyButton = screen.getByText('Verify OTP')
    fireEvent.click(verifyButton)
    
    await waitFor(() => {
      expect(screen.getByText('Aadhaar verification completed successfully!')).toBeInTheDocument()
    })
    
    expect(defaultProps.onStepComplete).toHaveBeenCalledWith({
      aadhaarNumber: '123456789012',
      otp: '123456',
      stepCompleted: true
    })
  })

  it('auto-verifies OTP when 6 digits are entered', async () => {
    validators.isValidAadhaar.mockReturnValue(true)
    validators.isValidOTP.mockReturnValue(true)
    
    const user = userEvent.setup()
    render(
      <AadhaarVerificationStep 
        {...defaultProps} 
        formData={{ aadhaarNumber: '123456789012' }} 
      />
    )
    
    // Send OTP first
    const sendOtpButton = screen.getByText('Send OTP')
    fireEvent.click(sendOtpButton)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter 6-digit OTP')).toBeInTheDocument()
    })
    
    // Enter complete OTP
    const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP')
    await user.type(otpInput, '123456')
    
    // Should auto-verify after a delay
    await waitFor(() => {
      expect(defaultProps.onStepComplete).toHaveBeenCalled()
    }, { timeout: 2000 })
  })

  it('shows resend OTP option', async () => {
    validators.isValidAadhaar.mockReturnValue(true)
    
    render(
      <AadhaarVerificationStep 
        {...defaultProps} 
        formData={{ aadhaarNumber: '123456789012' }} 
      />
    )
    
    const sendOtpButton = screen.getByText('Send OTP')
    fireEvent.click(sendOtpButton)
    
    await waitFor(() => {
      expect(screen.getByText("Didn't receive OTP? Resend")).toBeInTheDocument()
    })
  })

  it('disables inputs when step is disabled', () => {
    render(<AadhaarVerificationStep {...defaultProps} disabled />)
    
    const aadhaarInput = screen.getByLabelText('Aadhaar Number')
    expect(aadhaarInput).toBeDisabled()
  })

  it('displays errors correctly', () => {
    const errors = { aadhaarNumber: 'Invalid Aadhaar number' }
    render(<AadhaarVerificationStep {...defaultProps} errors={errors} />)
    
    expect(screen.getByText('Invalid Aadhaar number')).toBeInTheDocument()
  })

  it('shows loading overlay when isLoading is true', () => {
    render(<AadhaarVerificationStep {...defaultProps} isLoading />)
    
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })

  it('clears OTP when Aadhaar number changes', async () => {
    const user = userEvent.setup()
    render(
      <AadhaarVerificationStep 
        {...defaultProps} 
        formData={{ aadhaarNumber: '123456789012', otp: '123456' }} 
      />
    )
    
    const aadhaarInput = screen.getByLabelText('Aadhaar Number')
    await user.clear(aadhaarInput)
    await user.type(aadhaarInput, '987654321098')
    
    expect(defaultProps.onDataChange).toHaveBeenCalledWith({
      aadhaarNumber: '987654321098',
      otp: ''
    })
  })
})