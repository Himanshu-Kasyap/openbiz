/**
 * @fileoverview Database seed script for initial data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Sample form schema data based on Udyam registration requirements
 */
const sampleFormSchema = {
  version: '1.0.0',
  steps: [
    {
      stepNumber: 1,
      title: 'Aadhaar Verification',
      fields: [
        {
          id: 'aadhaar_number',
          name: 'aadhaarNumber',
          type: 'text',
          label: 'Aadhaar Number',
          placeholder: 'Enter 12-digit Aadhaar number',
          required: true,
          validationRules: [
            {
              type: 'pattern',
              value: '^[0-9]{12}$',
              message: 'Aadhaar number must be exactly 12 digits'
            },
            {
              type: 'required',
              message: 'Aadhaar number is required'
            }
          ]
        },
        {
          id: 'otp',
          name: 'otp',
          type: 'text',
          label: 'OTP',
          placeholder: 'Enter 6-digit OTP',
          required: true,
          validationRules: [
            {
              type: 'pattern',
              value: '^[0-9]{6}$',
              message: 'OTP must be exactly 6 digits'
            },
            {
              type: 'required',
              message: 'OTP is required'
            }
          ]
        }
      ]
    },
    {
      stepNumber: 2,
      title: 'PAN Verification',
      fields: [
        {
          id: 'pan_number',
          name: 'panNumber',
          type: 'text',
          label: 'PAN Number',
          placeholder: 'Enter PAN number',
          required: true,
          validationRules: [
            {
              type: 'pattern',
              value: '^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$',
              message: 'PAN number format is invalid'
            },
            {
              type: 'required',
              message: 'PAN number is required'
            }
          ]
        },
        {
          id: 'full_name',
          name: 'fullName',
          type: 'text',
          label: 'Full Name',
          placeholder: 'Enter full name as per PAN',
          required: true,
          validationRules: [
            {
              type: 'required',
              message: 'Full name is required'
            },
            {
              type: 'length',
              value: { min: 2, max: 100 },
              message: 'Name must be between 2 and 100 characters'
            }
          ]
        }
      ]
    }
  ]
};

async function main() {
  console.log('Starting database seed...');

  // Create initial form schema
  const formSchema = await prisma.formSchema.upsert({
    where: { version: '1.0.0' },
    update: {
      schemaData: sampleFormSchema,
      isActive: true,
    },
    create: {
      version: '1.0.0',
      schemaData: sampleFormSchema,
      isActive: true,
    },
  });

  console.log('Created form schema:', formSchema);

  // Create sample user for testing
  const sampleUser = await prisma.user.upsert({
    where: { sessionId: 'sample-session-123' },
    update: {
      status: 'in_progress',
    },
    create: {
      sessionId: 'sample-session-123',
      status: 'in_progress',
    },
  });

  console.log('Created sample user:', sampleUser);

  // Create sample form submission
  const sampleSubmission = await prisma.formSubmission.upsert({
    where: { 
      id: 'sample-submission-123' 
    },
    update: {
      formData: {
        aadhaarNumber: '123456789012',
        otp: '123456'
      },
      validationStatus: 'completed'
    },
    create: {
      id: 'sample-submission-123',
      userId: sampleUser.id,
      stepNumber: 1,
      formData: {
        aadhaarNumber: '123456789012',
        otp: '123456'
      },
      validationStatus: 'completed'
    },
  });

  console.log('Created sample form submission:', sampleSubmission);

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });