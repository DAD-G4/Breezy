import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../src/middleware/errorHandler';

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

const mockReq = {} as Request;
const mockNext = jest.fn() as unknown as NextFunction;

describe('errorHandler', () => {
  beforeEach(() => jest.clearAllMocks());

  it('handles SequelizeValidationError → 400', () => {
    const err = Object.assign(new Error('Validation failed'), {
      name: 'SequelizeValidationError',
      errors: [{ message: 'email is required' }, { message: 'username too short' }],
    });
    const res = mockRes();
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'email is required, username too short',
      statusCode: 400,
    });
  });

  it('handles SequelizeUniqueConstraintError → 409', () => {
    const err = Object.assign(new Error('unique violation'), {
      name: 'SequelizeUniqueConstraintError',
      errors: [{ message: 'email already exists' }],
    });
    const res = mockRes();
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'email already exists',
      statusCode: 409,
    });
  });

  it('handles Mongoose ValidationError → 400', () => {
    const err = Object.assign(new Error('validation failed'), {
      name: 'ValidationError',
      errors: {
        content: { message: 'Path `content` is required.' },
      },
    });
    const res = mockRes();
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Path `content` is required.',
      statusCode: 400,
    });
  });

  it('handles Mongoose CastError → 400', () => {
    const err = Object.assign(new Error('Cast to ObjectId failed'), {
      name: 'CastError',
      path: '_id',
      value: 'invalid-id',
    });
    const res = mockRes();
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid _id: invalid-id',
      statusCode: 400,
    });
  });

  it('handles JsonWebTokenError → 401', () => {
    const err = Object.assign(new Error('jwt malformed'), { name: 'JsonWebTokenError' });
    const res = mockRes();
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.', statusCode: 401 });
  });

  it('handles TokenExpiredError → 401', () => {
    const err = Object.assign(new Error('jwt expired'), { name: 'TokenExpiredError' });
    const res = mockRes();
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expired.', statusCode: 401 });
  });

  it('handles AppError → uses error.statusCode', () => {
    const err = new AppError('Not found', 404);
    const res = mockRes();
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found', statusCode: 404 });
  });

  it('handles unknown errors → 500', () => {
    const err = new Error('something unexpected');
    const res = mockRes();
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error.',
      statusCode: 500,
    });
  });
});
