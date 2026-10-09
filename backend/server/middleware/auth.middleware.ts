import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../models/store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'deepresearch_research_engine_jwt_secret_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    isGuest?: boolean;
  };
}

export function generateToken(user: { id: string; email: string; name: string; isGuest?: boolean }): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      // Auto-assign or allow guest identity so no user is locked out
      const guestId = (req.headers['x-guest-id'] as string) || 'guest_user';
      req.user = {
        id: guestId,
        email: `${guestId}@research.engine`,
        name: 'Guest Scholar',
        isGuest: true,
      };
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      return next();
    } catch {
      // Invalid token, assign guest fallback
      req.user = {
        id: 'guest_user',
        email: 'guest@research.engine',
        name: 'Guest Scholar',
        isGuest: true,
      };
      return next();
    }
  } catch (error) {
    next(error);
  }
}
