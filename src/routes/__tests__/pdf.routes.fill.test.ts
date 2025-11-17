import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../app';
import { PDFDocument } from 'pdf-lib';
import { setupOpenAPIValidation } from '../../test-utils/openapi-validator';

describe('PDF Routes - Fill Form', () => {
  let app: Express;

  beforeAll(() => {
    process.env.API_SECRET = 'test-secret-123';
    app = createApp();
    setupOpenAPIValidation();
  });

  describe('POST /api/pdf/fill-form', () => {
    it('should return 400 when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/pdf/fill-form')
        .set('Authorization', 'test-secret-123');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('No PDF file uploaded');
      expect(response).toSatisfyApiSpec();
    });

    it('should return 400 when no fields data is provided', async () => {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([600, 400]);
      const pdfBytes = await pdfDoc.save();

      const response = await request(app)
        .post('/api/pdf/fill-form')
        .set('Authorization', 'test-secret-123')
        .attach('pdf', Buffer.from(pdfBytes), {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing "fields" data');
      expect(response).toSatisfyApiSpec();
    });

    it('should return 400 when fields data is invalid JSON', async () => {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([600, 400]);
      const pdfBytes = await pdfDoc.save();

      const response = await request(app)
        .post('/api/pdf/fill-form')
        .set('Authorization', 'test-secret-123')
        .field('fields', 'not valid json')
        .attach('pdf', Buffer.from(pdfBytes), {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid JSON');
      expect(response).toSatisfyApiSpec();
    });

    it('should fill form fields and return PDF', async () => {
      // Create a PDF with empty form fields
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const form = pdfDoc.getForm();

      const textField = form.createTextField('fullName');
      textField.addToPage(page, { x: 50, y: 350, width: 200, height: 30 });

      const checkbox = form.createCheckBox('agree');
      checkbox.addToPage(page, { x: 50, y: 300, width: 20, height: 20 });

      const pdfBytes = await pdfDoc.save();

      const fieldsData = {
        fullName: 'Jane Smith',
        agree: true,
      };

      const response = await request(app)
        .post('/api/pdf/fill-form')
        .set('Authorization', 'test-secret-123')
        .field('fields', JSON.stringify(fieldsData))
        .attach('pdf', Buffer.from(pdfBytes), {
          filename: 'test-form.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(Buffer.isBuffer(response.body)).toBe(true);

      // Verify the returned PDF has the filled fields
      const filledPdf = await PDFDocument.load(response.body);
      const filledForm = filledPdf.getForm();
      
      const filledTextField = filledForm.getTextField('fullName');
      expect(filledTextField.getText()).toBe('Jane Smith');

      const filledCheckbox = filledForm.getCheckBox('agree');
      expect(filledCheckbox.isChecked()).toBe(true);
      
      // Note: Binary PDF responses cannot be validated against OpenAPI spec
      // but we verify status and headers which are part of the spec
      expect(response.status).toBe(200);
    });

    it('should handle non-existent field names gracefully', async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const form = pdfDoc.getForm();

      const textField = form.createTextField('existingField');
      textField.addToPage(page, { x: 50, y: 350, width: 200, height: 30 });

      const pdfBytes = await pdfDoc.save();

      const fieldsData = {
        existingField: 'Valid Value',
        nonExistentField: 'Should not cause error',
      };

      const response = await request(app)
        .post('/api/pdf/fill-form')
        .set('Authorization', 'test-secret-123')
        .field('fields', JSON.stringify(fieldsData))
        .attach('pdf', Buffer.from(pdfBytes), {
          filename: 'test-form.pdf',
          contentType: 'application/pdf',
        });

      // Should succeed and return PDF despite non-existent field
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
    });

    it('should return 400 when file is not a PDF (wrong mimetype)', async () => {
      const response = await request(app)
        .post('/api/pdf/fill-form')
        .set('Authorization', 'test-secret-123')
        .field('fields', JSON.stringify({ test: 'value' }))
        .attach('pdf', Buffer.from('not a pdf'), {
          filename: 'test.txt',
          contentType: 'text/plain',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('PDF');
      expect(response).toSatisfyApiSpec();
    });

    it('should return 500 when PDF processing fails', async () => {
      // Create invalid/corrupted PDF data
      const invalidPdfData = Buffer.from('%PDF-1.4\n%%EOF');

      const response = await request(app)
        .post('/api/pdf/fill-form')
        .set('Authorization', 'test-secret-123')
        .field('fields', JSON.stringify({ test: 'value' }))
        .attach('pdf', invalidPdfData, {
          filename: 'corrupted.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Failed to fill PDF form');
      expect(response.body).toHaveProperty('details');
      expect(response).toSatisfyApiSpec();
    });
  });
});
