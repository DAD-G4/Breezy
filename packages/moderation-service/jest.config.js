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
    '^.+\\.ts$': 'ts-jest',
  },
  setupFiles: ['<rootDir>/../../jest.setup.ts'],
  // Prevent hanging on open handles
  forceExit: true,
  detectOpenHandles: true,
};
