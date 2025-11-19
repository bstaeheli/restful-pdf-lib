import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { PdfService } from './services/pdf.service';

// File type from FormData API
type File = {
  name: string;
  type: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
};

const pdfService = new PdfService();

/**
 * Validates the API secret from the Authorization header
 */
function validateApiSecret(authHeader: string | null): boolean {
  if (!authHeader) {
    return false;
  }

  const expectedSecret = process.env.API_SECRET;
  if (!expectedSecret) {
    throw new Error('API_SECRET environment variable is not configured');
  }

  // Support both "Bearer token" and "token" formats
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  return token === expectedSecret;
}

/**
 * Azure Function for extracting PDF form fields
 */
async function extractFields(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    context.log('Extract fields function triggered');

    // Validate API secret
    const authHeader = request.headers.get('authorization');
    if (!validateApiSecret(authHeader)) {
      return {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Unauthorized',
          message: 'Valid API secret required in Authorization header'
        })
      };
    }

    // Parse form data
    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File;
    
    if (!pdfFile) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Bad Request',
          message: 'PDF file is required' 
        })
      };
    }

    // Validate file type
    if (pdfFile.type !== 'application/pdf') {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Bad Request',
          message: 'Only PDF files are allowed' 
        })
      };
    }

    // Extract form fields
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfBytes);
    const fields = await pdfService.extractFormFields(pdfBuffer);

    context.log(`Successfully extracted ${fields.length} fields from PDF`);

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true,
        fields,
        message: `Successfully extracted ${fields.length} form fields`
      })
    };

  } catch (error) {
    context.error('Extract fields error:', error);
    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: 'An error occurred while processing the PDF'
      })
    };
  }
}

/**
 * Azure Function for filling PDF forms
 */
async function fillForm(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    context.log('Fill form function triggered');

    // Validate API secret
    const authHeader = request.headers.get('authorization');
    if (!validateApiSecret(authHeader)) {
      return {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Unauthorized',
          message: 'Valid API secret required in Authorization header'
        })
      };
    }

    // Parse form data
    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File;
    const fieldsData = formData.get('fields');
    
    if (!pdfFile || !fieldsData) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Bad Request',
          message: 'Both PDF file and fields data are required' 
        })
      };
    }

    // Validate file type
    if (pdfFile.type !== 'application/pdf') {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Bad Request',
          message: 'Only PDF files are allowed' 
        })
      };
    }

    // Parse fields data
    let fields;
    try {
      const fieldsString = typeof fieldsData === 'string' ? fieldsData : await (fieldsData as File).text();
      fields = JSON.parse(fieldsString);
    } catch {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Bad Request',
          message: 'Fields data must be valid JSON' 
        })
      };
    }

    // Fill PDF form
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfBytes);
    const filledPdfBytes = await pdfService.fillFormFields(pdfBuffer, fields);

    context.log('Successfully filled PDF form');

    return {
      status: 200,
      headers: { 
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="filled-form.pdf"'
      },
      body: filledPdfBytes
    };

  } catch (error) {
    context.error('Fill form error:', error);
    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: 'An error occurred while processing the PDF'
      })
    };
  }
}

/**
 * Azure Function for health check
 */
async function healthCheck(_request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      runtime: 'azure-functions'
    })
  };
}

// Register HTTP triggers
app.http('extract-fields', {
  methods: ['POST'],
  route: 'pdf/extract-fields',
  handler: extractFields,
  authLevel: 'anonymous'
});

app.http('fill-form', {
  methods: ['POST'],
  route: 'pdf/fill-form',
  handler: fillForm,
  authLevel: 'anonymous'
});

app.http('health', {
  methods: ['GET'],
  route: 'health',
  handler: healthCheck
});

// Import Swagger/OpenAPI documentation endpoints
import './swagger-functions';