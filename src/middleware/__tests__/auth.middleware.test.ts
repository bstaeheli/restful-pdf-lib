import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../app';

describe('Authentication Middleware', () => {
  let app: Express;
  const originalApiSecret = process.env.API_SECRET;

  beforeAll(() => {
    process.env.API_SECRET = 'test-secret-123';
    app = createApp();
  });

  afterAll(() => {
    process.env.API_SECRET = originalApiSecret;
  });

  describe('Health endpoint', () => {
    it('should allow access without authentication', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Protected endpoints', () => {
    it('should return 401 when no Authorization header is provided', async () => {
      const response = await request(app)
        .post('/api/pdf/extract-fields');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing Authorization header');
    });

    it('should return 403 when invalid secret is provided', async () => {
      const response = await request(app)
        .post('/api/pdf/extract-fields')
        .set('Authorization', 'wrong-secret');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid API secret');
    });

    it('should allow access with valid secret', async () => {
      const response = await request(app)
        .post('/api/pdf/extract-fields')
        .set('Authorization', 'test-secret-123');
      
      // Should pass auth and fail on missing PDF file (400), not 401/403
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('No PDF file uploaded');
    });
  });

  describe('Server configuration', () => {
    it('should return 500 when API_SECRET is not configured', async () => {
      delete process.env.API_SECRET;
      const testApp = createApp();

      const response = await request(testApp)
        .post('/api/pdf/extract-fields')
        .set('Authorization', 'any-secret');
      
      expect(response.status).toBe(500);
      expect(response.body.error).toContain('API_SECRET not set');

      process.env.API_SECRET = 'test-secret-123';
    });
  });
});
