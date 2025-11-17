import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from 'pdf-lib';
import { PdfFormField } from '../types/pdf.types';

export class PdfService {
  async extractFormFields(pdfBuffer: Buffer): Promise<PdfFormField[]> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    const extractedFields: PdfFormField[] = [];

    for (const field of fields) {
      const fieldName = field.getName();
      let fieldType = 'unknown';
      let fieldValue: string | boolean | number | undefined;
      let options: string[] | undefined;
      let maxLength: number | undefined;

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
        ...(maxLength && { maxLength })
      });
    }

    return extractedFields;
  }

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
