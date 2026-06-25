import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../src/middleware/asyncHandler';

function mockReq(): Request {
  return { body: {} } as Request;
}

function mockRes(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('asyncHandler', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls the handler with (req, res, next) and does not call next on success', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(handler);
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn() as unknown as NextFunction;

    await wrapped(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next(error) when handler throws synchronously', async () => {
    const error = new Error('sync error');
    const handler = jest.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(handler);
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn() as unknown as NextFunction;

    await wrapped(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('calls next(error) when async handler rejects', async () => {
    const error = new Error('async rejection');
    const handler = jest.fn().mockImplementation(async () => {
      throw error;
    });
    const wrapped = asyncHandler(handler);
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn() as unknown as NextFunction;

    await wrapped(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('does not call next() on successful handler that returns data', async () => {
    const handler = jest.fn().mockResolvedValue({ data: 'ok' });
    const wrapped = asyncHandler(handler);
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn() as unknown as NextFunction;

    await wrapped(req, res, next);

    expect(next).not.toHaveBeenCalled();
  });

  it('handles handler that returns a resolved promise', async () => {
    const handler = jest.fn().mockReturnValue(Promise.resolve());
    const wrapped = asyncHandler(handler);
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn() as unknown as NextFunction;

    await wrapped(req, res, next);

    expect(next).not.toHaveBeenCalled();
  });

  it('passes the original error object through next()', async () => {
    const error = new TypeError('cannot read property');
    const handler = jest.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(handler);
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn() as unknown as NextFunction;

    await wrapped(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((next as jest.Mock).mock.calls[0][0]).toBeInstanceOf(TypeError);
  });
});
