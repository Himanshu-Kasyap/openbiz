import { clsx } from 'clsx'

/**
 * Responsive grid component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Grid content
 * @param {string} [props.className] - Additional CSS classes
 * @param {number} [props.cols=1] - Number of columns on mobile
 * @param {number} [props.sm] - Number of columns on small screens
 * @param {number} [props.md] - Number of columns on medium screens
 * @param {number} [props.lg] - Number of columns on large screens
 * @param {number} [props.xl] - Number of columns on extra large screens
 * @param {'sm'|'md'|'lg'|'xl'} [props.gap='md'] - Gap size between grid items
 * @returns {JSX.Element}
 */
export default function Grid({ 
  children, 
  className, 
  cols = 1, 
  sm, 
  md, 
  lg, 
  xl, 
  gap = 'md' 
}) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }

  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  }

  return (
    <div
      className={clsx(
        'grid',
        colClasses[cols],
        sm && `sm:${colClasses[sm]}`,
        md && `md:${colClasses[md]}`,
        lg && `lg:${colClasses[lg]}`,
        xl && `xl:${colClasses[xl]}`,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}