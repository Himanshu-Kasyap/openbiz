import Head from 'next/head'
import Header from './Header'
import Footer from './Footer'

/**
 * Main layout component that wraps all pages
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} [props.title] - Page title
 * @param {string} [props.description] - Page description for SEO
 * @param {boolean} [props.showHeader=true] - Whether to show header
 * @param {boolean} [props.showFooter=true] - Whether to show footer
 * @returns {JSX.Element}
 */
export default function Layout({
  children,
  title = 'Udyam Registration',
  description = 'Complete your Udyam registration process',
  showHeader = true,
  showFooter = true,
}) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen flex flex-col bg-gray-50">
        {showHeader && <Header />}
        
        <main className="flex-1 container-responsive py-6 sm:py-8 lg:py-12">
          {children}
        </main>
        
        {showFooter && <Footer />}
      </div>
    </>
  )
}