import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PDF Library Web Service API',
      version: '1.0.0',
      description: 'REST API for PDF manipulation using pdf-lib. Extract form fields from PDFs and fill PDF forms with data.',
      contact: {
        name: 'API Support',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://your-domain.azurecontainer.io',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        ApiSecret: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'API secret token configured via API_SECRET environment variable',
        },
      },
      schemas: {
        PdfFormField: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The name of the form field',
              example: 'fullName',
            },
            type: {
              type: 'string',
              enum: ['text', 'checkbox', 'radio', 'dropdown', 'unknown'],
              description: 'The type of the form field',
              example: 'text',
            },
            value: {
              oneOf: [
                { type: 'string' },
                { type: 'boolean' },
                { type: 'number' },
              ],
              description: 'The current value of the field (if set)',
              example: 'John Doe',
            },
            options: {
              type: 'array',
              items: { type: 'string' },
              description: 'Available options for radio/dropdown fields',
              example: ['Option1', 'Option2'],
            },
            maxLength: {
              type: 'number',
              description: 'Maximum length for text fields',
              example: 100,
            },
          },
          required: ['name', 'type'],
        },
        ExtractFieldsResponse: {
          type: 'object',
          properties: {
            fields: {
              type: 'array',
              items: { $ref: '#/components/schemas/PdfFormField' },
              description: 'Array of all form fields found in the PDF',
            },
          },
          required: ['fields'],
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'healthy',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00.000Z',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Invalid API secret',
            },
            details: {
              type: 'string',
              description: 'Additional error details (only in development)',
              example: 'Detailed error information',
            },
          },
          required: ['error'],
        },
      },
    },
    security: [],
  },
  apis: ['./src/routes/*.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
