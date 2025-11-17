import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../app';

describe('Swagger Documentation', () => {
  let app: Express;

  beforeAll(() => {
    process.env.API_SECRET = 'test-secret-123';
    app = createApp();
  });

  describe('GET /api-docs', () => {
    it('should serve Swagger UI HTML', async () => {
      const response = await request(app).get('/api-docs/');

      expect(response.status).toBe(200);
      expect(response.text).toContain('swagger');
      expect(response.text).toContain('PDF Library Web Service API');
    });

    it('should redirect /api-docs to /api-docs/', async () => {
      const response = await request(app)
        .get('/api-docs')
        .redirects(1);

      expect(response.status).toBe(200);
      expect(response.text).toContain('swagger');
    });
  });
});
