import { Request, Response, NextFunction } from 'express';
import notFound from '../src/middleware/notFound';

function mockReqRes() {
  const req = {} as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;
  return { req, res, next };
}

describe('notFound middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 with error message', () => {
    const { req, res, next } = mockReqRes();
    notFound(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Route not found',
      statusCode: 404,
    });
  });

  it('does not call next()', () => {
    const { req, res, next } = mockReqRes();
    notFound(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });
});
