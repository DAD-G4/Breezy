import { Request, Response, NextFunction } from 'express';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validateRegisterInput,
  validateContent,
  validatePostContent,
  validateCommentContent,
  validateRequired,
  validateDMContent,
  validateLoginInput,
  validateReportInput,
  validateBanInput,
} from '../src/middleware/validate';

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

function mockReq(body: Record<string, unknown> = {}): Request {
  return { body } as Request;
}

const mockNext = jest.fn() as unknown as NextFunction;

describe('validateEmail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null for a valid email', () => {
    expect(validateEmail('user@example.com')).toBeNull();
  });

  it('returns null for a valid email with subdomain', () => {
    expect(validateEmail('user@mail.example.com')).toBeNull();
  });

  it('returns error when email is empty string', () => {
    expect(validateEmail('')).toBe('Email is required');
  });

  it('returns error when email is undefined', () => {
    expect(validateEmail(undefined as unknown as string)).toBe('Email is required');
  });

  it('returns error when email is null', () => {
    expect(validateEmail(null as unknown as string)).toBe('Email is required');
  });

  it('returns error for email without @ sign', () => {
    expect(validateEmail('userexample.com')).toBe('Invalid email format');
  });

  it('returns error for email without domain', () => {
    expect(validateEmail('user@')).toBe('Invalid email format');
  });

  it('returns error for email without TLD', () => {
    expect(validateEmail('user@example')).toBe('Invalid email format');
  });

  it('returns error for email with spaces', () => {
    expect(validateEmail('user @example.com')).toBe('Invalid email format');
  });

  it('returns error for non-string input', () => {
    expect(validateEmail(123 as unknown as string)).toBe('Email is required');
  });
});

describe('validateUsername', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null for a valid username', () => {
    expect(validateUsername('alice')).toBeNull();
  });

  it('returns null for username with exactly 3 characters', () => {
    expect(validateUsername('abc')).toBeNull();
  });

  it('returns null for username with exactly 30 characters', () => {
    expect(validateUsername('a'.repeat(30))).toBeNull();
  });

  it('returns error when username is empty', () => {
    expect(validateUsername('')).toBe('Username is required');
  });

  it('returns error when username is undefined', () => {
    expect(validateUsername(undefined as unknown as string)).toBe('Username is required');
  });

  it('returns error when username is too short (2 chars)', () => {
    expect(validateUsername('ab')).toBe('Username must be at least 3 characters');
  });

  it('returns error when username is too long (31 chars)', () => {
    expect(validateUsername('a'.repeat(31))).toBe('Username must be at most 30 characters');
  });

  it('returns error for non-string input', () => {
    expect(validateUsername(42 as unknown as string)).toBe('Username is required');
  });
});

describe('validatePassword', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null for a valid password (8 chars)', () => {
    expect(validatePassword('password1')).toBeNull();
  });

  it('returns null for a long password', () => {
    expect(validatePassword('a'.repeat(100))).toBeNull();
  });

  it('returns error when password is empty', () => {
    expect(validatePassword('')).toBe('Password is required');
  });

  it('returns error when password is undefined', () => {
    expect(validatePassword(undefined as unknown as string)).toBe('Password is required');
  });

  it('returns error when password is too short (7 chars)', () => {
    expect(validatePassword('1234567')).toBe('Password must be at least 8 characters');
  });

  it('returns error for non-string input', () => {
    expect(validatePassword(null as unknown as string)).toBe('Password is required');
  });
});

describe('validateRegisterInput', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns empty array for valid input', () => {
    const errors = validateRegisterInput({
      email: 'user@example.com',
      username: 'alice',
      password: 'password1',
    });
    expect(errors).toEqual([]);
  });

  it('returns all errors for completely invalid input', () => {
    const errors = validateRegisterInput({});
    expect(errors).toContain('Email is required');
    expect(errors).toContain('Username is required');
    expect(errors).toContain('Password is required');
    expect(errors).toHaveLength(3);
  });

  it('returns single error for invalid email only', () => {
    const errors = validateRegisterInput({
      email: 'not-an-email',
      username: 'alice',
      password: 'password1',
    });
    expect(errors).toEqual(['Invalid email format']);
  });

  it('returns errors for multiple invalid fields', () => {
    const errors = validateRegisterInput({
      email: 'bad',
      username: 'ab',
      password: 'short',
    });
    expect(errors).toHaveLength(3);
  });
});

describe('validateContent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls next() for valid content within maxLength', () => {
    const middleware = validateContent(280);
    const req = mockReq({ content: 'Hello world' });
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('returns 400 when content is missing', () => {
    const middleware = validateContent(280);
    const req = mockReq({});
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Content is required',
      statusCode: 400,
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 400 when content is empty string', () => {
    const middleware = validateContent(280);
    const req = mockReq({ content: '' });
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when content is whitespace only', () => {
    const middleware = validateContent(280);
    const req = mockReq({ content: '   ' });
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when content is not a string', () => {
    const middleware = validateContent(280);
    const req = mockReq({ content: 12345 });
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when content exceeds maxLength', () => {
    const middleware = validateContent(10);
    const req = mockReq({ content: 'This is a very long message' });
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Content cannot exceed 10 characters',
      statusCode: 400,
    });
  });

  it('calls next() for content exactly at maxLength', () => {
    const middleware = validateContent(5);
    const req = mockReq({ content: 'hello' });
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});

describe('validatePostContent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls next() for content under 280 chars', () => {
    const req = mockReq({ content: 'Short post' });
    const res = mockRes();

    validatePostContent(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('returns 400 for content over 280 chars', () => {
    const req = mockReq({ content: 'x'.repeat(281) });
    const res = mockRes();

    validatePostContent(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe('validateCommentContent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls next() for valid comment content', () => {
    const req = mockReq({ content: 'Nice post!' });
    const res = mockRes();

    validateCommentContent(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});

describe('validateRequired', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls next() when all required fields are present', () => {
    const middleware = validateRequired(['title', 'body']);
    const req = mockReq({ title: 'Hello', body: 'World' });
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('returns 400 when a required field is missing', () => {
    const middleware = validateRequired(['title', 'body']);
    const req = mockReq({ title: 'Hello' });
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Missing required fields: body',
      statusCode: 400,
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 400 when multiple fields are missing', () => {
    const middleware = validateRequired(['title', 'body', 'author']);
    const req = mockReq({});
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Missing required fields: title, body, author',
      statusCode: 400,
    });
  });

  it('returns 400 for empty string values', () => {
    const middleware = validateRequired(['name']);
    const req = mockReq({ name: '' });
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for null values', () => {
    const middleware = validateRequired(['name']);
    const req = mockReq({ name: null });
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for undefined values', () => {
    const middleware = validateRequired(['name']);
    const req = mockReq({ name: undefined });
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('validateDMContent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls next() for valid DM input', () => {
    const req = mockReq({ recipient_id: 2, message_text: 'Hello!' });
    const res = mockRes();

    validateDMContent(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('returns 400 when recipient_id is missing', () => {
    const req = mockReq({ message_text: 'Hello!' });
    const res = mockRes();

    validateDMContent(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Recipient ID is required and must be a number',
      statusCode: 400,
    });
  });

  it('returns 400 when recipient_id is not a number', () => {
    const req = mockReq({ recipient_id: 'abc', message_text: 'Hello!' });
    const res = mockRes();

    validateDMContent(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when message_text is missing', () => {
    const req = mockReq({ recipient_id: 2 });
    const res = mockRes();

    validateDMContent(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Message text is required',
      statusCode: 400,
    });
  });

  it('returns 400 when message_text is not a string', () => {
    const req = mockReq({ recipient_id: 2, message_text: 12345 });
    const res = mockRes();

    validateDMContent(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when message_text is whitespace only', () => {
    const req = mockReq({ recipient_id: 2, message_text: '   ' });
    const res = mockRes();

    validateDMContent(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Message text cannot be empty',
      statusCode: 400,
    });
  });

  it('returns 400 when message_text exceeds 1000 chars', () => {
    const req = mockReq({ recipient_id: 2, message_text: 'a'.repeat(1001) });
    const res = mockRes();

    validateDMContent(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Message text cannot exceed 1000 characters',
      statusCode: 400,
    });
  });

  it('calls next() for message_text exactly 1000 chars', () => {
    const req = mockReq({ recipient_id: 2, message_text: 'a'.repeat(1000) });
    const res = mockRes();

    validateDMContent(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});

describe('validateLoginInput', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls next() when email and password are provided', () => {
    const req = mockReq({ email: 'user@example.com', password: 'secret' });
    const res = mockRes();

    validateLoginInput(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('returns 400 when email is missing', () => {
    const req = mockReq({ password: 'secret' });
    const res = mockRes();

    validateLoginInput(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Email and password are required',
      statusCode: 400,
    });
  });

  it('returns 400 when password is missing', () => {
    const req = mockReq({ email: 'user@example.com' });
    const res = mockRes();

    validateLoginInput(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when both are missing', () => {
    const req = mockReq({});
    const res = mockRes();

    validateLoginInput(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('validateReportInput', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls next() for valid report input', () => {
    const req = mockReq({
      target_type: 'post',
      target_id: 'abc123',
      reason: 'Inappropriate content',
    });
    const res = mockRes();

    validateReportInput(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('returns 400 when target_type is missing', () => {
    const req = mockReq({ target_id: 'abc', reason: 'Spam' });
    const res = mockRes();

    validateReportInput(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'target_type is required.',
      statusCode: 400,
    });
  });

  it('returns 400 when target_id is missing', () => {
    const req = mockReq({ target_type: 'post', reason: 'Spam' });
    const res = mockRes();

    validateReportInput(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'target_id is required.',
      statusCode: 400,
    });
  });

  it('returns 400 when reason is missing', () => {
    const req = mockReq({ target_type: 'post', target_id: 'abc' });
    const res = mockRes();

    validateReportInput(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'reason is required and must be non-empty.',
      statusCode: 400,
    });
  });

  it('returns 400 when reason is empty string', () => {
    const req = mockReq({ target_type: 'post', target_id: 'abc', reason: '' });
    const res = mockRes();

    validateReportInput(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when reason is whitespace only', () => {
    const req = mockReq({ target_type: 'post', target_id: 'abc', reason: '   ' });
    const res = mockRes();

    validateReportInput(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('validateBanInput', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls next() for valid ban input', () => {
    const req = mockReq({ user_id: 5, reason: 'Spamming' });
    const res = mockRes();

    validateBanInput(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('returns 400 when user_id is missing', () => {
    const req = mockReq({ reason: 'Spamming' });
    const res = mockRes();

    validateBanInput(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'user_id is required.',
      statusCode: 400,
    });
  });

  it('returns 400 when user_id is 0', () => {
    const req = mockReq({ user_id: 0, reason: 'Spamming' });
    const res = mockRes();

    validateBanInput(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when reason is missing', () => {
    const req = mockReq({ user_id: 5 });
    const res = mockRes();

    validateBanInput(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'reason is required.',
      statusCode: 400,
    });
  });

  it('returns 400 when reason is empty string', () => {
    const req = mockReq({ user_id: 5, reason: '' });
    const res = mockRes();

    validateBanInput(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when reason is whitespace only', () => {
    const req = mockReq({ user_id: 5, reason: '   ' });
    const res = mockRes();

    validateBanInput(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
