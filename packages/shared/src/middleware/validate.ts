import { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response';

// Sound, pragmatic email format: a local part, an @, a domain, and a dotted TLD,
// with no spaces anywhere. RFC 5321 caps the whole address at 254 characters.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;

// Usernames are lowercased before validation (see authController), so we only
// allow the lowercased character set here: letters, digits, underscore, dot.
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;
const USERNAME_REGEX = /^[a-z0-9_.]+$/;

// Reserved handles we never want a user to claim (impersonation / confusion).
const RESERVED_USERNAMES = new Set(['admin', 'root', 'support', 'breezy', 'moderator']);

// Allow long passphrases but cap the length to avoid a bcrypt DoS on huge input.
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const PASSWORD_SPECIAL_REGEX = /[^A-Za-z0-9]/;

export function validateEmail(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return 'Email is required';
  }
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return 'Email is required';
  }
  if (trimmed.length > EMAIL_MAX_LENGTH) {
    return `Email must be at most ${EMAIL_MAX_LENGTH} characters`;
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Invalid email format';
  }
  return null;
}

export function validateUsername(username: string): string | null {
  if (!username || typeof username !== 'string') {
    return 'Username is required';
  }
  if (username.trim().length === 0) {
    return 'Username is required';
  }
  if (username.length < USERNAME_MIN_LENGTH) {
    return `Username must be at least ${USERNAME_MIN_LENGTH} characters`;
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return `Username must be at most ${USERNAME_MAX_LENGTH} characters`;
  }
  if (!USERNAME_REGEX.test(username)) {
    return 'Username can only contain lowercase letters, digits, underscores and dots';
  }
  if (/^[._]|[._]$/.test(username)) {
    return 'Username cannot start or end with a dot or underscore';
  }
  if (username.includes('..')) {
    return 'Username cannot contain consecutive dots';
  }
  if (RESERVED_USERNAMES.has(username)) {
    return 'This username is reserved';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password || typeof password !== 'string') {
    return 'Password is required';
  }
  if (password.trim().length === 0) {
    return 'Password cannot be empty or whitespace only';
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
  }

  const missing: string[] = [];
  if (!/[a-z]/.test(password)) missing.push('one lowercase letter');
  if (!/[A-Z]/.test(password)) missing.push('one uppercase letter');
  if (!/[0-9]/.test(password)) missing.push('one digit');
  if (!PASSWORD_SPECIAL_REGEX.test(password)) missing.push('one special character');

  if (missing.length > 0) {
    return `Password must contain at least ${missing.join(', ')}`;
  }
  return null;
}

export interface RegisterInput {
  email?: string;
  username?: string;
  password?: string;
}

/**
 * Validate the full registration payload.
 * Returns an array of error messages (empty = valid).
 */
export function validateRegisterInput(input: RegisterInput): string[] {
  const errors: string[] = [];

  const emailErr = validateEmail(input.email as string);
  if (emailErr) errors.push(emailErr);

  const usernameErr = validateUsername(input.username as string);
  if (usernameErr) errors.push(usernameErr);

  const passwordErr = validatePassword(input.password as string);
  if (passwordErr) errors.push(passwordErr);

  return errors;
}

/**
 * Create an Express middleware that validates `req.body.content`
 * is a non-empty string not exceeding `maxLength` characters.
 */
export function validateContent(maxLength: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      error(res, 'Content is required', 400);
      return;
    }
    if (content.length > maxLength) {
      error(res, `Content cannot exceed ${maxLength} characters`, 400);
      return;
    }
    next();
  };
}

export const validatePostContent = validateContent(280);
export const validateCommentContent = validateContent(280);

export function validateRequired(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missing = fields.filter((f) => {
      const val = req.body[f];
      return val === undefined || val === null || val === '';
    });
    if (missing.length > 0) {
      error(res, `Missing required fields: ${missing.join(', ')}`, 400);
      return;
    }
    next();
  };
}

export function validateDMContent(req: Request, res: Response, next: NextFunction): void {
  const { recipient_id, message_text } = req.body;
  if (!recipient_id || typeof recipient_id !== 'number') {
    error(res, 'Recipient ID is required and must be a number', 400);
    return;
  }
  if (!message_text || typeof message_text !== 'string') {
    error(res, 'Message text is required', 400);
    return;
  }
  if (message_text.trim().length === 0) {
    error(res, 'Message text cannot be empty', 400);
    return;
  }
  if (message_text.length > 1000) {
    error(res, 'Message text cannot exceed 1000 characters', 400);
    return;
  }
  next();
}

export function validateLoginInput(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body;
  if (!email || !password) {
    error(res, 'Email and password are required', 400);
    return;
  }
  next();
}

export function validateReportInput(req: Request, res: Response, next: NextFunction): void {
  const { target_type, target_id, reason } = req.body;
  if (!target_type) {
    error(res, 'target_type is required.', 400);
    return;
  }
  if (!target_id) {
    error(res, 'target_id is required.', 400);
    return;
  }
  if (!reason || !reason.trim()) {
    error(res, 'reason is required and must be non-empty.', 400);
    return;
  }
  next();
}

export function validateBanInput(req: Request, res: Response, next: NextFunction): void {
  const { user_id, reason } = req.body;
  if (!user_id) {
    error(res, 'user_id is required.', 400);
    return;
  }
  if (!reason || !reason.trim()) {
    error(res, 'reason is required.', 400);
    return;
  }
  next();
}
