import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PANInput from '../PANInput'

describe('PANInput', () => {
  it('renders with default props', () => {
    render(<PANInput />)
    
    expect(screen.getByLabelText(/pan number/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter pan number/i)).toBeInTheDocument()
  })

  it('accepts only alphanumeric input', async () => {
    const user = userEvent.setup()
    const mockOnChange = jest.fn()
    
    render(<PANInput onChange={mockOnChange} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'ABC@#123$%F')
    
    expect(mockOnChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: 'ABC123F'
        })
      })
    )
  })

  it('limits input to 10 characters', async () => {
    const user = userEvent.setup()
    const mockOnChange = jest.fn()
    
    render(<PANInput onChange={mockOnChange} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'ABCDE1234FGHIJ')
    
    expect(mockOnChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: 'ABCDE1234F'
        })
      })
    )
  })

  it('auto-converts to uppercase when autoUppercase is true', async () => {
    const user = userEvent.setup()
    const mockOnChange = jest.fn()
    
    render(<PANInput autoUppercase={true} onChange={mockOnChange} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'abcde1234f')
    
    expect(mockOnChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: 'ABCDE1234F'
        })
      })
    )
  })

  it('does not convert to uppercase when autoUppercase is false', async () => {
    const user = userEvent.setup()
    const mockOnChange = jest.fn()
    
    render(<PANInput autoUppercase={false} onChange={mockOnChange} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'abcde1234f')
    
    expect(mockOnChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: 'abcde1234f'
        })
      })
    )
  })

  it('shows validation error for invalid PAN format', async () => {
    const user = userEvent.setup()
    
    render(<PANInput />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '1234567890') // Invalid format (all numbers)
    await user.tab() // Trigger blur
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid pan number/i)).toBeInTheDocument()
    })
  })

  it('shows success indicator for valid PAN format', async () => {
    const user = userEvent.setup()
    
    render(<PANInput />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'ABCDE1234F')
    await user.tab() // Trigger blur
    
    await waitFor(() => {
      const successIcon = screen.getByRole('textbox').parentElement.querySelector('svg')
      expect(successIcon).toHaveClass('text-success-500')
    })
  })

  it('shows pattern hint when focused and empty', async () => {
    const user = userEvent.setup()
    
    render(<PANInput />)
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    
    expect(screen.getByText('ABCDE1234F')).toBeInTheDocument()
  })

  it('hides pattern hint when input has value', async () => {
    const user = userEvent.setup()
    
    render(<PANInput />)
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.type(input, 'A')
    
    expect(screen.queryByText('ABCDE1234F')).not.toBeInTheDocument()
  })

  it('shows character count indicator', async () => {
    const user = userEvent.setup()
    
    render(<PANInput />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'ABCDE')
    
    expect(screen.getByText('5/10')).toBeInTheDocument()
  })

  it('updates character count color based on validity', async () => {
    const user = userEvent.setup()
    
    render(<PANInput />)
    
    const input = screen.getByRole('textbox')
    
    // Valid PAN
    await user.type(input, 'ABCDE1234F')
    await user.tab()
    
    await waitFor(() => {
      const counter = screen.getByText('10/10')
      expect(counter).toHaveClass('text-success-500')
    })
    
    // Clear and enter invalid PAN
    await user.clear(input)
    await user.type(input, '1234567890')
    await user.tab()
    
    await waitFor(() => {
      const counter = screen.getByText('10/10')
      expect(counter).toHaveClass('text-error-500')
    })
  })

  it('displays custom error message', () => {
    const errorMessage = 'Custom error message'
    render(<PANInput error={errorMessage} />)
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('shows required indicator when required is true', () => {
    render(<PANInput required={true} />)
    
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    render(<PANInput disabled={true} />)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('calls onBlur when input loses focus', async () => {
    const user = userEvent.setup()
    const mockOnBlur = jest.fn()
    
    render(<PANInput onBlur={mockOnBlur} />)
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.tab()
    
    expect(mockOnBlur).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    const { container } = render(<PANInput className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = { current: null }
    render(<PANInput ref={ref} />)
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('shows help text when provided', () => {
    const helpText = 'Custom help text'
    render(<PANInput helpText={helpText} />)
    
    expect(screen.getByText(helpText)).toBeInTheDocument()
  })

  it('prioritizes error over help text', () => {
    const helpText = 'Help text'
    const errorMessage = 'Error message'
    
    render(<PANInput helpText={helpText} error={errorMessage} />)
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.queryByText(helpText)).not.toBeInTheDocument()
  })

  it('handles paste events correctly', async () => {
    const user = userEvent.setup()
    const mockOnChange = jest.fn()
    
    render(<PANInput onChange={mockOnChange} />)
    
    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.paste('abc@#de123$%4f')
    
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: 'ABCDE1234F'
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
    
    const { rerender } = render(<PANInput value={value} onChange={mockOnChange} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'ABC')
    
    // Rerender with updated value
    rerender(<PANInput value={value} onChange={mockOnChange} />)
    
    expect(input.value).toBe('ABC')
  })

  it('validates against correct PAN pattern', async () => {
    const user = userEvent.setup()
    
    render(<PANInput />)
    
    const input = screen.getByRole('textbox')
    
    // Test valid PAN patterns
    const validPANs = ['ABCDE1234F', 'AAAAA0000A', 'ZZZZZ9999Z']
    
    for (const pan of validPANs) {
      await user.clear(input)
      await user.type(input, pan)
      await user.tab()
      
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid pan number/i)).not.toBeInTheDocument()
      })
    }
    
    // Test invalid PAN patterns
    const invalidPANs = ['1234567890', 'ABCDEFGHIJ', 'ABCD1234EF', 'ABC1234DEF']
    
    for (const pan of invalidPANs) {
      await user.clear(input)
      await user.type(input, pan)
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid pan number/i)).toBeInTheDocument()
      })
    }
  })
})