import '@/styles/globals.css'

/**
 * Custom App component that wraps all pages
 * @param {Object} props
 * @param {React.ComponentType} props.Component - The page component
 * @param {Object} props.pageProps - Props for the page component
 * @returns {JSX.Element}
 */
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}