import { Request, Response, NextFunction } from 'express';

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
