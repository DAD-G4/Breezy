import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, UserRole } from '../src/types';
import {
  authenticateToken,
  checkBan,
  requireRole,
  BanChecker,
  ROLE_HIERARCHY,
} from '../src/middleware/auth';

jest.mock('jsonwebtoken');

const JWT_SECRET = 'test-secret';
const mockJwt = jwt as jest.Mocked<typeof jwt>;

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

function mockAuthReq(overrides?: Partial<AuthRequest>): AuthRequest {
  return {
    headers: {},
    user: undefined,
    ...overrides,
  } as AuthRequest;
}

const mockNext = jest.fn() as unknown as NextFunction;

describe('authenticateToken', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('attaches user and calls next for a valid token', () => {
    const decoded = {
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      role: UserRole.USER,
    };
    mockJwt.verify.mockImplementation(() => decoded as unknown as jwt.JwtPayload);

    const req = mockAuthReq({
      headers: { authorization: 'Bearer valid-token' },
    });
    const res = mockRes();

    authenticateToken(req, res, mockNext);

    expect(mockJwt.verify).toHaveBeenCalledWith(
      'valid-token',
      JWT_SECRET,
      { algorithms: ['HS256'] }
    );
    expect(req.user).toEqual(decoded);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('returns 401 when no Authorization header is present', () => {
    const req = mockAuthReq({ headers: {} });
    const res = mockRes();

    authenticateToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Access denied. No token provided.',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header lacks Bearer prefix', () => {
    const req = mockAuthReq({
      headers: { authorization: 'Basic some-token' },
    });
    const res = mockRes();

    authenticateToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Access denied. No token provided.',
    });
  });

  it('returns 401 when token is invalid', () => {
    mockJwt.verify.mockImplementation(() => {
      throw new jwt.JsonWebTokenError('invalid signature');
    });

    const req = mockAuthReq({
      headers: { authorization: 'Bearer bad-token' },
    });
    const res = mockRes();

    authenticateToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 with specific message when token is expired', () => {
    mockJwt.verify.mockImplementation(() => {
      throw new jwt.TokenExpiredError('jwt expired', new Date());
    });

    const req = mockAuthReq({
      headers: { authorization: 'Bearer expired-token' },
    });
    const res = mockRes();

    authenticateToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expired.' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('extracts token after "Bearer " (7 chars)', () => {
    const decoded = {
      id: 2,
      username: 'bob',
      email: 'bob@example.com',
      role: UserRole.MODERATOR,
    };
    mockJwt.verify.mockImplementation(() => decoded as unknown as jwt.JwtPayload);

    const req = mockAuthReq({
      headers: { authorization: 'Bearer my-jwt-token' },
    });
    const res = mockRes();

    authenticateToken(req, res, mockNext);

    expect(mockJwt.verify).toHaveBeenCalledWith(
      'my-jwt-token',
      JWT_SECRET,
      { algorithms: ['HS256'] }
    );
    expect(req.user).toEqual(decoded);
  });
});

describe('checkBan', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when req.user is not set', async () => {
    const banChecker = jest.fn() as BanChecker;
    const middleware = checkBan(banChecker);
    const req = mockAuthReq({ user: undefined });
    const res = mockRes();

    await middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required.' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('calls next() when user is not banned', async () => {
    const banChecker = jest.fn().mockResolvedValue(null);
    const middleware = checkBan(banChecker);
    const req = mockAuthReq({ user: { id: 1, username: 'alice', email: 'alice@example.com', role: UserRole.USER } });
    const res = mockRes();

    await middleware(req, res, mockNext);

    expect(banChecker).toHaveBeenCalledWith(1);
    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when user is banned permanently', async () => {
    const banChecker = jest.fn().mockResolvedValue({
      user_id: 1,
      expires_at: null,
    });
    const middleware = checkBan(banChecker);
    const req = mockAuthReq({ user: { id: 1, username: 'alice', email: 'alice@example.com', role: UserRole.USER } });
    const res = mockRes();

    await middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'User is banned.' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 403 when ban has not expired yet', async () => {
    const futureDate = new Date(Date.now() + 86400000); // tomorrow
    const banChecker = jest.fn().mockResolvedValue({
      user_id: 1,
      expires_at: futureDate,
    });
    const middleware = checkBan(banChecker);
    const req = mockAuthReq({ user: { id: 1, username: 'alice', email: 'alice@example.com', role: UserRole.USER } });
    const res = mockRes();

    await middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'User is banned.' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('calls next() when ban has expired', async () => {
    const pastDate = new Date(Date.now() - 86400000); // yesterday
    const banChecker = jest.fn().mockResolvedValue({
      user_id: 1,
      expires_at: pastDate,
    });
    const middleware = checkBan(banChecker);
    const req = mockAuthReq({ user: { id: 1, username: 'alice', email: 'alice@example.com', role: UserRole.USER } });
    const res = mockRes();

    await middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 500 when banChecker throws (DB error)', async () => {
    const banChecker = jest.fn().mockRejectedValue(new Error('DB connection failed'));
    const middleware = checkBan(banChecker);
    const req = mockAuthReq({ user: { id: 1, username: 'alice', email: 'alice@example.com', role: UserRole.USER } });
    const res = mockRes();

    await middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to verify user status.' });
    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe('requireRole', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when req.user is not set', () => {
    const middleware = requireRole(UserRole.ADMIN);
    const req = mockAuthReq({ user: undefined });
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required.' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('calls next() when user has the required role (exact match)', () => {
    const middleware = requireRole(UserRole.ADMIN);
    const req = mockAuthReq({
      user: { id: 1, username: 'alice', email: 'alice@example.com', role: UserRole.ADMIN },
    });
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('calls next() when user has a higher role', () => {
    const middleware = requireRole(UserRole.USER);
    const req = mockAuthReq({
      user: { id: 1, username: 'alice', email: 'alice@example.com', role: UserRole.ADMIN },
    });
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('returns 403 when user has insufficient role', () => {
    const middleware = requireRole(UserRole.MODERATOR);
    const req = mockAuthReq({
      user: { id: 1, username: 'alice', email: 'alice@example.com', role: UserRole.USER },
    });
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions.' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 403 when user is USER but MODERATOR is required', () => {
    const middleware = requireRole(UserRole.MODERATOR);
    const req = mockAuthReq({
      user: { id: 1, username: 'alice', email: 'alice@example.com', role: UserRole.USER },
    });
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('calls next() when MODERATOR is required and user is MODERATOR', () => {
    const middleware = requireRole(UserRole.MODERATOR);
    const req = mockAuthReq({
      user: { id: 1, username: 'alice', email: 'alice@example.com', role: UserRole.MODERATOR },
    });
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});

describe('ROLE_HIERARCHY', () => {
  it('defines correct role levels', () => {
    expect(ROLE_HIERARCHY[UserRole.USER]).toBe(0);
    expect(ROLE_HIERARCHY[UserRole.MODERATOR]).toBe(1);
    expect(ROLE_HIERARCHY[UserRole.ADMIN]).toBe(2);
  });

  it('has USER < MODERATOR < ADMIN ordering', () => {
    expect(ROLE_HIERARCHY[UserRole.USER]).toBeLessThan(ROLE_HIERARCHY[UserRole.MODERATOR]);
    expect(ROLE_HIERARCHY[UserRole.MODERATOR]).toBeLessThan(ROLE_HIERARCHY[UserRole.ADMIN]);
  });
});
