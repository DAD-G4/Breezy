/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@breezy/shared/src/(.*)$': '<rootDir>/../shared/src/$1',
    '^@breezy/shared$': '<rootDir>/../shared/src/index.ts',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { diagnostics: false }],
  },
  // Prevent hanging on open handles
  forceExit: true,
  detectOpenHandles: true,
};
