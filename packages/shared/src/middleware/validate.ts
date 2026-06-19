import { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function validatePostContent(req: Request, res: Response, next: NextFunction): void {
  const { content } = req.body;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    error(res, 'Content is required', 400);
    return;
  }
  if (content.length > 280) {
    error(res, 'Content cannot exceed 280 characters', 400);
    return;
  }
  next();
}

export function validateCommentContent(req: Request, res: Response, next: NextFunction): void {
  const { content } = req.body;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    error(res, 'Content is required', 400);
    return;
  }
  if (content.length > 280) {
    error(res, 'Content cannot exceed 280 characters', 400);
    return;
  }
  next();
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
