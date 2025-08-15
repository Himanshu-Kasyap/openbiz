import { useBreakpoint, useMediaQuery } from './Responsive'

/**
 * Component that renders children only on specific breakpoints
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|'2xl'} [props.up] - Show on this breakpoint and up
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|'2xl'} [props.down] - Show on this breakpoint and down
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|'2xl'} [props.only] - Show only on this breakpoint
 * @returns {JSX.Element|null}
 */
export function Breakpoint({ children, up, down, only }) {
  const currentBreakpoint = useBreakpoint()
  const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
  const currentIndex = breakpoints.indexOf(currentBreakpoint)
  
  if (only) {
    return currentBreakpoint === only ? children : null
  }
  
  if (up) {
    const upIndex = breakpoints.indexOf(up)
    return currentIndex >= upIndex ? children : null
  }
  
  if (down) {
    const downIndex = breakpoints.indexOf(down)
    return currentIndex <= downIndex ? children : null
  }
  
  return children
}

/**
 * Show content only on mobile devices (xs and sm)
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to show on mobile
 * @returns {JSX.Element|null}
 */
export function MobileOnly({ children }) {
  return <Breakpoint down="sm">{children}</Breakpoint>
}

/**
 * Show content only on tablet devices (md)
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to show on tablet
 * @returns {JSX.Element|null}
 */
export function TabletOnly({ children }) {
  return <Breakpoint only="md">{children}</Breakpoint>
}

/**
 * Show content only on desktop devices (lg and up)
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to show on desktop
 * @returns {JSX.Element|null}
 */
export function DesktopOnly({ children }) {
  return <Breakpoint up="lg">{children}</Breakpoint>
}

/**
 * Hide content on mobile devices
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to hide on mobile
 * @returns {JSX.Element|null}
 */
export function HideMobile({ children }) {
  return <Breakpoint up="md">{children}</Breakpoint>
}

/**
 * Hide content on desktop devices
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to hide on desktop
 * @returns {JSX.Element|null}
 */
export function HideDesktop({ children }) {
  return <Breakpoint down="md">{children}</Breakpoint>
}

/**
 * Hook to check if current screen is mobile
 * @returns {boolean} Whether current screen is mobile
 */
export function useIsMobile() {
  return !useMediaQuery('md')
}

/**
 * Hook to check if current screen is tablet
 * @returns {boolean} Whether current screen is tablet
 */
export function useIsTablet() {
  const isMd = useMediaQuery('md')
  const isLg = useMediaQuery('lg')
  return isMd && !isLg
}

/**
 * Hook to check if current screen is desktop
 * @returns {boolean} Whether current screen is desktop
 */
export function useIsDesktop() {
  return useMediaQuery('lg')
}

export default Breakpoint