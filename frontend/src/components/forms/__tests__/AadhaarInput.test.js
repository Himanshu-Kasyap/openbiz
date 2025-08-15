import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AadhaarInput from '../AadhaarInput'

describe('AadhaarInput', () => {
  it('renders with default props', () => {
    render(<AadhaarInput />)
    
    expect(screen.getByLabelText(/aadhaar number/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter 12-digit aadhaar number/i)).toBeInTheDocument()
  })

  it('accepts only numeric input', async () => {
    const user = userEvent.setup()
    const mockOnChange = jest.fn()
    
    render(<AadhaarInput onChange={mockOnChange} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'abc123def456')
    
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: '123456'
        })
      })
    )
  })

  it('limits input to 12 digits', async () => {
    const user = userEvent.setup()
    const mockOnChange = jest.fn()
    
    render(<AadhaarInput onChange={mockOnChange} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '1234567890123456')
    
    expect(mockOnChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: '123456789012'
        })
      })
    )
  })

  it('shows validation error for invalid Aadhaar', async () => {
    const user = userEvent.setup()
    
    render(<AadhaarInput />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '12345')
    await user.tab() // Trigger blur
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid 12-digit aadhaar number/i)).toBeInTheDocument()
    })
  })

  it('shows success indicator for valid Aadhaar', async () => {
    const user = userEvent.setup()
    
    render(<AadhaarInput />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '123456789012')
    await user.tab() // Trigger blur
    
    await waitFor(() => {
      const successIcon = screen.getByRole('textbox').parentElement.querySelector('svg')
      expect(successIcon).toHaveClass('text-success-500')
    })
  })

  it('formats Aadhaar number when not focused and showFormatted is true', async () => {
    const user = userEvent.setup()
    
    render(<AadhaarInput showFormatted={true} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '123456789012')
    await user.tab() // Trigger blur
    
    await waitFor(() => {
      expect(input.value).toBe('1234 5678 9012')
    })
  })

  it('shows raw value when focused even with showFormatted true', async () => {
    const user = userEvent.setup()
    
    render(<AadhaarInput showFormatted={true} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '123456789012')
    await user.tab() // Trigger blur to format
    await user.click(input) // Focus again
    
    await waitFor(() => {
      expect(input.value).toBe('123456789012')
    })
  })

  it('does not format when showFormatted is false', async () => {
    const user = userEvent.setup()
    
    render(<AadhaarInput showFormatted={false} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '123456789012')
    await user.tab() // Trigger blur
    
    expect(input.value).toBe('123456789012')
  })

  it('displays custom error message', () => {
    const errorMessage = 'Custom error message'
    render(<AadhaarInput error={errorMessage} />)
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('shows required indicator when required is true', () => {
    render(<AadhaarInput required={true} />)
    
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    render(<AadhaarInput disabled={true} />)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('calls onBlur when input loses focus', async () => {
    const user = userEvent.setup()
    const mockOnBlur = jest.fn()
    
    render(<AadhaarInput onBlur={mockOnBlur} />)
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.tab()
    
    expect(mockOnBlur).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    const { container } = render(<AadhaarInput className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = { current: null }
    render(<AadhaarInput ref={ref} />)
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('shows help text when provided', () => {
    const helpText = 'Custom help text'
    render(<AadhaarInput helpText={helpText} />)
    
    expect(screen.getByText(helpText)).toBeInTheDocument()
  })

  it('prioritizes error over help text', () => {
    const helpText = 'Help text'
    const errorMessage = 'Error message'
    
    render(<AadhaarInput helpText={helpText} error={errorMessage} />)
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.queryByText(helpText)).not.toBeInTheDocument()
  })

  it('handles paste events correctly', async () => {
    const user = userEvent.setup()
    const mockOnChange = jest.fn()
    
    render(<AadhaarInput onChange={mockOnChange} />)
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.paste('abc123456789012def')
    
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: '123456789012'
        })
      })
    )
  })

  it('maintains controlled component behavior', async () => {
    const user = userEvent.setup()
    let value = ''
    const mockOnChange = jest.fn((e) => {
      value = e.target.value
    })
    
    const { rerender } = render(<AadhaarInput value={value} onChange={mockOnChange} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '123')
    
    // Rerender with updated value
    rerender(<AadhaarInput value={value} onChange={mockOnChange} />)
    
    expect(input.value).toBe('123')
  })
})