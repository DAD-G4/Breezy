import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel, ProfileModel, success, error, getJwtSecret } from '@breezy/shared';
import { validateRegisterInput } from '../validators/auth';

const JWT_SECRET = getJwtSecret();
const SALT_ROUNDS = 10;
const JWT_EXPIRY = '1h';

/**
 * POST /api/auth/register
 * Create a new user with profile.
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, username, password } = req.body;

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

    success(res, null, 'User created successfully', 201);
  } catch (err) {
    console.error('[Register]', err);
    error(res, 'Internal server error', 500);
  }
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT.
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
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

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    }, 'Login successful');
  } catch (err) {
    console.error('[Login]', err);
    error(res, 'Internal server error', 500);
  }
}
