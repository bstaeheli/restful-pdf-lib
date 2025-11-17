import swaggerJsdoc from 'swagger-jsdoc';

import swaggerJsdoc from 'swagger-jsdoc';
import packageJson from '../../package.json';

// Get base URL and ensure it has protocol
const getServerUrl = (): string => {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  // If URL doesn't start with http:// or https://, assume https://
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    return `https://${baseUrl}`;
  }
  return baseUrl;
};

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PDF Library Web Service API',
      version: packageJson.version,
      description: 'REST API for PDF manipulation using pdf-lib. Extract form fields from PDFs and fill PDF forms with data.',
