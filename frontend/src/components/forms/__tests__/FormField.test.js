import { render, screen } from '@testing-library/react'
import FormField from '../FormField'

describe('FormField', () => {
  it('renders children correctly', () => {
    render(
      <FormField>
        <input data-testid="test-input" />
      </FormField>
    )
    
    expect(screen.getByTestId('test-input')).toBeInTheDocument()
  })

  it('renders label when provided', () => {
    render(
      <FormField label="Test Label">
        <input />
      </FormField>
    )
    
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('shows required indicator when required is true', () => {
    render(
      <FormField label="Test Label" required>
        <input />
      </FormField>
    )
    
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('renders error message when error is provided', () => {
    const errorMessage = 'This field is required'
    render(
      <FormField error={errorMessage}>
        <input />
      </FormField>
    )
    
    const errorElement = screen.getByRole('alert')
    expect(errorElement).toBeInTheDocument()
    expect(errorElement).toHaveTextContent(errorMessage)
  })

  it('renders help text when provided and no error', () => {
    const helpText = 'This is help text'
    render(
      <FormField helpText={helpText}>
        <input />
      </FormField>
    )
    
    expect(screen.getByText(helpText)).toBeInTheDocument()
  })

  it('does not render help text when error is present', () => {
    const helpText = 'This is help text'
    const errorMessage = 'This field is required'
    render(
      <FormField helpText={helpText} error={errorMessage}>
        <input />
      </FormField>
    )
    
    expect(screen.queryByText(helpText)).not.toBeInTheDocument()
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('applies disabled styles to label when disabled', () => {
    render(
      <FormField label="Test Label" disabled>
        <input />
      </FormField>
    )
    
    const label = screen.getByText('Test Label')
    expect(label).toHaveClass('text-gray-400')
  })

  it('applies error styles to label when error is present', () => {
    render(
      <FormField label="Test Label" error="Error message">
        <input />
      </FormField>
    )
    
    const label = screen.getByText('Test Label')
    expect(label).toHaveClass('text-error-700')
  })

  it('supports function children with render props', () => {
    render(
      <FormField label="Test Label">
        {({ id, error, disabled }) => (
          <input 
            data-testid="test-input" 
            id={id}
            data-error={error}
            data-disabled={disabled}
          />
        )}
      </FormField>
    )
    
    const input = screen.getByTestId('test-input')
    expect(input).toHaveAttribute('id')
    expect(input).toHaveAttribute('data-error', 'false')
    expect(input).toHaveAttribute('data-disabled', 'false')
  })

  it('passes error state to function children', () => {
    render(
      <FormField label="Test Label" error="Error message">
        {({ error }) => (
          <input 
            data-testid="test-input" 
            data-error={error}
          />
        )}
      </FormField>
    )
    
    const input = screen.getByTestId('test-input')
    expect(input).toHaveAttribute('data-error', 'true')
  })

  it('passes disabled state to function children', () => {
    render(
      <FormField label="Test Label" disabled>
        {({ disabled }) => (
          <input 
            data-testid="test-input" 
            data-disabled={disabled}
          />
        )}
      </FormField>
    )
    
    const input = screen.getByTestId('test-input')
    expect(input).toHaveAttribute('data-disabled', 'true')
  })

  it('applies custom className', () => {
    const { container } = render(
      <FormField className="custom-class">
        <input />
      </FormField>
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('generates unique id when not provided', () => {
    render(
      <FormField label="Test Label">
        {({ id }) => (
          <input data-testid="test-input" id={id} />
        )}
      </FormField>
    )
    
    const input = screen.getByTestId('test-input')
    expect(input).toHaveAttribute('id')
    expect(input.id).toMatch(/^field-/)
  })

  it('uses provided id when given', () => {
    render(
      <FormField label="Test Label" id="custom-id">
        {({ id }) => (
          <input data-testid="test-input" id={id} />
        )}
      </FormField>
    )
    
    const input = screen.getByTestId('test-input')
    expect(input).toHaveAttribute('id', 'custom-id')
  })
})