import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../app';
import * as fs from 'fs';
import * as path from 'path';

describe('PDF Routes - End-to-End Integration', () => {
  let app: Express;
  
  // Test file paths
  const fixturesDir = path.join(__dirname, 'fixtures');
  const outputDir = path.join(fixturesDir, 'output');
  const testPdfPath = path.join(fixturesDir, 'test-form.pdf');
  
  // Load test data from JSON files
  const testFormData = JSON.parse(
    fs.readFileSync(path.join(fixturesDir, 'test-form-data.json'), 'utf-8')
  );
  const partialData = JSON.parse(
    fs.readFileSync(path.join(fixturesDir, 'partial-data.json'), 'utf-8')
  );
  const invalidFieldsData = JSON.parse(
    fs.readFileSync(path.join(fixturesDir, 'invalid-fields-data.json'), 'utf-8')
  );
  
  const testDataToFill = testFormData.fields;
  const expectedResults = testFormData.expectedResults;

  beforeAll(() => {
    process.env.API_SECRET = 'test-secret-e2e';
    app = createApp();
  });

  describe('Complete workflow: Fill PDF and verify fields', () => {
    it('should download test PDF if not exists', async () => {
      if (!fs.existsSync(testPdfPath)) {
        console.log('Test PDF not found, skipping E2E test');
        return;
      }
      
      expect(fs.existsSync(testPdfPath)).toBe(true);
      const stats = fs.statSync(testPdfPath);
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should extract fields from original PDF', async () => {
      if (!fs.existsSync(testPdfPath)) {
        console.log('Test PDF not found, skipping E2E test');
        return;
      }

      const pdfBuffer = fs.readFileSync(testPdfPath);

      const response = await request(app)
        .post('/api/pdf/extract-fields')
        .set('Authorization', 'test-secret-e2e')
        .attach('pdf', pdfBuffer, 'test-form.pdf');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('fields');
      expect(Array.isArray(response.body.fields)).toBe(true);
      expect(response.body.fields.length).toBeGreaterThan(100);

      // Verify that the fields we want to fill exist
      const fieldNames = response.body.fields.map((f: { name: string }) => f.name);
      expect(fieldNames).toContain('txtGeburtsdatum');
      expect(fieldNames).toContain('txtAHV-Nr');
      expect(fieldNames).toContain('1.2');
      expect(fieldNames).toContain('1.3');
    });

    it('should fill PDF form with data', async () => {
      if (!fs.existsSync(testPdfPath)) {
        console.log('Test PDF not found, skipping E2E test');
        return;
      }

      const pdfBuffer = fs.readFileSync(testPdfPath);

      const response = await request(app)
        .post('/api/pdf/fill-form')
        .set('Authorization', 'test-secret-e2e')
        .field('fields', JSON.stringify(testDataToFill))
        .attach('pdf', pdfBuffer, 'test-form.pdf');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(Buffer.isBuffer(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(1000);

      // Save filled PDF for verification
      const filledPdfPath = path.join(outputDir, 'test-filled-e2e.pdf');
      fs.writeFileSync(filledPdfPath, response.body);
    });

    it('should extract fields from filled PDF and verify values', async () => {
      const filledPdfPath = path.join(outputDir, 'test-filled-e2e.pdf');
      
      if (!fs.existsSync(filledPdfPath)) {
        console.log('Filled PDF not found, skipping verification');
        return;
      }

      const filledPdfBuffer = fs.readFileSync(filledPdfPath);

      const response = await request(app)
        .post('/api/pdf/extract-fields')
        .set('Authorization', 'test-secret-e2e')
        .attach('pdf', filledPdfBuffer, 'test-filled.pdf');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('fields');

      const fields = response.body.fields;

      // Verify all expected fields match
      for (const [fieldName, expectedValue] of Object.entries(expectedResults)) {
        const field = fields.find((f: { name: string }) => f.name === fieldName);
        expect(field).toBeDefined();
        expect(field.value).toBe(expectedValue);
      }

      console.log('✅ All filled fields verified successfully!');
    });

    afterAll(() => {
      // Clean up test files
      const filledPdfPath = path.join(outputDir, 'test-filled-e2e.pdf');
      if (fs.existsSync(filledPdfPath)) {
        fs.unlinkSync(filledPdfPath);
      }
    });
  });

  describe('Edge cases with real PDF', () => {
    it('should handle partial field filling', async () => {
      if (!fs.existsSync(testPdfPath)) {
        console.log('Test PDF not found, skipping test');
        return;
      }

      const pdfBuffer = fs.readFileSync(testPdfPath);

      const response = await request(app)
        .post('/api/pdf/fill-form')
        .set('Authorization', 'test-secret-e2e')
        .field('fields', JSON.stringify(partialData.fields))
        .attach('pdf', pdfBuffer, 'test-form.pdf');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      
      // Save and verify
      const filledPdfPath = path.join(outputDir, 'partial-filled.pdf');
      fs.writeFileSync(filledPdfPath, response.body);
      
      // Verify fields
      const extractResponse = await request(app)
        .post('/api/pdf/extract-fields')
        .set('Authorization', 'test-secret-e2e')
        .attach('pdf', response.body, 'filled.pdf');

      for (const [fieldName, expectedValue] of Object.entries(partialData.expectedResults)) {
        const field = extractResponse.body.fields.find(
          (f: { name: string }) => f.name === fieldName
        );
        expect(field.value).toBe(expectedValue);
      }
    });

    it('should handle empty field values', async () => {
      if (!fs.existsSync(testPdfPath)) {
        console.log('Test PDF not found, skipping test');
        return;
      }

      const pdfBuffer = fs.readFileSync(testPdfPath);
      const emptyData = {
        '1.2': '',
        'Kontrollkästchen 62': false
      };

      const response = await request(app)
        .post('/api/pdf/fill-form')
        .set('Authorization', 'test-secret-e2e')
        .field('fields', JSON.stringify(emptyData))
        .attach('pdf', pdfBuffer, 'test-form.pdf');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      
      // Save result
      const filledPdfPath = path.join(outputDir, 'empty-fields.pdf');
      fs.writeFileSync(filledPdfPath, response.body);
    });

    it('should gracefully handle invalid field names', async () => {
      if (!fs.existsSync(testPdfPath)) {
        console.log('Test PDF not found, skipping test');
        return;
      }

      const pdfBuffer = fs.readFileSync(testPdfPath);

      const response = await request(app)
        .post('/api/pdf/fill-form')
        .set('Authorization', 'test-secret-e2e')
        .field('fields', JSON.stringify(invalidFieldsData.fields))
        .attach('pdf', pdfBuffer, 'test-form.pdf');

      // Should succeed despite invalid field name
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');

      // Verify valid fields were filled
      const extractResponse = await request(app)
        .post('/api/pdf/extract-fields')
        .set('Authorization', 'test-secret-e2e')
        .attach('pdf', response.body, 'filled.pdf');

      for (const [fieldName, expectedValue] of Object.entries(invalidFieldsData.expectedResults)) {
        const field = extractResponse.body.fields.find(
          (f: { name: string }) => f.name === fieldName
        );
        expect(field.value).toBe(expectedValue);
      }
    });
  });
});
