import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OTPInput from '../OTPInput'

describe('OTPInput', () => {
  describe('Single Input Mode', () => {
    it('renders with default props', () => {
      render(<OTPInput separateInputs={false} />)
      
      expect(screen.getByLabelText(/enter otp/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/enter 6-digit otp/i)).toBeInTheDocument()
    })

    it('accepts only numeric input', async () => {
      const user = userEvent.setup()
      const mockOnChange = jest.fn()
      
      render(<OTPInput separateInputs={false} onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'abc123def')
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: '123'
          })
        })
      )
    })

    it('limits input to 6 digits', async () => {
      const user = userEvent.setup()
      const mockOnChange = jest.fn()
      
      render(<OTPInput separateInputs={false} onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, '1234567890')
      
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: '123456'
          })
        })
      )
    })

    it('calls onComplete when OTP is complete', async () => {
      const user = userEvent.setup()
      const mockOnComplete = jest.fn()
      
      render(<OTPInput separateInputs={false} onComplete={mockOnComplete} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, '123456')
      
      expect(mockOnComplete).toHaveBeenCalledWith('123456')
    })

    it('shows validation error for invalid OTP length', async () => {
      const user = userEvent.setup()
      
      render(<OTPInput separateInputs={false} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, '12345a') // Invalid character should be filtered
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid 6-digit otp/i)).toBeInTheDocument()
      })
    })

    it('shows success indicator for valid OTP', async () => {
      const user = userEvent.setup()
      
      render(<OTPInput separateInputs={false} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, '123456')
      await user.tab()
      
      await waitFor(() => {
        const successIcon = screen.getByRole('textbox').parentElement.querySelector('svg')
        expect(successIcon).toHaveClass('text-success-500')
      })
    })
  })

  describe('Separate Inputs Mode', () => {
    it('renders 6 separate input fields', () => {
      render(<OTPInput separateInputs={true} />)
      
      const inputs = screen.getAllByRole('textbox')
      expect(inputs).toHaveLength(6)
    })

    it('auto-focuses next input after entering digit', async () => {
      const user = userEvent.setup()
      
      render(<OTPInput separateInputs={true} />)
      
      const inputs = screen.getAllByRole('textbox')
      await user.type(inputs[0], '1')
      
      await waitFor(() => {
        expect(inputs[1]).toHaveFocus()
      })
    })

    it('moves to previous input on backspace when current is empty', async () => {
      const user = userEvent.setup()
      
      render(<OTPInput separateInputs={true} />)
      
      const inputs = screen.getAllByRole('textbox')
      await user.type(inputs[0], '1')
      await user.type(inputs[1], '2')
      
      // Clear second input and press backspace
      await user.clear(inputs[1])
      await user.keyboard('{Backspace}')
      
      await waitFor(() => {
        expect(inputs[0]).toHaveFocus()
      })
    })

    it('handles arrow key navigation', async () => {
      const user = userEvent.setup()
      
      render(<OTPInput separateInputs={true} />)
      
      const inputs = screen.getAllByRole('textbox')
      await user.click(inputs[2])
      
      await user.keyboard('{ArrowLeft}')
      await waitFor(() => {
        expect(inputs[1]).toHaveFocus()
      })
      
      await user.keyboard('{ArrowRight}')
      await waitFor(() => {
        expect(inputs[2]).toHaveFocus()
      })
    })

    it('handles paste operation across multiple inputs', async () => {
      const user = userEvent.setup()
      const mockOnChange = jest.fn()
      
      render(<OTPInput separateInputs={true} onChange={mockOnChange} />)
      
      const inputs = screen.getAllByRole('textbox')
      await user.click(inputs[0])
      await user.paste('123456')
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: '123456'
          })
        })
      )
    })

    it('calls onComplete when all digits are entered', async () => {
      const user = userEvent.setup()
      const mockOnComplete = jest.fn()
      
      render(<OTPInput separateInputs={true} onComplete={mockOnComplete} />)
      
      const inputs = screen.getAllByRole('textbox')
      for (let i = 0; i < 6; i++) {
        await user.type(inputs[i], (i + 1).toString())
      }
      
      expect(mockOnComplete).toHaveBeenCalledWith('123456')
    })

    it('auto-focuses first input when autoFocus is true', () => {
      render(<OTPInput separateInputs={true} autoFocus={true} />)
      
      const inputs = screen.getAllByRole('textbox')
      expect(inputs[0]).toHaveFocus()
    })

    it('limits each input to single character', async () => {
      const user = userEvent.setup()
      
      render(<OTPInput separateInputs={true} />)
      
      const inputs = screen.getAllByRole('textbox')
      await user.type(inputs[0], '123')
      
      expect(inputs[0].value).toBe('1')
    })
  })

  describe('Common Functionality', () => {
    it('displays custom error message', () => {
      const errorMessage = 'Custom error message'
      render(<OTPInput error={errorMessage} />)
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('shows required indicator when required is true', () => {
      render(<OTPInput required={true} />)
      
      expect(screen.getByText('*')).toBeInTheDocument()
    })

    it('is disabled when disabled prop is true', () => {
      render(<OTPInput disabled={true} separateInputs={false} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })

    it('disables all inputs in separate mode when disabled', () => {
      render(<OTPInput disabled={true} separateInputs={true} />)
      
      const inputs = screen.getAllByRole('textbox')
      inputs.forEach(input => {
        expect(input).toBeDisabled()
      })
    })

    it('calls onBlur when input loses focus', async () => {
      const user = userEvent.setup()
      const mockOnBlur = jest.fn()
      
      render(<OTPInput onBlur={mockOnBlur} separateInputs={false} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.tab()
      
      expect(mockOnBlur).toHaveBeenCalled()
    })

    it('applies custom className', () => {
      const { container } = render(<OTPInput className="custom-class" separateInputs={false} />)
      
      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('shows help text when provided', () => {
      const helpText = 'Custom help text'
      render(<OTPInput helpText={helpText} separateInputs={false} />)
      
      expect(screen.getByText(helpText)).toBeInTheDocument()
    })

    it('prioritizes error over help text', () => {
      const helpText = 'Help text'
      const errorMessage = 'Error message'
      
      render(<OTPInput helpText={helpText} error={errorMessage} separateInputs={false} />)
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      expect(screen.queryByText(helpText)).not.toBeInTheDocument()
    })

    it('maintains controlled component behavior', async () => {
      const user = userEvent.setup()
      let value = ''
      const mockOnChange = jest.fn((e) => {
        value = e.target.value
      })
      
      const { rerender } = render(<OTPInput value={value} onChange={mockOnChange} separateInputs={false} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, '123')
      
      rerender(<OTPInput value={value} onChange={mockOnChange} separateInputs={false} />)
      
      expect(input.value).toBe('123')
    })
  })
})