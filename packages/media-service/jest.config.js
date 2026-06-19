/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@breezy/shared$': '<rootDir>/../shared/src/index.ts',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { diagnostics: false }],
  },
  forceExit: true,
  detectOpenHandles: true,
};
