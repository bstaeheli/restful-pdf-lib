import express, { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import pdfRoutes from './routes/pdf.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import { swaggerSpec } from './config/swagger';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  /**
   * @openapi
   * /health:
   *   get:
   *     summary: Health check endpoint
   *     description: Check if the service is running. No authentication required.
   *     tags:
   *       - Health
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/HealthResponse'
   */
  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'PDF Library Web Service API'
  }));

  // Apply authentication middleware to all /api routes
  app.use('/api', authMiddleware);

  // Routes
  app.use('/api/pdf', pdfRoutes);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}
