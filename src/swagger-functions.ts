import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { swaggerSpec } from './config/swagger';

/**
 * Get current server URL dynamically
 */
function getCurrentServerUrl(): string {
  const isAzureFunction = process.env.FUNCTIONS_WORKER_RUNTIME === 'node';
  
  if (isAzureFunction) {
    const functionAppUrl = process.env.WEBSITE_HOSTNAME;
    // Only use HTTPS if we have a real hostname (not localhost)
    if (functionAppUrl && !functionAppUrl.includes('localhost')) {
      return `https://${functionAppUrl}`;
    }
    // Local development always uses HTTP
    return 'http://localhost:7071';
  }
  
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    return `https://${baseUrl}`;
  }
  return baseUrl;
}

/**
 * Serve Swagger UI HTML
 */
async function swaggerUIHandler(_request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  // Create spec with runtime server URL
  const runtimeSpec = {
    ...swaggerSpec,
    servers: [{
      url: getCurrentServerUrl(),
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    }]
  };

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PDF Library API - Swagger UI</title>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; padding:0; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        spec: ${JSON.stringify(runtimeSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;

  return {
    status: 200,
    headers: {
      'Content-Type': 'text/html'
    },
    body: html
  };
}

/**
 * Serve OpenAPI JSON spec
 */
async function openApiSpecHandler(_request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  // Create spec with runtime server URL
  const runtimeSpec = {
    ...swaggerSpec,
    servers: [{
      url: getCurrentServerUrl(),
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    }]
  };

  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(runtimeSpec, null, 2)
  };
}

// Register Swagger endpoints
app.http('swagger-ui', {
  methods: ['GET'],
  route: 'docs',
  authLevel: 'anonymous',
  handler: swaggerUIHandler
});

app.http('openapi-spec', {
  methods: ['GET'],
  route: 'openapi.json',
  authLevel: 'anonymous',
  handler: openApiSpecHandler
});