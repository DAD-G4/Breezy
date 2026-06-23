import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, UserRole } from '../types';

/**
 * Returns the JWT_SECRET from environment.
 * Throws on startup if not configured — prevents insecure fallback.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

let cachedJwtSecret: string | null = null;
function getJwtSecretLazy(): string {
  if (cachedJwtSecret === null) {
    cachedJwtSecret = getJwtSecret();
  }
  return cachedJwtSecret;
}

interface JwtPayload {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

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
    const decoded = jwt.verify(token, getJwtSecretLazy(), { algorithms: ['HS256'] }) as JwtPayload;
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

/**
 * Role-based access control middleware.
 * MUST be used AFTER authenticateToken.
 */
const ROLE_HIERARCHY: Record<string, number> = {
  [UserRole.USER]: 0,
  [UserRole.MODERATOR]: 1,
  [UserRole.ADMIN]: 2,
};

export function requireRole(minimumRole: UserRole) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 0;

    if (userLevel < requiredLevel) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }

    next();
  };
}

export function createBanChecker(BanModel: any) {
  return async (userId: number) => {
    const ban = await BanModel.findOne({ where: { user_id: userId } });
    if (!ban) return null;
    return { user_id: ban.user_id, expires_at: ban.expires_at };
  };
}
