import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: number;
      role: string;
    };
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const [userId, role] = String(authHeader).split(':');
  const parsedId = Number(userId);

  if (!parsedId || !role) {
    res.status(401).json({ error: 'Invalid authorization header' });
    return;
  }

  req.user = { id: parsedId, role };
  next();
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ error: 'Forbidden: insufficient role' });
      return;
    }
    next();
  };
}