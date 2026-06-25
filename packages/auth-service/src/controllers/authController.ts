import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel, ProfileModel, Ban, success, error, getJwtSecret, validateRegisterInput, UserRole } from '@breezy/shared';

const JWT_SECRET = getJwtSecret();
const SALT_ROUNDS = 10;
const JWT_EXPIRY = '1h';
const REFRESH_EXPIRY = '7d';

const isProduction = process.env.NODE_ENV === 'production';

interface JwtPayload {
  id: number;
  username: string;
  email: string;
  role: string;
}

/**
 * Generate access + refresh tokens and set them as httpOnly cookies.
 */
function setAuthCookies(res: Response, user: { id: number; username: string; email: string; role: string }): void {
  const accessToken = jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRY }
  );

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 3600000, // 1 hour
    path: '/',
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 604800000, // 7 days
    path: '/api/auth',
  });
}

/**
 * Clear auth cookies on logout.
 */
function clearAuthCookies(res: Response): void {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/auth' });
}

/**
 * POST /api/auth/register
 * Create a new user with profile, then auto-login via cookies.
 */
export async function register(req: Request, res: Response): Promise<void> {
  const { email, username: rawUsername, password } = req.body;
  const username = rawUsername?.toLowerCase?.() ?? rawUsername;

  const validationErrors = validateRegisterInput({ email, username, password });
  if (validationErrors.length > 0) {
    error(res, validationErrors.join(', '), 400);
    return;
  }

  const existingUser = await UserModel.findOne({ where: { email } });
  if (existingUser) {
    error(res, 'Email already in use', 409);
    return;
  }

  const existingUsername = await UserModel.findOne({ where: { username } });
  if (existingUsername) {
    error(res, 'Username already in use', 409);
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await UserModel.create({
    email,
    username,
    password_hash: passwordHash,
    role: 'user',
  });

  await ProfileModel.create({
    user_id: user.id,
    display_name: username,
  });

  // Auto-login: set auth cookies after registration
  const userData = { id: user.id, username: user.username, email: user.email, role: user.role };
  setAuthCookies(res, userData);

  success(res, { user: userData }, 'User created successfully', 201);
}

/**
 * POST /api/auth/admin/register
 * Admin-only: create a new STANDARD user account (rôle toujours "user" —
 * un admin ne peut pas créer de modérateur ni d'admin).
 * Does NOT auto-login — l'admin garde sa propre session.
 */
export async function adminRegister(req: Request, res: Response): Promise<void> {
  const { email, username: rawUsername, password } = req.body;
  const username = rawUsername?.toLowerCase?.() ?? rawUsername;

  const validationErrors = validateRegisterInput({ email, username, password });
  if (validationErrors.length > 0) {
    error(res, validationErrors.join(', '), 400);
    return;
  }

  const existingUser = await UserModel.findOne({ where: { email } });
  if (existingUser) {
    error(res, 'Email already in use', 409);
    return;
  }

  const existingUsername = await UserModel.findOne({ where: { username } });
  if (existingUsername) {
    error(res, 'Username already in use', 409);
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Rôle figé : un admin ne crée que des utilisateurs standards.
  const user = await UserModel.create({
    email,
    username,
    password_hash: passwordHash,
    role: UserRole.USER,
  });

  await ProfileModel.create({
    user_id: user.id,
    display_name: username,
  });

  const userData = { id: user.id, username: user.username, email: user.email, role: user.role };
  success(res, { user: userData }, 'Account created successfully', 201);
}

/**
 * POST /api/auth/login
 * Authenticate user and set JWT as httpOnly cookie.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    error(res, 'Email and password are required', 400);
    return;
  }

  const user = await UserModel.findOne({ where: { email } });
  if (!user) {
    error(res, 'Invalid credentials', 401);
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    error(res, 'Invalid credentials', 401);
    return;
  }

  // Refuse l'authentification si le compte est banni (ban permanent ou non expiré).
  const ban = await Ban.findOne({ where: { user_id: user.id } });
  if (ban && (!ban.expires_at || new Date(ban.expires_at) > new Date())) {
    error(res, 'Votre compte a été suspendu. Vous ne pouvez pas vous connecter.', 403);
    return;
  }

  const userData = { id: user.id, username: user.username, email: user.email, role: user.role };
  setAuthCookies(res, userData);

  success(res, { user: userData }, 'Login successful');
}

/**
 * GET /api/auth/me
 * Return the current user from the accessToken cookie.
 */
export async function me(req: Request, res: Response): Promise<void> {
  const token = (req as any).cookies?.accessToken;

  if (!token) {
    error(res, 'Not authenticated', 401);
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
    success(res, {
      user: {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
      },
    });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      error(res, 'Token expired', 401);
      return;
    }
    error(res, 'Invalid token', 401);
  }
}

/**
 * POST /api/auth/refresh
 * Émet un nouveau accessToken (et refreshToken) à partir du refreshToken cookie.
 * Permet de prolonger la session sans re-login (l'access token expire en 1h).
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  const token = (req as any).cookies?.refreshToken;

  if (!token) {
    error(res, 'No refresh token', 401);
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
    const userData = { id: decoded.id, username: decoded.username, email: decoded.email, role: decoded.role };
    setAuthCookies(res, userData);
    success(res, { user: userData }, 'Token refreshed');
  } catch {
    clearAuthCookies(res);
    error(res, 'Invalid refresh token', 401);
  }
}

/**
 * POST /api/auth/logout
 * Clear auth cookies.
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  clearAuthCookies(res);
  success(res, null, 'Logged out successfully');
}
