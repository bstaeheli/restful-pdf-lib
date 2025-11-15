export interface PdfFormField {
  name: string;
  type: string;
  value?: string | boolean | number;
  options?: string[];
  maxLength?: number;
}

export interface FillFormRequest {
  fields: Record<string, string | boolean | number>;
}

export interface ExtractFieldsResponse {
  fields: PdfFormField[];
}
