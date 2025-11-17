import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { errorHandler } from '../error.middleware';

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should handle error with default 500 status when statusCode is 200', () => {
    const error = new Error('Test error message');
    mockResponse.statusCode = 200;

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Test error message',
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
  });

  it('should preserve existing status code when not 200', () => {
    const error = new Error('Bad request error');
    mockResponse.statusCode = 400;

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Bad request error',
    });
  });

  it('should include stack trace in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Development error');
    error.stack = 'Error stack trace';

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Development error',
      stack: 'Error stack trace',
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should not include stack trace in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Production error');
    error.stack = 'Error stack trace';

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Production error',
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should use default message when error message is empty', () => {
    const error = new Error('');

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Internal server error',
    });
  });

  it('should handle multer LIMIT_FILE_SIZE error', () => {
    const error = new multer.MulterError('LIMIT_FILE_SIZE');

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'File size too large. Maximum allowed size is 10MB',
    });
  });

  it('should handle other multer errors', () => {
    const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: expect.stringContaining('File upload error'),
    });
  });

  it('should handle custom file filter errors', () => {
    const error = new Error('Only PDF files are allowed');

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Only PDF files are allowed',
    });
  });
});
