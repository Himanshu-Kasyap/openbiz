import Layout from '@/components/layout/Layout'
import { 
  Container, 
  Grid, 
  Button, 
  Card, 
  CardHeader, 
  CardBody,
  Input,
  Stack,
  Inline,
  Center,
  MobileOnly,
  TabletOnly,
  DesktopOnly,
  Form,
  FormSection,
  FormRow,
  FormGroup,
  FormActions
} from '@/components/ui'
import { useBreakpoint, useIsMobile, useIsTablet, useIsDesktop } from '@/components/ui'

/**
 * Design System Demo Page
 * Showcases all responsive design components and features
 * @returns {JSX.Element}
 */
export default function DesignSystemDemo() {
  const currentBreakpoint = useBreakpoint()
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isDesktop = useIsDesktop()

  return (
    <Layout title="Design System Demo - Udyam Registration">
      <Container>
        <Stack spacing="xl">
          {/* Header Section */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Responsive Design System
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A comprehensive collection of responsive components built with Tailwind CSS 
              and React for the Udyam Registration system.
            </p>
          </div>

          {/* Breakpoint Information */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold">Current Breakpoint Information</h2>
            </CardHeader>
            <CardBody>
              <Grid cols={1} md={2} lg={4} gap="md">
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">
                    {currentBreakpoint.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600">Current Breakpoint</div>
                </div>
                <div className={`text-center p-4 rounded-lg ${isMobile ? 'bg-success-50 text-success-600' : 'bg-gray-50 text-gray-400'}`}>
                  <div className="text-lg font-semibold">Mobile</div>
                  <div className="text-sm">{isMobile ? 'Active' : 'Inactive'}</div>
                </div>
                <div className={`text-center p-4 rounded-lg ${isTablet ? 'bg-success-50 text-success-600' : 'bg-gray-50 text-gray-400'}`}>
                  <div className="text-lg font-semibold">Tablet</div>
                  <div className="text-sm">{isTablet ? 'Active' : 'Inactive'}</div>
                </div>
                <div className={`text-center p-4 rounded-lg ${isDesktop ? 'bg-success-50 text-success-600' : 'bg-gray-50 text-gray-400'}`}>
                  <div className="text-lg font-semibold">Desktop</div>
                  <div className="text-sm">{isDesktop ? 'Active' : 'Inactive'}</div>
                </div>
              </Grid>
            </CardBody>
          </Card>

          {/* Layout Components */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold">Layout Components</h2>
            </CardHeader>
            <CardBody>
              <Stack spacing="lg">
                {/* Stack Layout */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Stack Layout (Vertical)</h3>
                  <Stack spacing="md" className="bg-gray-50 p-4 rounded-lg">
                    <div className="bg-primary-100 p-3 rounded text-center">Item 1</div>
                    <div className="bg-primary-200 p-3 rounded text-center">Item 2</div>
                    <div className="bg-primary-300 p-3 rounded text-center">Item 3</div>
                  </Stack>
                </div>

                {/* Inline Layout */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Inline Layout (Horizontal)</h3>
                  <Inline spacing="md" className="bg-gray-50 p-4 rounded-lg">
                    <div className="bg-secondary-100 p-3 rounded text-center">Item A</div>
                    <div className="bg-secondary-200 p-3 rounded text-center">Item B</div>
                    <div className="bg-secondary-300 p-3 rounded text-center">Item C</div>
                  </Inline>
                </div>

                {/* Center Layout */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Center Layout</h3>
                  <Center className="bg-gray-50 p-8 rounded-lg h-32">
                    <div className="bg-success-200 p-4 rounded text-center">
                      Centered Content
                    </div>
                  </Center>
                </div>
              </Stack>
            </CardBody>
          </Card>

          {/* Responsive Grid */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold">Responsive Grid System</h2>
            </CardHeader>
            <CardBody>
              <Stack spacing="lg">
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Adaptive Grid (1 col mobile → 2 col tablet → 3 col desktop)
                  </h3>
                  <Grid cols={1} md={2} lg={3} gap="md">
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <Card key={num} className="bg-gradient-to-br from-primary-50 to-primary-100">
                        <CardBody>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary-600">#{num}</div>
                            <div className="text-sm text-gray-600">Grid Item</div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </Grid>
                </div>
              </Stack>
            </CardBody>
          </Card>

          {/* Breakpoint Visibility */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold">Breakpoint Visibility</h2>
            </CardHeader>
            <CardBody>
              <Stack spacing="md">
                <MobileOnly>
                  <div className="bg-warning-100 border border-warning-300 p-4 rounded-lg">
                    <div className="font-semibold text-warning-800">📱 Mobile Only Content</div>
                    <div className="text-warning-700">This content is only visible on mobile devices (xs, sm)</div>
                  </div>
                </MobileOnly>

                <TabletOnly>
                  <div className="bg-info-100 border border-info-300 p-4 rounded-lg">
                    <div className="font-semibold text-info-800">📱 Tablet Only Content</div>
                    <div className="text-info-700">This content is only visible on tablet devices (md)</div>
                  </div>
                </TabletOnly>

                <DesktopOnly>
                  <div className="bg-success-100 border border-success-300 p-4 rounded-lg">
                    <div className="font-semibold text-success-800">🖥️ Desktop Only Content</div>
                    <div className="text-success-700">This content is only visible on desktop devices (lg+)</div>
                  </div>
                </DesktopOnly>

                <div className="bg-gray-100 border border-gray-300 p-4 rounded-lg">
                  <div className="font-semibold text-gray-800">👁️ Always Visible Content</div>
                  <div className="text-gray-700">This content is visible on all screen sizes</div>
                </div>
              </Stack>
            </CardBody>
          </Card>

          {/* Form Components */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold">Responsive Form Components</h2>
            </CardHeader>
            <CardBody>
              <Form>
                <FormSection 
                  title="Personal Information" 
                  description="Please provide your personal details"
                >
                  <FormRow>
                    <FormGroup label="First Name" required>
                      <Input placeholder="Enter your first name" />
                    </FormGroup>
                    <FormGroup label="Last Name" required>
                      <Input placeholder="Enter your last name" />
                    </FormGroup>
                  </FormRow>

                  <FormGroup label="Email Address" required>
                    <Input type="email" placeholder="Enter your email address" />
                  </FormGroup>

                  <FormRow>
                    <FormGroup label="Phone Number">
                      <Input type="tel" placeholder="Enter your phone number" />
                    </FormGroup>
                    <FormGroup label="PIN Code">
                      <Input placeholder="Enter PIN code" />
                    </FormGroup>
                  </FormRow>
                </FormSection>

                <FormActions align="right">
                  <Button variant="outline">Cancel</Button>
                  <Button variant="primary">Save Information</Button>
                </FormActions>
              </Form>
            </CardBody>
          </Card>

          {/* Button Variants */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold">Button Components</h2>
            </CardHeader>
            <CardBody>
              <Stack spacing="lg">
                <div>
                  <h3 className="text-lg font-medium mb-4">Button Variants</h3>
                  <Inline spacing="md" wrap>
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="danger">Danger</Button>
                  </Inline>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Button Sizes</h3>
                  <Inline spacing="md" align="center" wrap>
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                  </Inline>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Button States</h3>
                  <Inline spacing="md" wrap>
                    <Button>Normal</Button>
                    <Button loading>Loading</Button>
                    <Button disabled>Disabled</Button>
                    <Button fullWidth>Full Width</Button>
                  </Inline>
                </div>
              </Stack>
            </CardBody>
          </Card>
        </Stack>
      </Container>
    </Layout>
  )
}