import Layout from '@/components/layout/Layout'
import Container from '@/components/ui/Container'

/**
 * Home page component
 * @returns {JSX.Element}
 */
export default function Home() {
  return (
    <Layout title="Udyam Registration - Home">
      <Container>
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Udyam Registration Portal
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Complete your Udyam registration process quickly and easily. 
            Register your micro, small, or medium enterprise in just a few simple steps.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <a
              href="/registration"
              className="btn-primary btn-lg inline-block"
            >
              Start Registration
            </a>
            <a
              href="/help"
              className="btn-outline btn-lg inline-block"
            >
              Learn More
            </a>
          </div>
        </div>
        
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">
            Registration Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card">
              <div className="card-body">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold mr-3">
                    1
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Aadhaar Verification
                  </h3>
                </div>
                <p className="text-gray-600">
                  Verify your identity using your 12-digit Aadhaar number and complete OTP verification.
                </p>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold mr-3">
                    2
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    PAN & Personal Details
                  </h3>
                </div>
                <p className="text-gray-600">
                  Provide your PAN number and complete your personal and business information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Layout>
  )
}