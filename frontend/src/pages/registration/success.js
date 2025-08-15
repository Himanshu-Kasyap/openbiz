import { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/layout/Layout'
import Container from '@/components/ui/Container'
import { Card, Button } from '@/components/ui'

/**
 * Registration success page
 * @returns {JSX.Element}
 */
export default function RegistrationSuccess() {
  const router = useRouter()
  const [registrationId] = useState(() => 
    `UD${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
  )

  return (
    <Layout title="Registration Successful - Udyam Registration">
      <Container className="py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success-100 mb-6">
            <svg
              className="h-8 w-8 text-success-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Registration Submitted Successfully!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your Udyam registration application has been submitted and is being processed.
          </p>

          {/* Registration details card */}
          <Card className="mb-8">
            <div className="card-body">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Registration Details
              </h2>
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Registration ID:</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {registrationId}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Submission Date:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date().toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Under Review
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Expected Processing Time:</span>
                  <span className="font-semibold text-gray-900">3-5 business days</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Next steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              What happens next?
            </h3>
            <div className="text-left space-y-2 text-blue-800">
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                  1
                </span>
                <p className="text-sm">
                  Your application will be reviewed by the concerned authorities
                </p>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                  2
                </span>
                <p className="text-sm">
                  You will receive an email notification with the status update
                </p>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                  3
                </span>
                <p className="text-sm">
                  Upon approval, your Udyam Registration Certificate will be generated
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Button
              onClick={() => window.print()}
              variant="outline"
              size="lg"
            >
              Print Details
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="primary"
              size="lg"
            >
              Back to Home
            </Button>
          </div>

          {/* Important note */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <svg
                className="flex-shrink-0 w-5 h-5 text-yellow-600 mr-2 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                  Important Note
                </h4>
                <p className="text-sm text-yellow-700">
                  Please save your Registration ID ({registrationId}) for future reference. 
                  You will need this ID to track your application status.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Layout>
  )
}