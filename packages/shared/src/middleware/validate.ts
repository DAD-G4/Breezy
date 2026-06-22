import { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return 'Email is required';
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'Invalid email format';
  }
  return null;
}

export function validateUsername(username: string): string | null {
  if (!username || typeof username !== 'string') {
    return 'Username is required';
  }
  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (username.length > 30) {
    return 'Username must be at most 30 characters';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password || typeof password !== 'string') {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
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
