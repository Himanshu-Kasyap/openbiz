/**
 * @fileoverview Unit tests for FormSchema model
 */

const { PrismaClient } = require('@prisma/client');

describe('FormSchema Model', () => {
  let prisma;

  beforeAll(() => {
    prisma = global.testPrisma;
  });

  describe('FormSchema Creation', () => {
    it('should create a form schema with valid data', async () => {
      const schemaData = {
        version: '1.0.0',
        schemaData: {
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
                  required: true,
                },
              ],
            },
          ],
        },
        isActive: true,
      };

      const schema = await prisma.formSchema.create({
        data: schemaData,
      });

      expect(schema).toMatchObject({
        version: '1.0.0',
        isActive: true,
      });
      expect(schema.schemaData).toEqual(schemaData.schemaData);
      expect(schema.id).toBeDefined();
      expect(schema.createdAt).toBeInstanceOf(Date);
    });

    it('should create a form schema with default isActive false', async () => {
      const schemaData = {
        version: '1.1.0',
        schemaData: { test: 'schema' },
      };

      const schema = await prisma.formSchema.create({
        data: schemaData,
      });

      expect(schema.isActive).toBe(false);
    });

    it('should enforce unique version constraint', async () => {
      const schemaData = {
        version: 'duplicate-version',
        schemaData: { test: 'data' },
      };

      await prisma.formSchema.create({ data: schemaData });

      await expect(
        prisma.formSchema.create({ data: schemaData })
      ).rejects.toThrow();
    });

    it('should handle complex schema data structure', async () => {
      const complexSchemaData = {
        version: '2.0.0',
        schemaData: {
          metadata: {
            title: 'Udyam Registration Form',
            description: 'Complete registration form for Udyam portal',
            version: '2.0.0',
          },
          steps: [
            {
              stepNumber: 1,
              title: 'Aadhaar Verification',
              description: 'Verify your Aadhaar number',
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
                      message: 'Aadhaar number must be exactly 12 digits',
                    },
                  ],
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
                      message: 'OTP must be exactly 6 digits',
                    },
                  ],
                },
              ],
            },
            {
              stepNumber: 2,
              title: 'PAN Verification',
              description: 'Verify your PAN details',
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
                      message: 'PAN number format is invalid',
                    },
                  ],
                },
              ],
            },
          ],
          validationRules: {
            global: [
              {
                type: 'required_steps',
                value: [1, 2],
                message: 'All steps must be completed',
              },
            ],
          },
        },
        isActive: true,
      };

      const schema = await prisma.formSchema.create({
        data: complexSchemaData,
      });

      expect(schema.schemaData).toEqual(complexSchemaData.schemaData);
      expect(schema.schemaData.steps).toHaveLength(2);
      expect(schema.schemaData.metadata.title).toBe('Udyam Registration Form');
    });
  });

  describe('FormSchema Queries', () => {
    beforeEach(async () => {
      await prisma.formSchema.createMany({
        data: [
          {
            version: '1.0.0',
            schemaData: { version: '1.0.0', active: false },
            isActive: false,
          },
          {
            version: '1.1.0',
            schemaData: { version: '1.1.0', active: false },
            isActive: false,
          },
          {
            version: '2.0.0',
            schemaData: { version: '2.0.0', active: true },
            isActive: true,
          },
        ],
      });
    });

    it('should find schema by version', async () => {
      const schema = await prisma.formSchema.findUnique({
        where: { version: '2.0.0' },
      });

      expect(schema).toBeTruthy();
      expect(schema.version).toBe('2.0.0');
      expect(schema.isActive).toBe(true);
    });

    it('should find active schema', async () => {
      const activeSchemas = await prisma.formSchema.findMany({
        where: { isActive: true },
      });

      expect(activeSchemas).toHaveLength(1);
      expect(activeSchemas[0].version).toBe('2.0.0');
    });

    it('should find latest schema by creation date', async () => {
      const latestSchema = await prisma.formSchema.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      expect(latestSchema).toBeTruthy();
      // Should be the last created schema
    });

    it('should count schemas', async () => {
      const count = await prisma.formSchema.count();
      expect(count).toBe(3);
    });

    it('should count active schemas', async () => {
      const activeCount = await prisma.formSchema.count({
        where: { isActive: true },
      });
      expect(activeCount).toBe(1);
    });
  });

  describe('FormSchema Updates', () => {
    let testSchema;

    beforeEach(async () => {
      testSchema = await prisma.formSchema.create({
        data: {
          version: 'update-test-1.0.0',
          schemaData: { initial: 'data' },
          isActive: false,
        },
      });
    });

    it('should update schema activation status', async () => {
      const updatedSchema = await prisma.formSchema.update({
        where: { id: testSchema.id },
        data: { isActive: true },
      });

      expect(updatedSchema.isActive).toBe(true);
    });

    it('should update schema data', async () => {
      const newSchemaData = {
        updated: 'data',
        steps: [
          {
            stepNumber: 1,
            title: 'Updated Step',
            fields: [],
          },
        ],
      };

      const updatedSchema = await prisma.formSchema.update({
        where: { id: testSchema.id },
        data: { schemaData: newSchemaData },
      });

      expect(updatedSchema.schemaData).toEqual(newSchemaData);
    });

    it('should handle atomic updates for schema activation', async () => {
      // Create multiple schemas
      const schemas = await Promise.all([
        prisma.formSchema.create({
          data: {
            version: 'atomic-test-1.0.0',
            schemaData: { test: 'data1' },
            isActive: true,
          },
        }),
        prisma.formSchema.create({
          data: {
            version: 'atomic-test-2.0.0',
            schemaData: { test: 'data2' },
            isActive: false,
          },
        }),
      ]);

      // Use transaction to deactivate all and activate one
      await prisma.$transaction(async (tx) => {
        await tx.formSchema.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });

        await tx.formSchema.update({
          where: { id: schemas[1].id },
          data: { isActive: true },
        });
      });

      const activeSchemas = await prisma.formSchema.findMany({
        where: { isActive: true },
      });

      expect(activeSchemas).toHaveLength(1);
      expect(activeSchemas[0].version).toBe('atomic-test-2.0.0');
    });
  });

  describe('FormSchema Indexes', () => {
    it('should efficiently query by active status', async () => {
      await prisma.formSchema.createMany({
        data: [
          {
            version: 'index-test-1.0.0',
            schemaData: { test: 'data1' },
            isActive: false,
          },
          {
            version: 'index-test-2.0.0',
            schemaData: { test: 'data2' },
            isActive: true,
          },
          {
            version: 'index-test-3.0.0',
            schemaData: { test: 'data3' },
            isActive: false,
          },
        ],
      });

      // Query should use the idx_active_schema index
      const activeSchemas = await prisma.formSchema.findMany({
        where: { isActive: true },
      });

      expect(activeSchemas).toHaveLength(1);
      expect(activeSchemas[0].version).toBe('index-test-2.0.0');
    });

    it('should efficiently query by version', async () => {
      await prisma.formSchema.create({
        data: {
          version: 'version-index-test-1.0.0',
          schemaData: { test: 'data' },
        },
      });

      // Query should use the idx_schema_version index
      const schema = await prisma.formSchema.findUnique({
        where: { version: 'version-index-test-1.0.0' },
      });

      expect(schema).toBeTruthy();
      expect(schema.version).toBe('version-index-test-1.0.0');
    });
  });

  describe('FormSchema JSON Operations', () => {
    beforeEach(async () => {
      await prisma.formSchema.create({
        data: {
          version: 'json-test-1.0.0',
          schemaData: {
            steps: [
              {
                stepNumber: 1,
                title: 'Step 1',
                fields: [
                  { id: 'field1', name: 'field1', type: 'text' },
                  { id: 'field2', name: 'field2', type: 'email' },
                ],
              },
              {
                stepNumber: 2,
                title: 'Step 2',
                fields: [
                  { id: 'field3', name: 'field3', type: 'number' },
                ],
              },
            ],
            metadata: {
              title: 'Test Form',
              version: '1.0.0',
            },
          },
        },
      });
    });

    it('should query JSON data using Prisma JSON filters', async () => {
      // Note: JSON querying capabilities depend on Prisma version and database
      const schemas = await prisma.formSchema.findMany({
        where: {
          schemaData: {
            path: ['metadata', 'title'],
            equals: 'Test Form',
          },
        },
      });

      expect(schemas).toHaveLength(1);
    });

    it('should handle nested JSON updates', async () => {
      const schema = await prisma.formSchema.findFirst({
        where: { version: 'json-test-1.0.0' },
      });

      const updatedSchemaData = {
        ...schema.schemaData,
        metadata: {
          ...schema.schemaData.metadata,
          title: 'Updated Test Form',
          lastModified: new Date().toISOString(),
        },
      };

      const updatedSchema = await prisma.formSchema.update({
        where: { id: schema.id },
        data: { schemaData: updatedSchemaData },
      });

      expect(updatedSchema.schemaData.metadata.title).toBe('Updated Test Form');
      expect(updatedSchema.schemaData.metadata.lastModified).toBeDefined();
    });
  });
});