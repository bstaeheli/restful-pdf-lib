import jestOpenAPI from 'jest-openapi';
import { swaggerSpec } from '../config/swagger';

/**
 * Initialize jest-openapi with our Swagger specification.
 * This adds custom matchers like toSatisfyApiSpec() to Jest.
 */
export const setupOpenAPIValidation = (): void => {
  jestOpenAPI(swaggerSpec as Parameters<typeof jestOpenAPI>[0]);
};

/**
 * Helper type for API responses that can be validated against OpenAPI spec
 */
export interface ValidatableResponse {
  status: number;
  body?: unknown;
  req?: {
    method: string;
    path: string;
  };
}
