import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

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
