# Test Fixtures

This directory contains test data and sample files for the PDF service tests.

## Files

### PDFs
- **test-form.pdf** - Swiss employment certificate form (Arbeitgeberbescheinigung) downloaded from arbeit.swiss
  - Source: https://www.arbeit.swiss/dam/secoalv/de/dokumente/formulare/arbeitslose/arbeitgeberbescheinigung_10006d_v02.2025u.pdf
  - Contains 147 form fields (text, checkboxes, radio buttons)

### Test Data (JSON)

- **test-form-data.json** - Complete test data for filling the employment certificate
  - Includes personal data (name, birth date)
  - Includes employment dates
  - Includes checkbox and radio button selections

- **partial-data.json** - Minimal test data with only name fields
  - Used to test partial form filling

- **invalid-fields-data.json** - Mix of valid and invalid field names
  - Tests error handling for non-existent fields

## Output Directory

The `output/` subdirectory is used for:
- Filled PDFs generated during tests
- Files are automatically cleaned up after test completion
- Gitignored to keep repository clean

## Usage in Tests

```typescript
import * as path from 'path';
const fixturesDir = path.join(__dirname, 'fixtures');
const testPdf = path.join(fixturesDir, 'test-form.pdf');
const testData = require('./fixtures/test-form-data.json');
```

## Updating Test Data

When updating test data:
1. Edit the appropriate JSON file
2. Ensure `expectedResults` match the `fields` you're setting
3. Run tests to verify: `npm test`
