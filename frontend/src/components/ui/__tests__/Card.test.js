import { render, screen } from '@testing-library/react'
import Card, { CardHeader, CardBody, CardFooter } from '../Card'

describe('Card Components', () => {
  describe('Card', () => {
    it('renders children correctly', () => {
      render(
        <Card>
          <div>Card Content</div>
        </Card>
      )
      expect(screen.getByText('Card Content')).toBeInTheDocument()
    })

    it('applies default classes', () => {
      const { container } = render(<Card>Content</Card>)
      const card = container.firstChild
      expect(card).toHaveClass('bg-white', 'rounded-lg', 'border', 'border-gray-200', 'shadow-sm', 'p-6')
    })

    it('applies custom className', () => {
      const { container } = render(<Card className="custom-card">Content</Card>)
      const card = container.firstChild
      expect(card).toHaveClass('custom-card')
    })

    it('removes padding when padding prop is false', () => {
      const { container } = render(<Card padding={false}>Content</Card>)
      const card = container.firstChild
      expect(card).not.toHaveClass('p-6')
    })

    it('removes shadow when shadow prop is false', () => {
      const { container } = render(<Card shadow={false}>Content</Card>)
      const card = container.firstChild
      expect(card).not.toHaveClass('shadow-sm')
    })
  })

  describe('CardHeader', () => {
    it('renders children correctly', () => {
      render(
        <CardHeader>
          <h2>Header Title</h2>
        </CardHeader>
      )
      expect(screen.getByText('Header Title')).toBeInTheDocument()
    })

    it('applies correct classes', () => {
      const { container } = render(<CardHeader>Header</CardHeader>)
      const header = container.firstChild
      expect(header).toHaveClass('px-6', 'py-4', 'border-b', 'border-gray-200')
    })

    it('applies custom className', () => {
      const { container } = render(<CardHeader className="custom-header">Header</CardHeader>)
      const header = container.firstChild
      expect(header).toHaveClass('custom-header')
    })
  })

  describe('CardBody', () => {
    it('renders children correctly', () => {
      render(
        <CardBody>
          <p>Body content</p>
        </CardBody>
      )
      expect(screen.getByText('Body content')).toBeInTheDocument()
    })

    it('applies correct classes', () => {
      const { container } = render(<CardBody>Body</CardBody>)
      const body = container.firstChild
      expect(body).toHaveClass('px-6', 'py-4')
    })

    it('applies custom className', () => {
      const { container } = render(<CardBody className="custom-body">Body</CardBody>)
      const body = container.firstChild
      expect(body).toHaveClass('custom-body')
    })
  })

  describe('CardFooter', () => {
    it('renders children correctly', () => {
      render(
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      )
      expect(screen.getByText('Action')).toBeInTheDocument()
    })

    it('applies correct classes', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>)
      const footer = container.firstChild
      expect(footer).toHaveClass('px-6', 'py-4', 'border-t', 'border-gray-200', 'bg-gray-50')
    })

    it('applies custom className', () => {
      const { container } = render(<CardFooter className="custom-footer">Footer</CardFooter>)
      const footer = container.firstChild
      expect(footer).toHaveClass('custom-footer')
    })
  })

  describe('Card with all components', () => {
    it('renders complete card structure', () => {
      render(
        <Card>
          <CardHeader>
            <h2>Card Title</h2>
          </CardHeader>
          <CardBody>
            <p>Card body content</p>
          </CardBody>
          <CardFooter>
            <button>Action Button</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card body content')).toBeInTheDocument()
      expect(screen.getByText('Action Button')).toBeInTheDocument()
    })
  })
})