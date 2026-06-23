/**
 * Sets environment variables for integration tests.
 * Must be called BEFORE any @breezy/shared imports.
 */
export function loadTestEnv(): void {
  process.env.POSTGRES_URI = process.env.POSTGRES_URI || 'postgres://breezy_test:breezy_test@localhost:5432/breezy_test';
  process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/breezy_test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-jwt-signing';
  process.env.NODE_ENV = 'test';
}
