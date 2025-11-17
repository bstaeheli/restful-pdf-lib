import { PDFDocument } from 'pdf-lib';
import { PdfService } from '../pdf.service';

describe('PdfService', () => {
  let pdfService: PdfService;

  beforeEach(() => {
    pdfService = new PdfService();
  });

  describe('extractFormFields', () => {
    it('should extract radio group fields', async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const form = pdfDoc.getForm();

      const radioGroup = form.createRadioGroup('gender');
      radioGroup.addOptionToPage('male', page, { x: 50, y: 350, width: 20, height: 20 });
      radioGroup.addOptionToPage('female', page, { x: 50, y: 320, width: 20, height: 20 });
      radioGroup.select('male');

      const pdfBytes = await pdfDoc.save();
      const fields = await pdfService.extractFormFields(Buffer.from(pdfBytes));

      const radioField = fields.find((f) => f.name === 'gender');
      expect(radioField).toBeDefined();
      expect(radioField?.type).toBe('radio');
      expect(radioField?.value).toBe('male');
      expect(radioField?.options).toEqual(['male', 'female']);
    });

    it('should extract dropdown fields', async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const form = pdfDoc.getForm();

      const dropdown = form.createDropdown('country');
      dropdown.addOptions(['USA', 'Canada', 'Mexico']);
      dropdown.select('Canada');
      dropdown.addToPage(page, { x: 50, y: 350, width: 200, height: 30 });

      const pdfBytes = await pdfDoc.save();
      const fields = await pdfService.extractFormFields(Buffer.from(pdfBytes));

      const dropdownField = fields.find((f) => f.name === 'country');
      expect(dropdownField).toBeDefined();
      expect(dropdownField?.type).toBe('dropdown');
      expect(dropdownField?.value).toBe('Canada');
      expect(dropdownField?.options).toEqual(['USA', 'Canada', 'Mexico']);
    });

    it('should handle radio group with no selection', async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const form = pdfDoc.getForm();

      const radioGroup = form.createRadioGroup('choice');
      radioGroup.addOptionToPage('option1', page, { x: 50, y: 350, width: 20, height: 20 });
      radioGroup.addOptionToPage('option2', page, { x: 50, y: 320, width: 20, height: 20 });

      const pdfBytes = await pdfDoc.save();
      const fields = await pdfService.extractFormFields(Buffer.from(pdfBytes));

      const radioField = fields.find((f) => f.name === 'choice');
      expect(radioField).toBeDefined();
      expect(radioField?.type).toBe('radio');
      expect(radioField?.value).toBeUndefined();
    });

    it('should handle dropdown with no selection', async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const form = pdfDoc.getForm();

      const dropdown = form.createDropdown('language');
      dropdown.addOptions(['English', 'Spanish', 'French']);
      dropdown.addToPage(page, { x: 50, y: 350, width: 200, height: 30 });

      const pdfBytes = await pdfDoc.save();
      const fields = await pdfService.extractFormFields(Buffer.from(pdfBytes));

      const dropdownField = fields.find((f) => f.name === 'language');
      expect(dropdownField).toBeDefined();
      expect(dropdownField?.type).toBe('dropdown');
      expect(dropdownField?.value).toBeUndefined();
    });
  });

  describe('fillFormFields', () => {
    it('should fill radio group fields', async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const form = pdfDoc.getForm();

      const radioGroup = form.createRadioGroup('gender');
      radioGroup.addOptionToPage('male', page, { x: 50, y: 350, width: 20, height: 20 });
      radioGroup.addOptionToPage('female', page, { x: 50, y: 320, width: 20, height: 20 });

      const pdfBytes = await pdfDoc.save();

      const filledPdfBuffer = await pdfService.fillFormFields(Buffer.from(pdfBytes), {
        gender: 'female',
      });

      const filledDoc = await PDFDocument.load(filledPdfBuffer);
      const filledForm = filledDoc.getForm();
      const filledRadio = filledForm.getRadioGroup('gender');
      expect(filledRadio.getSelected()).toBe('female');
    });

    it('should fill dropdown fields', async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const form = pdfDoc.getForm();

      const dropdown = form.createDropdown('country');
      dropdown.addOptions(['USA', 'Canada', 'Mexico']);
      dropdown.addToPage(page, { x: 50, y: 350, width: 200, height: 30 });

      const pdfBytes = await pdfDoc.save();

      const filledPdfBuffer = await pdfService.fillFormFields(Buffer.from(pdfBytes), {
        country: 'Mexico',
      });

      const filledDoc = await PDFDocument.load(filledPdfBuffer);
      const filledForm = filledDoc.getForm();
      const filledDropdown = filledForm.getDropdown('country');
      expect(filledDropdown.getSelected()).toEqual(['Mexico']);
    });

    it('should handle numeric values for text fields', async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const form = pdfDoc.getForm();

      const textField = form.createTextField('age');
      textField.addToPage(page, { x: 50, y: 350, width: 100, height: 30 });

      const pdfBytes = await pdfDoc.save();

      const filledPdfBuffer = await pdfService.fillFormFields(Buffer.from(pdfBytes), {
        age: 25,
      });

      const filledDoc = await PDFDocument.load(filledPdfBuffer);
      const filledForm = filledDoc.getForm();
      const filledTextField = filledForm.getTextField('age');
      expect(filledTextField.getText()).toBe('25');
    });

    it('should skip invalid field type for checkbox with non-boolean value', async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const form = pdfDoc.getForm();

      const checkbox = form.createCheckBox('agree');
      checkbox.addToPage(page, { x: 50, y: 300, width: 20, height: 20 });

      const pdfBytes = await pdfDoc.save();

      const filledPdfBuffer = await pdfService.fillFormFields(Buffer.from(pdfBytes), {
        agree: 'not a boolean' as unknown as boolean,
      });

      const filledDoc = await PDFDocument.load(filledPdfBuffer);
      const filledForm = filledDoc.getForm();
      const filledCheckbox = filledForm.getCheckBox('agree');
      // Should remain unchecked because invalid value was provided
      expect(filledCheckbox.isChecked()).toBe(false);
    });

    it('should skip invalid field type for radio with non-string value', async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const form = pdfDoc.getForm();

      const radioGroup = form.createRadioGroup('choice');
      radioGroup.addOptionToPage('yes', page, { x: 50, y: 350, width: 20, height: 20 });
      radioGroup.addOptionToPage('no', page, { x: 50, y: 320, width: 20, height: 20 });

      const pdfBytes = await pdfDoc.save();

      const filledPdfBuffer = await pdfService.fillFormFields(Buffer.from(pdfBytes), {
        choice: 123 as unknown as string,
      });

      const filledDoc = await PDFDocument.load(filledPdfBuffer);
      const filledForm = filledDoc.getForm();
      const filledRadio = filledForm.getRadioGroup('choice');
      // Should remain unselected because invalid value was provided
      expect(filledRadio.getSelected()).toBeUndefined();
    });

    it('should skip invalid field type for dropdown with non-string value', async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const form = pdfDoc.getForm();

      const dropdown = form.createDropdown('language');
      dropdown.addOptions(['English', 'Spanish']);
      dropdown.addToPage(page, { x: 50, y: 350, width: 200, height: 30 });

      const pdfBytes = await pdfDoc.save();

      const filledPdfBuffer = await pdfService.fillFormFields(Buffer.from(pdfBytes), {
        language: true as unknown as string,
      });

      const filledDoc = await PDFDocument.load(filledPdfBuffer);
      const filledForm = filledDoc.getForm();
      const filledDropdown = filledForm.getDropdown('language');
      // Should remain unselected because invalid value was provided
      expect(filledDropdown.getSelected()).toEqual([]);
    });
  });
});
