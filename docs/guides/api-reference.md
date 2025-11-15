# API Reference

Complete reference for all API endpoints.

## Base URL

```
Development: http://localhost:3000
Production:  https://your-domain
```

## Authentication

All endpoints (except `/health`) require authentication using a secret token.

**Header:**
```
Authorization: your-secret-token
```

Configure the secret in environment:
```env
API_SECRET=your-secret-token
```

## Endpoints

### Health Check

Check if the service is running.

**Request:**
```http
GET /health
```

**Authentication:** None required

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2025-11-15T10:30:00.000Z"
}
```

---

### Extract PDF Form Fields

Upload a PDF file and extract all form fields as JSON.

**Request:**
```http
POST /api/pdf/extract-fields
Content-Type: multipart/form-data
Authorization: your-secret-token
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| pdf | file | Yes | PDF file to extract fields from |

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/pdf/extract-fields \
  -H "Authorization: your-secret-token" \
  -F "pdf=@/path/to/form.pdf"
```

**Response:** `200 OK`
```json
{
  "fields": [
    {
      "name": "fullName",
      "type": "text",
      "value": "John Doe",
      "maxLength": 100
    },
    {
      "name": "agreeToTerms",
      "type": "checkbox",
      "value": true
    },
    {
      "name": "country",
      "type": "dropdown",
      "value": "USA",
      "options": ["USA", "Canada", "Mexico"]
    }
  ]
}
```

**Field Types:**
- `text` - Text input field
- `checkbox` - Checkbox field (boolean)
- `radio` - Radio button group
- `dropdown` - Select/dropdown field
- `button` - Push button

**Error Responses:**

`401 Unauthorized` - Missing or invalid authentication
```json
{
  "error": "Unauthorized"
}
```

`400 Bad Request` - No PDF file provided
```json
{
  "error": "No PDF file uploaded"
}
```

`500 Internal Server Error` - PDF processing failed
```json
{
  "error": "Failed to extract fields from PDF"
}
```

---

### Fill PDF Form

Upload a PDF file and JSON data to fill the form fields.

**Request:**
```http
POST /api/pdf/fill-form
Content-Type: multipart/form-data
Authorization: your-secret-token
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| pdf | file | Yes | PDF file to fill |
| fields | JSON string or object | Yes | Field values to fill |

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/pdf/fill-form \
  -H "Authorization: your-secret-token" \
  -F "pdf=@/path/to/form.pdf" \
  -F 'fields={"fullName":"Jane Smith","agreeToTerms":true}' \
  --output filled-form.pdf
```

**Field Data Format:**
```json
{
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "agreeToTerms": true,
  "country": "Canada",
  "age": "25"
}
```

**Data Types:**
- Text fields: Use strings
- Checkboxes: Use boolean (`true`/`false`)
- Radio buttons: Use string (selected option)
- Dropdowns: Use string (selected option)

**Response:** `200 OK`
- Content-Type: `application/pdf`
- Returns filled PDF file as binary download

**Error Responses:**

`401 Unauthorized` - Missing or invalid authentication

`400 Bad Request` - Missing PDF or field data
```json
{
  "error": "No PDF file uploaded or no field data provided"
}
```

`500 Internal Server Error` - PDF processing failed
```json
{
  "error": "Failed to fill PDF form"
}
```

---

## Interactive Documentation

Full interactive API documentation with try-it-out functionality:

```
http://localhost:3000/api-docs
```

Features:
- Test all endpoints directly from browser
- See real-time request/response examples
- Authenticate and save credentials
- Download OpenAPI specification

## OpenAPI Specification

Download the complete OpenAPI 3.0 specification:

```
http://localhost:3000/api-docs/swagger.json
```

Use with:
- Postman
- Insomnia
- OpenAPI Generator
- Swagger Codegen
- VS Code REST Client extensions

## Rate Limiting

Currently not implemented. Consider adding rate limiting in production environments.

## CORS

By default, CORS is not configured. Add CORS middleware if needed for browser-based clients.

## Error Handling

All errors return JSON with an `error` field:

```json
{
  "error": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid auth)
- `500` - Internal Server Error (processing failed)

## Examples

See the [Swagger Guide](swagger.md) for interactive examples and client generation.
