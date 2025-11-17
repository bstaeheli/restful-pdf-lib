import { setupOpenAPIValidation } from '../../test-utils/openapi-validator';

describe('OpenAPI Validation Setup', () => {
  it('should initialize jest-openapi matchers', () => {
    setupOpenAPIValidation();
    expect(expect.extend).toBeDefined();
  });
});
