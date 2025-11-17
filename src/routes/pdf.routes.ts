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
    // Accept PDF files for the 'pdf' field or JSON data for 'fields' field
    if (file.fieldname === 'pdf') {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'));
      }
    } else if (file.fieldname === 'fields') {
      // Allow fields as a file-like part (Swagger UI does this with ;type=application/json)
      cb(null, true);
    } else {
      // Reject any other file fields
      cb(new Error(`Unexpected file field: ${file.fieldname}`));
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
 *           encoding:
 *             pdf:
 *               contentType: application/pdf
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
 *                   value: "Hans Müller"
 *                   maxLength: 100
 *                   position:
 *                     pageIndex: 0
 *                     x: 3.53
 *                     y: 24.69
 *                     width: 7.06
 *                     height: 0.71
 *                 - name: "agreeToTerms"
 *                   type: "checkbox"
 *                   value: true
 *                   position:
 *                     pageIndex: 0
 *                     x: 2.12
 *                     y: 18.50
 *                     width: 0.53
 *                     height: 0.53
 *                 - name: "country"
 *                   type: "dropdown"
 *                   value: "Switzerland"
 *                   options: ["Switzerland", "Germany", "Austria", "France"]
 *                   position:
 *                     pageIndex: 0
 *                     x: 5.29
 *                     y: 12.35
 *                     width: 8.47
 *                     height: 0.88
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
 *     description: |
 *       Upload a PDF file and JSON data to fill the form fields. Returns the filled PDF as a binary download.
 *       
 *       **For the "fields" parameter:**
 *       Enter your JSON data as text directly in the text box.
 *       Example: {"fullName":"Anna Weber","email":"anna.weber@example.ch","agreeToTerms":true}
 *       
 *       Note: If you experience issues with Swagger UI, you can also upload a .json file.
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
 *                 description: JSON string with field names and values. Enter as text or upload as .json file.
 *                 example: '{"fullName":"Anna Weber","email":"anna.weber@example.ch","phone":"+41 44 123 45 67","agreeToTerms":true,"country":"Switzerland","age":35}'
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
  upload.any(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      
      // Find the PDF file
      const pdfFile = files?.find(f => f.fieldname === 'pdf');
      
      if (!pdfFile) {
        res.status(400).json({ error: 'No PDF file uploaded' });
        return;
      }

      if (pdfFile.mimetype !== 'application/pdf') {
        res.status(400).json({ error: 'Uploaded file must be a PDF' });
        return;
      }

      // Fields can come from either req.body or as a "file" with application/json content-type
      let fieldsData: string | Record<string, any> | undefined = req.body.fields;
      
      // Debug logging
      console.log('DEBUG - req.body:', JSON.stringify(req.body, null, 2));
      console.log('DEBUG - files:', files?.map(f => ({ fieldname: f.fieldname, size: f.size, mimetype: f.mimetype })));
      console.log('DEBUG - fieldsData type:', typeof fieldsData);
      console.log('DEBUG - fieldsData value:', fieldsData);
      
      if (!fieldsData) {
        // Check if fields was sent as a file-like part with content-type
        const fieldsFile = files?.find(f => f.fieldname === 'fields');
        if (fieldsFile) {
          fieldsData = fieldsFile.buffer.toString('utf-8');
          console.log('DEBUG - fieldsData from file:', fieldsData);
        }
      }
      
      if (!fieldsData) {
        res.status(400).json({ 
          error: 'Missing "fields" data in request body' 
        });
        return;
      }

      let fieldData: Record<string, string | boolean | number>;
      
      try {
        // If fieldsData is already an object, use it directly
        if (typeof fieldsData === 'object' && fieldsData !== null) {
          fieldData = fieldsData;
        } else if (typeof fieldsData === 'string') {
          const trimmed = fieldsData.trim();
          
          // If it's the problematic "[object Object]" string from Swagger UI,
          // try to get it from req.body directly (Express might have parsed it)
          if (trimmed === '[object Object]' || trimmed.startsWith('[object ')) {
            // Check if Express body parser gave us the actual object
            if (req.body && typeof req.body === 'object') {
              // Find any field that looks like our data (not 'fields' itself)
              const possibleFields = Object.keys(req.body).find(key => 
                key !== 'fields' && typeof req.body[key] === 'object'
              );
              if (possibleFields) {
                fieldData = req.body[possibleFields];
              } else {
                throw new Error('Swagger UI sent invalid format. Please upload a .json file instead.');
              }
            } else {
              throw new Error('Swagger UI sent invalid format. Please upload a .json file instead.');
            }
          } else {
            // Normal JSON string - parse it
            fieldData = JSON.parse(fieldsData);
          }
        } else {
          throw new Error('Unexpected fields data type');
        }
      } catch (error) {
        res.status(400).json({ 
          error: 'Invalid JSON in "fields" parameter',
          details: error instanceof Error ? error.message : 'Could not parse JSON',
          hint: 'If using Swagger UI and getting this error, try uploading a .json file instead of entering text'
        });
        return;
      }

      const filledPdf = await pdfService.fillFormFields(
        pdfFile.buffer,
        fieldData
      );

      // Generate output filename based on input filename
      const originalName = pdfFile.originalname || 'form.pdf';
      const nameWithoutExt = originalName.replace(/\.pdf$/i, '');
      const outputFilename = `${nameWithoutExt}.filled.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${outputFilename}"`
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
