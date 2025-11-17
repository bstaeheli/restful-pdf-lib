import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../app';
import { PDFDocument } from 'pdf-lib';
import { setupOpenAPIValidation } from '../../test-utils/openapi-validator';

describe('PDF Routes - Extract Fields', () => {
  let app: Express;

  beforeAll(() => {
    process.env.API_SECRET = 'test-secret-123';
    app = createApp();
    setupOpenAPIValidation();
  });

  describe('POST /api/pdf/extract-fields', () => {
    it('should return 400 when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/pdf/extract-fields')
        .set('Authorization', 'test-secret-123');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('No PDF file uploaded');
      expect(response).toSatisfyApiSpec();
    });

    it('should return 400 when non-PDF file is uploaded', async () => {
      const response = await request(app)
        .post('/api/pdf/extract-fields')
        .set('Authorization', 'test-secret-123')
        .attach('pdf', Buffer.from('not a pdf'), {
          filename: 'test.txt',
          contentType: 'text/plain',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('PDF');
      expect(response).toSatisfyApiSpec();
    });

    it('should extract form fields from a valid PDF', async () => {
      // Create a PDF with form fields
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const form = pdfDoc.getForm();

      const textField = form.createTextField('fullName');
      textField.addToPage(page, { x: 50, y: 350, width: 200, height: 30 });
      textField.setText('John Doe');

      const checkbox = form.createCheckBox('agree');
      checkbox.addToPage(page, { x: 50, y: 300, width: 20, height: 20 });
      checkbox.check();

      const pdfBytes = await pdfDoc.save();

      const response = await request(app)
        .post('/api/pdf/extract-fields')
        .set('Authorization', 'test-secret-123')
        .attach('pdf', Buffer.from(pdfBytes), {
          filename: 'test-form.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('fields');
      expect(Array.isArray(response.body.fields)).toBe(true);
      expect(response.body.fields.length).toBe(2);

      const textFieldResult = response.body.fields.find(
        (f: { name: string }) => f.name === 'fullName'
      );
      expect(textFieldResult).toBeDefined();
      expect(textFieldResult.type).toBe('text');
      expect(textFieldResult.value).toBe('John Doe');

      const checkboxResult = response.body.fields.find(
        (f: { name: string }) => f.name === 'agree'
      );
      expect(checkboxResult).toBeDefined();
      expect(checkboxResult.type).toBe('checkbox');
      expect(checkboxResult.value).toBe(true);
      expect(response).toSatisfyApiSpec();
    });

    it('should return 500 when PDF extraction fails', async () => {
      // Create invalid/corrupted PDF data
      const invalidPdfData = Buffer.from('%PDF-1.4\n%%EOF');

      const response = await request(app)
        .post('/api/pdf/extract-fields')
        .set('Authorization', 'test-secret-123')
        .attach('pdf', invalidPdfData, {
          filename: 'corrupted.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Failed to extract PDF form fields');
      expect(response.body).toHaveProperty('details');
      expect(response).toSatisfyApiSpec();
    });
  });
});
