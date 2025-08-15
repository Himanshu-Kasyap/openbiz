/**
 * Footer component with responsive layout
 * @returns {JSX.Element}
 */
export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container-responsive py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">U</span>
              </div>
              <span className="font-semibold text-gray-900">Udyam Registration</span>
            </div>
            <p className="text-sm text-gray-600">
              Simplified Udyam registration process for micro, small, and medium enterprises.
            </p>
          </div>
          
          {/* Quick links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200">
                  Home
                </a>
              </li>
              <li>
                <a href="/registration" className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200">
                  Start Registration
                </a>
              </li>
              <li>
                <a href="/help" className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200">
                  Help & Support
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Support</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Email: support@udyam-registration.com
              </p>
              <p className="text-sm text-gray-600">
                Phone: 1800-XXX-XXXX
              </p>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Udyam Registration. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}