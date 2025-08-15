import { render, screen, fireEvent } from '@testing-library/react'
import Input from '../Input'

describe('Input Component', () => {
  it('renders input correctly', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('renders with label', () => {
    render(<Input label="Email Address" />)
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
  })

  it('shows required indicator', () => {
    render(<Input label="Required Field" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('displays error message', () => {
    render(<Input error="This field is required" />)
    expect(screen.getByRole('alert')).toHaveTextContent('This field is required')
  })

  it('displays help text when no error', () => {
    render(<Input helpText="Enter your email address" />)
    expect(screen.getByText('Enter your email address')).toBeInTheDocument()
  })

  it('hides help text when error is present', () => {
    render(<Input helpText="Help text" error="Error message" />)
    expect(screen.queryByText('Help text')).not.toBeInTheDocument()
    expect(screen.getByText('Error message')).toBeInTheDocument()
  })

  it('applies error styling', () => {
    render(<Input error="Error message" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-error-300', 'text-error-900')
  })

  it('applies normal styling when no error', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-gray-300', 'text-gray-900')
  })

  it('handles disabled state', () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('bg-gray-50', 'cursor-not-allowed')
  })

  it('applies size classes correctly', () => {
    const { rerender } = render(<Input size="sm" />)
    let input = screen.getByRole('textbox')
    expect(input).toHaveClass('px-3', 'py-1.5', 'text-sm')

    rerender(<Input size="lg" />)
    input = screen.getByRole('textbox')
    expect(input).toHaveClass('px-4', 'py-3', 'text-base')
  })

  it('sets correct input type', () => {
    render(<Input type="email" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
  })

  it('handles change events', () => {
    const handleChange = jest.fn()
    render(<Input onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test value' } })
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('applies custom className to container', () => {
    const { container } = render(<Input className="custom-input" />)
    expect(container.firstChild).toHaveClass('custom-input')
  })

  it('generates unique id when not provided', () => {
    render(<Input label="Test Label" />)
    const input = screen.getByRole('textbox')
    const label = screen.getByText('Test Label')
    
    expect(input).toHaveAttribute('id')
    expect(label).toHaveAttribute('for', input.getAttribute('id'))
  })

  it('uses provided id', () => {
    render(<Input id="custom-id" label="Test Label" />)
    const input = screen.getByRole('textbox')
    const label = screen.getByText('Test Label')
    
    expect(input).toHaveAttribute('id', 'custom-id')
    expect(label).toHaveAttribute('for', 'custom-id')
  })

  it('forwards ref correctly', () => {
    const ref = { current: null }
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})