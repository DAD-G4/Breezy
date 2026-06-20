/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  displayName: 'unit',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/integration/'],
  moduleNameMapper: {
    '^@breezy/shared$': '<rootDir>/../shared/src/index.ts',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { diagnostics: false }],
  },
  forceExit: true,
  detectOpenHandles: true,
};
