export type MockUser = { id: number; username: string; email: string; role: string };

export type MockAuthenticateToken = jest.Mock & {
  setUser: (user: MockUser | null) => void;
};

/**
 * Creates a mock success response helper matching the canonical implementation.
 */
export function createMockSuccess() {
  return jest.fn((res: any, data: any, message?: string, statusCode?: number) => {
    const code = statusCode || 200;
    const body: any = { data };
    if (message) body.message = message;
    return res.status(code).json(body);
  });
}

/**
 * Creates a mock error response helper matching the canonical implementation.
 */
export function createMockError() {
  return jest.fn((res: any, errorMessage: string, statusCode: number) => {
    return res.status(statusCode).json({ error: errorMessage, statusCode });
  });
}

/**
 * Creates a mock authenticateToken middleware.
 * Use .setUser() to control the authenticated user between tests.
 */
export function createMockAuthenticateToken(mockUser?: MockUser): MockAuthenticateToken {
  let currentUser: MockUser | null = mockUser ?? null;

  const fn = jest.fn((req: any, res: any, next: any) => {
    if (currentUser) {
      req.user = { ...currentUser };
      next();
    } else {
      res.status(401).json({ error: 'Access denied. No token provided.' });
    }
  }) as MockAuthenticateToken;

  fn.setUser = (user: MockUser | null) => {
    currentUser = user;
  };

  return fn;
}

/**
 * Creates a mock checkBan middleware factory that always passes.
 */
export function createMockCheckBan() {
  return jest.fn((_banChecker: any) => (req: any, _res: any, next: any) => next());
}

/**
 * Creates a mock Ban model with findOne returning null.
 */
export function createMockBan() {
  return { findOne: jest.fn().mockResolvedValue(null) };
}

/**
 * Creates a mock async handler that calls next().
 */
export function createMockAsyncHandler() {
  return jest.fn((req: any, _res: any, next: any) => next());
}
