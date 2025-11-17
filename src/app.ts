import express, { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import pdfRoutes from './routes/pdf.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import { swaggerSpec } from './config/swagger';
import packageJson from '../package.json';

/**
 * Creates and configures the Express application.
 * 
 * @returns Configured Express application instance
 * 
 * @remarks
 * Sets up:
 * - JSON and URL-encoded body parsing
 * - Health check endpoint (no authentication)
 * - Swagger API documentation at /api-docs
 * - Authentication middleware for /api routes
 * - PDF manipulation routes at /api/pdf
 * - Global error handler
 * 
 * @example
 * ```typescript
 * const app = createApp();
 * app.listen(3000, () => console.log('Server running'));
 * ```
 */
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
    res.json({ 
      status: 'healthy', 
      version: packageJson.version,
      timestamp: new Date().toISOString() 
    });
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
