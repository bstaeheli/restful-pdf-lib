import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

/**
 * Global error handler middleware for Express application.
 * Handles various types of errors including multer file upload errors.
 * 
 * @param err - Error object
 * @param _req - Express request object (unused)
 * @param res - Express response object
 * @param _next - Express next function (unused, required for error handler signature)
 * 
 * @remarks
 * - Multer LIMIT_FILE_SIZE errors return 400 with friendly message
 * - Other multer errors return 400 with error details
 * - File filter errors (e.g., wrong file type) return 400
 * - Stack traces are only included in development environment
 * - Preserves existing status code if set, otherwise defaults to 500
 * 
 * @example
 * ```typescript
 * // Must be added as the last middleware in Express app
 * app.use(errorHandler);
 * ```
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  // Handle multer errors specifically
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        error: 'File size too large. Maximum allowed size is 10MB',
      });
      return;
    }
    res.status(400).json({
      error: `File upload error: ${err.message}`,
    });
    return;
  }

  // Handle custom file filter errors (from multer)
  if (err.message === 'Only PDF files are allowed') {
    res.status(400).json({
      error: err.message,
    });
    return;
  }

  // Handle other errors
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
