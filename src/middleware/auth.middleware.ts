import { Request, Response, NextFunction } from 'express';

/**
 * Authentication middleware to validate API secret.
 * Checks the Authorization header against the API_SECRET environment variable.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * 
 * @remarks
 * - Returns 500 if API_SECRET is not configured
 * - Returns 401 if Authorization header is missing
 * - Returns 403 if Authorization header doesn't match API_SECRET
 * - Calls next() if authentication succeeds
 * 
 * @example
 * ```typescript
 * app.use('/api', authMiddleware);
 * ```
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiSecret = process.env.API_SECRET;
  
  if (!apiSecret) {
    res.status(500).json({ 
      error: 'Server configuration error: API_SECRET not set' 
    });
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ 
      error: 'Unauthorized: Missing Authorization header' 
    });
    return;
  }

  if (authHeader !== apiSecret) {
    res.status(403).json({ 
      error: 'Forbidden: Invalid API secret' 
    });
    return;
  }

  next();
};
