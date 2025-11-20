import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from 'pdf-lib';
import { PdfFormField } from '../types/pdf.types';

// Internal type for fields with sorting metadata
interface PdfFormFieldWithSort extends PdfFormField {
  _pageIndex: number;
  _y: number;
  _x: number;
}

/**
 * Service class for PDF manipulation operations using pdf-lib.
 * Provides methods to extract form fields and fill PDF forms.
 */
export class PdfService {
  /**
   * Extracts all form fields from a PDF document.
   * 
   * @param pdfBuffer - Buffer containing the PDF file data
   * @returns Array of form fields with their metadata (name, type, value, options, maxLength)
   * @throws Error if PDF cannot be loaded or parsed
   * 
   * @example
   * ```typescript
   * const pdfBuffer = fs.readFileSync('form.pdf');
   * const fields = await pdfService.extractFormFields(pdfBuffer);
   * console.log(fields); // [{ name: 'fullName', type: 'text', value: 'John' }, ...]
   * ```
   */
  async extractFormFields(pdfBuffer: Buffer): Promise<PdfFormField[]> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    // Conversion factor: PDF points to centimeters
    const POINTS_TO_CM = 0.0352778;
    
    const extractedFields: PdfFormFieldWithSort[] = [];

    for (const field of fields) {
      const fieldName = field.getName();
      let fieldType = 'unknown';
      let fieldValue: string | boolean | number | undefined;
      let options: string[] | undefined;
      let maxLength: number | undefined;

      // Get field position for sorting
      let pageIndex = 0;
      let y = 0;
      let x = 0;
      let width = 0;
      let height = 0;

      try {
        // Access internal acroField API (not in public types)
        const widgets = (field as { acroField?: { getWidgets?: () => unknown[] } }).acroField?.getWidgets?.();
        const firstWidget = widgets?.[0] as { dict?: unknown; getRectangle?: () => { x: number; y: number; width: number; height: number } } | undefined;

        if (firstWidget && firstWidget.dict) {
          // Find which page this widget is on by matching the annotation reference/dict
          const pages = pdfDoc.getPages();
          const widgetRef = (firstWidget as { ref?: unknown }).ref;
          const pdfContext = (pdfDoc as unknown as { context?: { lookup?: (ref: unknown) => unknown } }).context;

          for (let i = 0; i < pages.length; i++) {
            const annots = pages[i].node.Annots();
            if (!annots) {
              continue;
            }

            const annotsArray = annots.asArray();
            const hasWidget = annotsArray.some((annotRef: unknown) => {
              if (widgetRef && annotRef === widgetRef) {
                return true;
              }

              if (pdfContext?.lookup) {
                const resolved = pdfContext.lookup(annotRef);
                if (resolved === firstWidget.dict) {
                  return true;
                }
              }

              return false;
            });

            if (hasWidget) {
              pageIndex = i;
              break;
            }
          }

          // Get widget position (rectangle)
          if (firstWidget.getRectangle) {
            const rect = firstWidget.getRectangle();
            x = rect.x;
            y = rect.y;
            width = rect.width;
            height = rect.height;
          }
        }
      } catch {
        // If position extraction fails, use defaults (0,0,0,0)
        // This allows the API to still work even if position can't be determined
      }

      if (field instanceof PDFTextField) {
        fieldType = 'text';
        fieldValue = field.getText() || undefined;
        maxLength = field.getMaxLength() || undefined;
      } else if (field instanceof PDFCheckBox) {
        fieldType = 'checkbox';
        fieldValue = field.isChecked();
      } else if (field instanceof PDFRadioGroup) {
        fieldType = 'radio';
        fieldValue = field.getSelected() || undefined;
        options = field.getOptions();
      } else if (field instanceof PDFDropdown) {
        fieldType = 'dropdown';
        fieldValue = field.getSelected()?.[0] || undefined;
        options = field.getOptions();
      }

      extractedFields.push({
        name: fieldName,
        type: fieldType,
        value: fieldValue,
        ...(options && { options }),
        ...(maxLength && { maxLength }),
        position: {
          pageIndex,
          x: Math.round(x * POINTS_TO_CM * 100) / 100, // Convert to cm, round to 2 decimals
          y: Math.round(y * POINTS_TO_CM * 100) / 100,
          width: Math.round(width * POINTS_TO_CM * 100) / 100,
          height: Math.round(height * POINTS_TO_CM * 100) / 100
        },
        // Store for sorting
        _pageIndex: pageIndex,
        _y: y,
        _x: x
      });
    }

    // Sort by page (ascending), then Y-position (descending for top-to-bottom), then X-position (ascending for left-to-right)
    extractedFields.sort((a, b) => {
      if (a._pageIndex !== b._pageIndex) {
        return a._pageIndex - b._pageIndex; // Earlier pages first
      }
      if (Math.abs(a._y - b._y) > 10) { // Allow 10 point tolerance for "same row"
        return b._y - a._y; // Higher Y values first (PDF coordinates: top = higher Y)
      }
      return a._x - b._x; // Left to right
    });

    // Remove internal sorting metadata before returning (keep position)
    return extractedFields.map(({ _pageIndex, _y, _x, ...field }) => field);
  }

  /**
   * Fills form fields in a PDF document with provided data.
   * 
   * @param pdfBuffer - Buffer containing the PDF file data
   * @param fieldData - Object mapping field names to their values
   * @returns Buffer containing the filled PDF
   * @throws Error if PDF cannot be loaded or saved
   * 
   * @remarks
   * - Text fields accept string or number values (numbers are converted to strings)
   * - Checkboxes accept boolean values
   * - Radio groups and dropdowns accept string values
   * - Invalid field names are silently skipped (logged in non-test environments)
   * - Type mismatches are silently skipped (e.g., string for checkbox)
   * 
   * @example
   * ```typescript
   * const pdfBuffer = fs.readFileSync('form.pdf');
   * const fieldData = { fullName: 'Jane Doe', agree: true, country: 'USA' };
   * const filledPdf = await pdfService.fillFormFields(pdfBuffer, fieldData);
   * fs.writeFileSync('filled.pdf', filledPdf);
   * ```
   */
  async fillFormFields(
    pdfBuffer: Buffer,
    fieldData: Record<string, string | boolean | number>
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const form = pdfDoc.getForm();

    for (const [fieldName, fieldValue] of Object.entries(fieldData)) {
      try {
        const field = form.getField(fieldName);

        if (field instanceof PDFTextField) {
          if (typeof fieldValue === 'string') {
            field.setText(fieldValue);
          } else {
            field.setText(String(fieldValue));
          }
        } else if (field instanceof PDFCheckBox) {
          if (typeof fieldValue === 'boolean') {
            if (fieldValue) {
              field.check();
            } else {
              field.uncheck();
            }
          }
        } else if (field instanceof PDFRadioGroup) {
          if (typeof fieldValue === 'string') {
            field.select(fieldValue);
          }
        } else if (field instanceof PDFDropdown) {
          if (typeof fieldValue === 'string') {
            field.select(fieldValue);
          }
        }
      } catch (error) {
        // Only log warnings in non-test environments
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`Failed to set field "${fieldName}":`, error);
        }
        // Continue with other fields even if one fails
      }
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
