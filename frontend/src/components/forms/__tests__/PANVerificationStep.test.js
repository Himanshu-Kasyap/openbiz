import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PANVerificationStep from '../PANVerificationStep'

// Mock the validation utilities
jest.mock('../../../utils/validation', () => ({
  validators: {
    isValidPAN: jest.fn()
  }
}))

const { validators } = require('../../../utils/validation')

describe('PANVerificationStep', () => {
  const defaultProps = {
    formData: {},
    onDataChange: jest.fn(),
    onStepComplete: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    validators.isValidPAN.mockReturnValue(false)
  })

  it('renders step header and form fields', () => {
    render(<PANVerificationStep {...defaultProps} />)
    
    expect(screen.getByText('PAN & Personal Details')).toBeInTheDocument()
    expect(screen.getByText('Provide your PAN number and complete your personal information')).toBeInTheDocument()
    
    expect(screen.getByPlaceholderText('Enter PAN number (e.g., ABCDE1234F)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument()
    expect(screen.getByDisplayValue('')).toBeInTheDocument() // Date input
    expect(screen.getByRole('combobox')).toBeInTheDocument() // Gender select
    expect(screen.getByPlaceholderText('Enter mobile number')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter email address')).toBeInTheDocument()
  })

  it('calls onDataChange when form fields change', async () => {
    const user = userEvent.setup()
    render(<PANVerificationStep {...defaultProps} />)
    
    const panInput = screen.getByPlaceholderText('Enter PAN number (e.g., ABCDE1234F)')
    await user.type(panInput, 'ABCDE1234F')
    
    expect(defaultProps.onDataChange).toHaveBeenCalledWith({
      panNumber: 'ABCDE1234F'
    })
  })

  it('updates full name field', async () => {
    const user = userEvent.setup()
    render(<PANVerificationStep {...defaultProps} />)
    
    const nameInput = screen.getByPlaceholderText('Enter your full name')
    await user.type(nameInput, 'John Doe')
    
    expect(defaultProps.onDataChange).toHaveBeenCalledWith({
      fullName: 'John Doe'
    })
  })

  it('updates date of birth field', async () => {
    const user = userEvent.setup()
    render(<PANVerificationStep {...defaultProps} />)
    
    const dobInput = screen.getByDisplayValue('') // Date input
    await user.type(dobInput, '1990-01-01')
    
    expect(defaultProps.onDataChange).toHaveBeenCalledWith({
      dateOfBirth: '1990-01-01'
    })
  })

  it('updates gender field', async () => {
    const user = userEvent.setup()
    render(<PANVerificationStep {...defaultProps} />)
    
    const genderSelect = screen.getByRole('combobox')
    await user.selectOptions(genderSelect, 'male')
    
    expect(defaultProps.onDataChange).toHaveBeenCalledWith({
      gender: 'male'
    })
  })

  it('updates mobile number field', async () => {
    const user = userEvent.setup()
    render(<PANVerificationStep {...defaultProps} />)
    
    const mobileInput = screen.getByPlaceholderText('Enter mobile number')
    await user.type(mobileInput, '9876543210')
    
    expect(defaultProps.onDataChange).toHaveBeenCalledWith({
      mobileNumber: '9876543210'
    })
  })

  it('updates email field', async () => {
    const user = userEvent.setup()
    render(<PANVerificationStep {...defaultProps} />)
    
    const emailInput = screen.getByPlaceholderText('Enter email address')
    await user.type(emailInput, 'john@example.com')
    
    expect(defaultProps.onDataChange).toHaveBeenCalledWith({
      email: 'john@example.com'
    })
  })

  it('disables submit button when form is incomplete', () => {
    render(<PANVerificationStep {...defaultProps} />)
    
    const submitButton = screen.getByText('Complete Step 2')
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when all required fields are filled', () => {
    validators.isValidPAN.mockReturnValue(true)
    
    const completeFormData = {
      panNumber: 'ABCDE1234F',
      fullName: 'John Doe',
      dateOfBirth: '1990-01-01',
      gender: 'male'
    }
    
    render(
      <PANVerificationStep 
        {...defaultProps} 
        formData={completeFormData} 
      />
    )
    
    const submitButton = screen.getByText('Complete Step 2')
    expect(submitButton).not.toBeDisabled()
  })

  it('submits form and calls onStepComplete', async () => {
    validators.isValidPAN.mockReturnValue(true)
    
    const completeFormData = {
      panNumber: 'ABCDE1234F',
      fullName: 'John Doe',
      dateOfBirth: '1990-01-01',
      gender: 'male'
    }
    
    render(
      <PANVerificationStep 
        {...defaultProps} 
        formData={completeFormData} 
      />
    )
    
    const submitButton = screen.getByText('Complete Step 2')
    fireEvent.click(submitButton)
    
    // Should show loading state
    expect(submitButton).toBeDisabled()
    
    await waitFor(() => {
      expect(defaultProps.onStepComplete).toHaveBeenCalledWith({
        ...completeFormData,
        stepCompleted: true
      })
    })
  })

  it('prevents submission with invalid PAN', async () => {
    validators.isValidPAN.mockReturnValue(false)
    
    const formDataWithInvalidPAN = {
      panNumber: 'INVALID',
      fullName: 'John Doe',
      dateOfBirth: '1990-01-01',
      gender: 'male'
    }
    
    render(
      <PANVerificationStep 
        {...defaultProps} 
        formData={formDataWithInvalidPAN} 
      />
    )
    
    const submitButton = screen.getByText('Complete Step 2')
    expect(submitButton).toBeDisabled()
  })

  it('prevents submission with missing required fields', async () => {
    validators.isValidPAN.mockReturnValue(true)
    
    const incompleteFormData = {
      panNumber: 'ABCDE1234F',
      fullName: 'John Doe'
      // Missing dateOfBirth and gender
    }
    
    render(
      <PANVerificationStep 
        {...defaultProps} 
        formData={incompleteFormData} 
      />
    )
    
    const submitButton = screen.getByText('Complete Step 2')
    expect(submitButton).toBeDisabled()
  })

  it('displays errors correctly', () => {
    const errors = { 
      panNumber: 'Invalid PAN number',
      fullName: 'Name is required'
    }
    
    render(<PANVerificationStep {...defaultProps} errors={errors} />)
    
    expect(screen.getByText('Invalid PAN number')).toBeInTheDocument()
    expect(screen.getByText('Name is required')).toBeInTheDocument()
  })

  it('disables all inputs when step is disabled', () => {
    render(<PANVerificationStep {...defaultProps} disabled />)
    
    expect(screen.getByPlaceholderText('Enter PAN number (e.g., ABCDE1234F)')).toBeDisabled()
    expect(screen.getByPlaceholderText('Enter your full name')).toBeDisabled()
    expect(screen.getByDisplayValue('')).toBeDisabled() // Date input
    expect(screen.getByRole('combobox')).toBeDisabled() // Gender select
    expect(screen.getByPlaceholderText('Enter mobile number')).toBeDisabled()
    expect(screen.getByPlaceholderText('Enter email address')).toBeDisabled()
  })

  it('shows loading overlay when isLoading is true', () => {
    render(<PANVerificationStep {...defaultProps} isLoading />)
    
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })

  it('formats mobile number input correctly', () => {
    render(<PANVerificationStep {...defaultProps} />)
    
    const mobileInput = screen.getByPlaceholderText('Enter mobile number')
    expect(mobileInput).toHaveAttribute('maxLength', '10')
    expect(mobileInput).toHaveAttribute('inputMode', 'numeric')
    
    // Check for +91 prefix display
    expect(screen.getByText('+91')).toBeInTheDocument()
  })

  it('sets maximum date for date of birth to today', () => {
    render(<PANVerificationStep {...defaultProps} />)
    
    const dobInput = screen.getByDisplayValue('') // Date input with empty value
    const today = new Date().toISOString().split('T')[0]
    expect(dobInput).toHaveAttribute('max', today)
  })

  it('renders gender options correctly', () => {
    render(<PANVerificationStep {...defaultProps} />)
    
    const genderSelect = screen.getByRole('combobox')
    expect(genderSelect).toBeInTheDocument()
    
    expect(screen.getByText('Select Gender')).toBeInTheDocument()
    expect(screen.getByText('Male')).toBeInTheDocument()
    expect(screen.getByText('Female')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })
})