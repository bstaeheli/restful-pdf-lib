import { Router, Request, Response } from 'express';
import multer from 'multer';
import { PdfService } from '../services/pdf.service';

const router = Router();

// Configure multer with file size limit (10MB max)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB in bytes
  },
  fileFilter: (_req, file, cb) => {
    // Additional validation at multer level
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

const pdfService = new PdfService();

/**
 * @openapi
 * /api/pdf/extract-fields:
 *   post:
 *     summary: Extract form fields from a PDF
 *     description: Upload a PDF file and receive all form fields as JSON. Returns field names, types, current values, and metadata.
 *     tags:
 *       - PDF Operations
 *     security:
 *       - ApiSecret: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - pdf
 *             properties:
 *               pdf:
 *                 type: string
 *                 format: binary
 *                 description: PDF file to extract form fields from
 *     responses:
 *       200:
 *         description: Successfully extracted form fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExtractFieldsResponse'
 *             example:
 *               fields:
 *                 - name: "fullName"
 *                   type: "text"
 *                   value: "John Doe"
 *                   maxLength: 100
 *                 - name: "agreeToTerms"
 *                   type: "checkbox"
 *                   value: true
 *                 - name: "country"
 *                   type: "dropdown"
 *                   value: "USA"
 *                   options: ["USA", "Canada", "Mexico"]
 *       400:
 *         description: Bad request - missing file or invalid PDF
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               noFile:
 *                 value:
 *                   error: "No PDF file uploaded"
 *               notPdf:
 *                 value:
 *                   error: "Uploaded file must be a PDF"
 *       401:
 *         description: Unauthorized - missing Authorization header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Unauthorized: Missing Authorization header"
 *       403:
 *         description: Forbidden - invalid API secret
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Forbidden: Invalid API secret"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/extract-fields',
  upload.single('pdf'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No PDF file uploaded' });
        return;
      }

      if (req.file.mimetype !== 'application/pdf') {
        res.status(400).json({ error: 'Uploaded file must be a PDF' });
        return;
      }

      const fields = await pdfService.extractFormFields(req.file.buffer);
      
      res.json({ fields });
    } catch (error) {
      console.error('Error extracting PDF fields:', error);
      res.status(500).json({ 
        error: 'Failed to extract PDF form fields',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @openapi
 * /api/pdf/fill-form:
 *   post:
 *     summary: Fill a PDF form with data
 *     description: Upload a PDF file and JSON data to fill the form fields. Returns the filled PDF as a binary download.
 *     tags:
 *       - PDF Operations
 *     security:
 *       - ApiSecret: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - pdf
 *               - fields
 *             properties:
 *               pdf:
 *                 type: string
 *                 format: binary
 *                 description: PDF file with form fields to fill
 *               fields:
 *                 type: string
 *                 description: JSON object containing field names and values to fill
 *                 example: '{"fullName":"Jane Smith","email":"jane@example.com","agreeToTerms":true}'
 *     responses:
 *       200:
 *         description: Successfully filled PDF form
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *               example: 'attachment; filename="filled-form.pdf"'
 *           Content-Length:
 *             schema:
 *               type: integer
 *               example: 252980
 *       400:
 *         description: Bad request - missing file, missing fields data, or invalid JSON
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               noFile:
 *                 value:
 *                   error: "No PDF file uploaded"
 *               notPdf:
 *                 value:
 *                   error: "Uploaded file must be a PDF"
 *               missingFields:
 *                 value:
 *                   error: 'Missing "fields" data in request body'
 *               invalidJson:
 *                 value:
 *                   error: 'Invalid JSON in "fields" parameter'
 *       401:
 *         description: Unauthorized - missing Authorization header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Unauthorized: Missing Authorization header"
 *       403:
 *         description: Forbidden - invalid API secret
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Forbidden: Invalid API secret"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/fill-form',
  upload.single('pdf'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No PDF file uploaded' });
        return;
      }

      if (req.file.mimetype !== 'application/pdf') {
        res.status(400).json({ error: 'Uploaded file must be a PDF' });
        return;
      }

      if (!req.body.fields) {
        res.status(400).json({ 
          error: 'Missing "fields" data in request body' 
        });
        return;
      }

      let fieldData: Record<string, string | boolean | number>;
      
      try {
        fieldData = typeof req.body.fields === 'string' 
          ? JSON.parse(req.body.fields) 
          : req.body.fields;
      } catch {
        res.status(400).json({ 
          error: 'Invalid JSON in "fields" parameter' 
        });
        return;
      }

      const filledPdf = await pdfService.fillFormFields(
        req.file.buffer,
        fieldData
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="filled-form.pdf"'
      );
      res.setHeader('Content-Length', filledPdf.length.toString());
      res.send(filledPdf);
    } catch (error) {
      console.error('Error filling PDF form:', error);
      
      // Make sure we haven't started sending the response
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Failed to fill PDF form',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
);

export default router;
