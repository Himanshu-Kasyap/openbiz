import { render, screen } from '@testing-library/react'
import { 
  Breakpoint, 
  MobileOnly, 
  TabletOnly, 
  DesktopOnly, 
  HideMobile, 
  HideDesktop,
  useIsMobile,
  useIsTablet,
  useIsDesktop
} from '../Breakpoint'

// Mock the useBreakpoint hook
jest.mock('../Responsive', () => ({
  useBreakpoint: jest.fn(),
  useMediaQuery: jest.fn(),
}))

const { useBreakpoint, useMediaQuery } = require('../Responsive')

describe('Breakpoint Component', () => {
  beforeEach(() => {
    useBreakpoint.mockReturnValue('lg')
    useMediaQuery.mockReturnValue(true)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Breakpoint', () => {
    it('renders children when no conditions specified', () => {
      render(
        <Breakpoint>
          <div>Test content</div>
        </Breakpoint>
      )
      
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('renders children when "only" condition matches', () => {
      useBreakpoint.mockReturnValue('md')
      
      render(
        <Breakpoint only="md">
          <div>Test content</div>
        </Breakpoint>
      )
      
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('does not render children when "only" condition does not match', () => {
      useBreakpoint.mockReturnValue('lg')
      
      render(
        <Breakpoint only="md">
          <div>Test content</div>
        </Breakpoint>
      )
      
      expect(screen.queryByText('Test content')).not.toBeInTheDocument()
    })

    it('renders children when "up" condition is met', () => {
      useBreakpoint.mockReturnValue('lg')
      
      render(
        <Breakpoint up="md">
          <div>Test content</div>
        </Breakpoint>
      )
      
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('does not render children when "up" condition is not met', () => {
      useBreakpoint.mockReturnValue('sm')
      
      render(
        <Breakpoint up="lg">
          <div>Test content</div>
        </Breakpoint>
      )
      
      expect(screen.queryByText('Test content')).not.toBeInTheDocument()
    })

    it('renders children when "down" condition is met', () => {
      useBreakpoint.mockReturnValue('sm')
      
      render(
        <Breakpoint down="md">
          <div>Test content</div>
        </Breakpoint>
      )
      
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('does not render children when "down" condition is not met', () => {
      useBreakpoint.mockReturnValue('xl')
      
      render(
        <Breakpoint down="md">
          <div>Test content</div>
        </Breakpoint>
      )
      
      expect(screen.queryByText('Test content')).not.toBeInTheDocument()
    })
  })

  describe('MobileOnly', () => {
    it('renders on mobile breakpoints', () => {
      useBreakpoint.mockReturnValue('sm')
      
      render(
        <MobileOnly>
          <div>Mobile content</div>
        </MobileOnly>
      )
      
      expect(screen.getByText('Mobile content')).toBeInTheDocument()
    })

    it('does not render on desktop breakpoints', () => {
      useBreakpoint.mockReturnValue('lg')
      
      render(
        <MobileOnly>
          <div>Mobile content</div>
        </MobileOnly>
      )
      
      expect(screen.queryByText('Mobile content')).not.toBeInTheDocument()
    })
  })

  describe('TabletOnly', () => {
    it('renders on tablet breakpoint', () => {
      useBreakpoint.mockReturnValue('md')
      
      render(
        <TabletOnly>
          <div>Tablet content</div>
        </TabletOnly>
      )
      
      expect(screen.getByText('Tablet content')).toBeInTheDocument()
    })

    it('does not render on other breakpoints', () => {
      useBreakpoint.mockReturnValue('lg')
      
      render(
        <TabletOnly>
          <div>Tablet content</div>
        </TabletOnly>
      )
      
      expect(screen.queryByText('Tablet content')).not.toBeInTheDocument()
    })
  })

  describe('DesktopOnly', () => {
    it('renders on desktop breakpoints', () => {
      useBreakpoint.mockReturnValue('lg')
      
      render(
        <DesktopOnly>
          <div>Desktop content</div>
        </DesktopOnly>
      )
      
      expect(screen.getByText('Desktop content')).toBeInTheDocument()
    })

    it('does not render on mobile breakpoints', () => {
      useBreakpoint.mockReturnValue('sm')
      
      render(
        <DesktopOnly>
          <div>Desktop content</div>
        </DesktopOnly>
      )
      
      expect(screen.queryByText('Desktop content')).not.toBeInTheDocument()
    })
  })

  describe('HideMobile', () => {
    it('renders on desktop breakpoints', () => {
      useBreakpoint.mockReturnValue('lg')
      
      render(
        <HideMobile>
          <div>Desktop content</div>
        </HideMobile>
      )
      
      expect(screen.getByText('Desktop content')).toBeInTheDocument()
    })

    it('does not render on mobile breakpoints', () => {
      useBreakpoint.mockReturnValue('sm')
      
      render(
        <HideMobile>
          <div>Desktop content</div>
        </HideMobile>
      )
      
      expect(screen.queryByText('Desktop content')).not.toBeInTheDocument()
    })
  })

  describe('HideDesktop', () => {
    it('renders on mobile breakpoints', () => {
      useBreakpoint.mockReturnValue('sm')
      
      render(
        <HideDesktop>
          <div>Mobile content</div>
        </HideDesktop>
      )
      
      expect(screen.getByText('Mobile content')).toBeInTheDocument()
    })

    it('does not render on desktop breakpoints', () => {
      useBreakpoint.mockReturnValue('lg')
      
      render(
        <HideDesktop>
          <div>Mobile content</div>
        </HideDesktop>
      )
      
      expect(screen.queryByText('Mobile content')).not.toBeInTheDocument()
    })
  })
})

// Test the hooks in a component
function TestComponent() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isDesktop = useIsDesktop()
  
  return (
    <div>
      <div data-testid="mobile">{isMobile ? 'mobile' : 'not-mobile'}</div>
      <div data-testid="tablet">{isTablet ? 'tablet' : 'not-tablet'}</div>
      <div data-testid="desktop">{isDesktop ? 'desktop' : 'not-desktop'}</div>
    </div>
  )
}

describe('Breakpoint Hooks', () => {
  beforeEach(() => {
    useMediaQuery.mockImplementation((breakpoint) => {
      if (breakpoint === 'md') return true
      if (breakpoint === 'lg') return false
      return false
    })
  })

  it('useIsMobile returns correct value', () => {
    render(<TestComponent />)
    expect(screen.getByTestId('mobile')).toHaveTextContent('not-mobile')
  })

  it('useIsTablet returns correct value', () => {
    render(<TestComponent />)
    expect(screen.getByTestId('tablet')).toHaveTextContent('tablet')
  })

  it('useIsDesktop returns correct value', () => {
    render(<TestComponent />)
    expect(screen.getByTestId('desktop')).toHaveTextContent('not-desktop')
  })
})