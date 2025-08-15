import { render, screen, fireEvent } from '@testing-library/react'
import { 
  Form, 
  FormSection, 
  FormRow, 
  FormGroup, 
  FormActions, 
  FormField 
} from '../Form'

describe('Form Components', () => {
  describe('Form', () => {
    it('renders children correctly', () => {
      render(
        <Form>
          <div>Form content</div>
        </Form>
      )
      
      expect(screen.getByText('Form content')).toBeInTheDocument()
    })

    it('calls onSubmit when form is submitted', () => {
      const handleSubmit = jest.fn()
      
      render(
        <Form onSubmit={handleSubmit}>
          <button type="submit">Submit</button>
        </Form>
      )
      
      fireEvent.click(screen.getByRole('button', { name: /submit/i }))
      expect(handleSubmit).toHaveBeenCalled()
    })

    it('applies custom className', () => {
      const { container } = render(
        <Form className="custom-form">
          <div>Content</div>
        </Form>
      )
      
      expect(container.firstChild).toHaveClass('custom-form')
    })

    it('applies default spacing classes', () => {
      const { container } = render(
        <Form>
          <div>Content</div>
        </Form>
      )
      
      expect(container.firstChild).toHaveClass('space-y-6')
    })
  })

  describe('FormSection', () => {
    it('renders children without title or description', () => {
      render(
        <FormSection>
          <div>Section content</div>
        </FormSection>
      )
      
      expect(screen.getByText('Section content')).toBeInTheDocument()
    })

    it('renders title when provided', () => {
      render(
        <FormSection title="Section Title">
          <div>Section content</div>
        </FormSection>
      )
      
      expect(screen.getByRole('heading', { name: /section title/i })).toBeInTheDocument()
    })

    it('renders description when provided', () => {
      render(
        <FormSection description="Section description">
          <div>Section content</div>
        </FormSection>
      )
      
      expect(screen.getByText('Section description')).toBeInTheDocument()
    })

    it('renders both title and description', () => {
      render(
        <FormSection title="Section Title" description="Section description">
          <div>Section content</div>
        </FormSection>
      )
      
      expect(screen.getByRole('heading', { name: /section title/i })).toBeInTheDocument()
      expect(screen.getByText('Section description')).toBeInTheDocument()
    })
  })

  describe('FormRow', () => {
    it('renders children in grid layout', () => {
      const { container } = render(
        <FormRow>
          <div>Field 1</div>
          <div>Field 2</div>
        </FormRow>
      )
      
      expect(container.firstChild).toHaveClass('grid', 'grid-cols-1', 'sm:grid-cols-2')
      expect(screen.getByText('Field 1')).toBeInTheDocument()
      expect(screen.getByText('Field 2')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <FormRow className="custom-row">
          <div>Content</div>
        </FormRow>
      )
      
      expect(container.firstChild).toHaveClass('custom-row')
    })
  })

  describe('FormGroup', () => {
    it('renders children without label', () => {
      render(
        <FormGroup>
          <input type="text" />
        </FormGroup>
      )
      
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('renders label when provided', () => {
      render(
        <FormGroup label="Field Label">
          <input type="text" />
        </FormGroup>
      )
      
      expect(screen.getByText('Field Label')).toBeInTheDocument()
    })

    it('shows required indicator when required', () => {
      render(
        <FormGroup label="Required Field" required>
          <input type="text" />
        </FormGroup>
      )
      
      expect(screen.getByText('*')).toBeInTheDocument()
    })

    it('displays error message when provided', () => {
      render(
        <FormGroup error="This field is required">
          <input type="text" />
        </FormGroup>
      )
      
      const errorMessage = screen.getByRole('alert')
      expect(errorMessage).toHaveTextContent('This field is required')
    })

    it('displays help text when provided and no error', () => {
      render(
        <FormGroup helpText="Enter your name">
          <input type="text" />
        </FormGroup>
      )
      
      expect(screen.getByText('Enter your name')).toBeInTheDocument()
    })

    it('hides help text when error is present', () => {
      render(
        <FormGroup helpText="Enter your name" error="This field is required">
          <input type="text" />
        </FormGroup>
      )
      
      expect(screen.queryByText('Enter your name')).not.toBeInTheDocument()
      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })
  })

  describe('FormActions', () => {
    it('renders children correctly', () => {
      render(
        <FormActions>
          <button>Cancel</button>
          <button>Submit</button>
        </FormActions>
      )
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
    })

    it('applies alignment classes correctly', () => {
      const { container } = render(
        <FormActions align="center">
          <button>Submit</button>
        </FormActions>
      )
      
      expect(container.firstChild).toHaveClass('justify-center')
    })

    it('applies sticky classes when sticky is true', () => {
      const { container } = render(
        <FormActions sticky>
          <button>Submit</button>
        </FormActions>
      )
      
      expect(container.firstChild).toHaveClass('sticky', 'bottom-0')
    })

    it('applies border and padding classes', () => {
      const { container } = render(
        <FormActions>
          <button>Submit</button>
        </FormActions>
      )
      
      expect(container.firstChild).toHaveClass('pt-6', 'border-t', 'border-gray-200')
    })
  })

  describe('FormField', () => {
    it('renders children with full width by default', () => {
      const { container } = render(
        <FormField>
          <input type="text" />
        </FormField>
      )
      
      expect(container.firstChild).toHaveClass('col-span-full')
    })

    it('applies width classes correctly', () => {
      const { container } = render(
        <FormField width="half">
          <input type="text" />
        </FormField>
      )
      
      expect(container.firstChild).toHaveClass('col-span-full', 'sm:col-span-6')
    })

    it('applies custom className', () => {
      const { container } = render(
        <FormField className="custom-field">
          <input type="text" />
        </FormField>
      )
      
      expect(container.firstChild).toHaveClass('custom-field')
    })
  })
})