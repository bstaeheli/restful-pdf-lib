# Swagger UI Guide

Interactive API documentation using Swagger UI.

## Accessing Swagger UI

Open your browser and navigate to:

```
Development: http://localhost:3000/api-docs
Production:  https://your-domain/api-docs
```

## Using Swagger UI

### 1. Authenticate

Before testing protected endpoints:

1. Click the **"Authorize"** button (lock icon in top right)
2. Enter your API secret from `.env` file
3. Click **"Authorize"**
4. Click **"Close"**

Now all requests will include your authentication token.

### 2. Test Extract Fields Endpoint

1. Expand **POST /api/pdf/extract-fields**
2. Click **"Try it out"**
3. Click **"Choose File"** and select a PDF with form fields
4. Click **"Execute"**
5. View the response with extracted fields below

### 3. Test Fill Form Endpoint

1. Expand **POST /api/pdf/fill-form**
2. Click **"Try it out"**
3. Upload your PDF file
4. In the `fields` parameter, enter JSON data:
   ```json
   {
     "fullName": "Jane Smith",
     "email": "jane@example.com",
     "agreeToTerms": true
   }
   ```
5. Click **"Execute"**
6. Click **"Download file"** to save the filled PDF

## Features

### Request Examples

Each endpoint shows example curl commands, request URLs, and response formats.

### Schema Definitions

Click on schema names to see detailed type definitions:
- `FieldData` - Structure of extracted field data
- `PDFField` - Individual field properties
- Error response structures

### Try It Out

Execute real API calls directly from the documentation:
- Upload files
- Enter JSON data
- See actual responses
- Download generated files

### Export Curl Commands

After executing an endpoint:
1. Scroll to the **Curl** section
2. Copy the generated command
3. Run in your terminal

## Integrating with Other Tools

### Postman

Import the OpenAPI specification:

1. Open Postman
2. Click **Import** → **Link**
3. Enter: `http://localhost:3000/api-docs/swagger.json`
4. Click **Continue** → **Import**

### Insomnia

1. Click **Create** → **Import From** → **URL**
2. Enter: `http://localhost:3000/api-docs/swagger.json`
3. Click **Fetch and Import**

### VS Code REST Client

Create a `.http` file:

```http
### Health Check
GET http://localhost:3000/health

### Extract Fields
POST http://localhost:3000/api/pdf/extract-fields
Authorization: your-secret-token
Content-Type: multipart/form-data

### Fill Form
POST http://localhost:3000/api/pdf/fill-form
Authorization: your-secret-token
Content-Type: multipart/form-data
```

## OpenAPI Specification

Download the complete spec:

```
http://localhost:3000/api-docs/swagger.json
```

Use for:
- Code generation
- API testing tools
- Documentation generators
- Client SDK creation

## Generate Client Libraries

### TypeScript Client

```bash
npm install -g @openapitools/openapi-generator-cli

openapi-generator-cli generate \
  -i http://localhost:3000/api-docs/swagger.json \
  -g typescript-axios \
  -o ./generated-client
```

### Python Client

```bash
openapi-generator-cli generate \
  -i http://localhost:3000/api-docs/swagger.json \
  -g python \
  -o ./python-client
```

### Java Client

```bash
openapi-generator-cli generate \
  -i http://localhost:3000/api-docs/swagger.json \
  -g java \
  -o ./java-client
```

## Troubleshooting

### Authentication Fails

- Ensure API secret is set in `.env`
- Verify you clicked "Authorize" in Swagger UI
- Check the Authorization header matches your secret exactly

### File Upload Doesn't Work

- Ensure file is a valid PDF
- Check file size limits (default: 10MB)
- Verify Content-Type is `multipart/form-data`

### Response Not Displayed

- Check browser console for errors
- Ensure service is running: `npm run dev`
- Verify no CORS issues for remote access

## Customization

The Swagger configuration is in `src/config/swagger.ts`. You can customize:
- Title and description
- Server URLs
- Contact information
- License details
- Security schemes

## Next Steps

- Review [API Reference](api-reference.md) for detailed documentation
- Check [Quick Start](quickstart.md) for example API calls
- See [Troubleshooting](troubleshooting.md) for common issues
