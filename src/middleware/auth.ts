import { Request, Response, NextFunction } from 'express';

// Mock: In a real app, use JWT or session. Here, expect user info in headers for simplicity.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Example: client sends { "authorization": "userId:role" }
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });

  const [userId, role] = String(authHeader).split(':');
  if (!userId || !role) return res.status(401).json({ error: 'Invalid authorization header' });

  // Attach user info to request
  (req as any).user = { id: Number(userId), role };
  next();
}

// Middleware to require a specific role
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== role) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
} 