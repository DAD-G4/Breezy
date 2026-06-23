import { Response } from 'express';
import { success, error } from '../src/utils/response';

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('success', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with data when only data is provided', () => {
    const res = mockRes();
    const data = { id: 1, name: 'Alice' };

    const result = success(res, data);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data });
    expect(result).toBe(res);
  });

  it('returns 200 with data and message', () => {
    const res = mockRes();
    const data = { id: 1 };
    const message = 'User created successfully';

    success(res, data, message);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data, message });
  });

  it('returns custom status code when provided', () => {
    const res = mockRes();
    const data = { id: 1 };

    success(res, data, 'Created', 201);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ data, message: 'Created' });
  });

  it('returns 201 with data when statusCode is 201 and no message', () => {
    const res = mockRes();
    const data = { id: 1 };

    success(res, data, undefined, 201);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ data });
  });

  it('does not include message field when message is undefined', () => {
    const res = mockRes();
    const data = 'hello';

    success(res, data);

    expect(res.json).toHaveBeenCalledWith({ data: 'hello' });
    const callArg = (res.json as jest.Mock).mock.calls[0][0];
    expect(callArg).not.toHaveProperty('message');
  });

  it('does not include message field when message is empty string', () => {
    const res = mockRes();
    const data = [1, 2, 3];

    success(res, data, '');

    expect(res.json).toHaveBeenCalledWith({ data: [1, 2, 3] });
    const callArg = (res.json as jest.Mock).mock.calls[0][0];
    expect(callArg).not.toHaveProperty('message');
  });

  it('handles null data', () => {
    const res = mockRes();

    success(res, null);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: null });
  });

  it('handles array data', () => {
    const res = mockRes();
    const data = [{ id: 1 }, { id: 2 }];

    success(res, data, 'List fetched');

    expect(res.json).toHaveBeenCalledWith({ data, message: 'List fetched' });
  });
});

describe('error', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 500 with error message by default', () => {
    const res = mockRes();

    const result = error(res, 'Internal server error');

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      statusCode: 500,
    });
    expect(result).toBe(res);
  });

  it('returns custom status code when provided', () => {
    const res = mockRes();

    error(res, 'Not found', 404);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Not found',
      statusCode: 404,
    });
  });

  it('returns 400 for bad request', () => {
    const res = mockRes();

    error(res, 'Validation failed', 400);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation failed',
      statusCode: 400,
    });
  });

  it('returns 401 for unauthorized', () => {
    const res = mockRes();

    error(res, 'Unauthorized', 401);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      statusCode: 401,
    });
  });

  it('returns 403 for forbidden', () => {
    const res = mockRes();

    error(res, 'Forbidden', 403);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Forbidden',
      statusCode: 403,
    });
  });

  it('returns the Response object for chaining', () => {
    const res = mockRes();

    const result = error(res, 'Error');

    expect(result).toBe(res);
  });
});
