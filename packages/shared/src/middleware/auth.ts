import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

interface JwtPayload {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

/**
 * JWT authentication middleware.
 * - Extracts token from Authorization header (Bearer <token>)
 * - Verifies token with JWT_SECRET
 * - Attaches decoded user to req.user
 * - Returns 401 for invalid/expired tokens
 */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired.' });
      return;
    }
    res.status(401).json({ error: 'Invalid token.' });
  }
}

/**
 * Ban-check middleware.
 * MUST be used AFTER authenticateToken.
 * - Queries the Ban model to check if the user is currently banned
 * - Returns 403 for banned users
 *
 * The `checkBan` function accepts a BanChecker callback so the actual
 * database query is provided by the service layer (no direct DB dependency here).
 */
export interface BanRecord {
  user_id: number;
  expires_at: Date | null;
}

export type BanChecker = (userId: number) => Promise<BanRecord | null>;

export function checkBan(banChecker: BanChecker) {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    try {
      const ban = await banChecker(req.user.id);

      if (ban) {
        // If ban has an expiry and it's in the past, the ban has lapsed
        if (ban.expires_at && new Date(ban.expires_at) < new Date()) {
          next();
          return;
        }
        res.status(403).json({ error: 'User is banned.' });
        return;
      }

      next();
    } catch (err) {
      // Database error during ban check – fail closed
      res.status(500).json({ error: 'Failed to verify user status.' });
    }
  };
}

export default authenticateToken;
