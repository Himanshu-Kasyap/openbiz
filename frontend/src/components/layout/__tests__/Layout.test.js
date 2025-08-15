import { render, screen } from '@testing-library/react'
import Layout from '../Layout'

describe('Layout Component', () => {
  it('renders children correctly', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )
    
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders with default title', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )
    
    expect(document.title).toBe('Udyam Registration')
  })

  it('renders with custom title', () => {
    render(
      <Layout title="Custom Title">
        <div>Content</div>
      </Layout>
    )
    
    expect(document.title).toBe('Custom Title')
  })

  it('renders header by default', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )
    
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('hides header when showHeader is false', () => {
    render(
      <Layout showHeader={false}>
        <div>Content</div>
      </Layout>
    )
    
    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
  })

  it('renders footer by default', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )
    
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('hides footer when showFooter is false', () => {
    render(
      <Layout showFooter={false}>
        <div>Content</div>
      </Layout>
    )
    
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  })

  it('applies correct CSS classes for responsive layout', () => {
    const { container } = render(
      <Layout>
        <div>Content</div>
      </Layout>
    )
    
    const layoutDiv = container.querySelector('div.min-h-screen')
    expect(layoutDiv).toHaveClass('min-h-screen', 'flex', 'flex-col', 'bg-gray-50')
  })

  it('sets meta description correctly', () => {
    render(
      <Layout description="Custom description">
        <div>Content</div>
      </Layout>
    )
    
    const metaDescription = document.querySelector('meta[name="description"]')
    expect(metaDescription).toHaveAttribute('content', 'Custom description')
  })
})