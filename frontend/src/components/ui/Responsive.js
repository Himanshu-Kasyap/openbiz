import { useState, useEffect } from 'react'
import { tokens } from '../../styles/tokens'

/**
 * Hook to get current breakpoint
 * @returns {string} Current breakpoint (xs, sm, md, lg, xl, 2xl)
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState('lg')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      if (width < parseInt(tokens.breakpoints.xs)) {
        setBreakpoint('xs')
      } else if (width < parseInt(tokens.breakpoints.sm)) {
        setBreakpoint('xs')
      } else if (width < parseInt(tokens.breakpoints.md)) {
        setBreakpoint('sm')
      } else if (width < parseInt(tokens.breakpoints.lg)) {
        setBreakpoint('md')
      } else if (width < parseInt(tokens.breakpoints.xl)) {
        setBreakpoint('lg')
      } else if (width < parseInt(tokens.breakpoints['2xl'])) {
        setBreakpoint('xl')
      } else {
        setBreakpoint('2xl')
      }
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return breakpoint
}

/**
 * Hook to check if current screen matches breakpoint
 * @param {string} breakpoint - Breakpoint to check (xs, sm, md, lg, xl, 2xl)
 * @returns {boolean} Whether current screen matches or exceeds breakpoint
 */
export function useMediaQuery(breakpoint) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${tokens.breakpoints[breakpoint]})`)
    
    const updateMatches = () => setMatches(mediaQuery.matches)
    updateMatches()
    
    mediaQuery.addEventListener('change', updateMatches)
    return () => mediaQuery.removeEventListener('change', updateMatches)
  }, [breakpoint])

  return matches
}

/**
 * Component that renders children only on specific breakpoints
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render
 * @param {string} [props.show] - Breakpoint to show on (xs, sm, md, lg, xl, 2xl)
 * @param {string} [props.hide] - Breakpoint to hide on (xs, sm, md, lg, xl, 2xl)
 * @returns {JSX.Element|null}
 */
export function Responsive({ children, show, hide }) {
  const currentBreakpoint = useBreakpoint()
  
  if (show) {
    const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
    const showIndex = breakpoints.indexOf(show)
    const currentIndex = breakpoints.indexOf(currentBreakpoint)
    
    if (currentIndex < showIndex) {
      return null
    }
  }
  
  if (hide) {
    const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
    const hideIndex = breakpoints.indexOf(hide)
    const currentIndex = breakpoints.indexOf(currentBreakpoint)
    
    if (currentIndex >= hideIndex) {
      return null
    }
  }
  
  return children
}

export default Responsive