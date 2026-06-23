/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  displayName: 'integration',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/*.integration.test.ts'],
  moduleNameMapper: {
    '^@breezy/shared$': '<rootDir>/../shared/src/index.ts',
    '^@breezy/shared/src/(.*)$': '<rootDir>/../shared/src/$1',
  },
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  setupFiles: ['<rootDir>/../../jest.setup.ts'],
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true,
};
