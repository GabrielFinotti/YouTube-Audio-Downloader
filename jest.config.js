export const preset = 'ts-jest';
export const testEnvironment = 'node';
export const roots = ['<rootDir>/src'];
export const testMatch = [
  '**/__tests__/**/*.+(ts|tsx|js)',
  '**/*.(test|spec).+(ts|tsx|js)',
];
export const transform = {
  '^.+\\.(ts|tsx)$': 'ts-jest',
};
export const collectCoverageFrom = [
  'src/**/*.{ts,tsx}',
  '!src/**/*.d.ts',
  '!src/**/*.test.{ts,tsx}',
  '!src/**/*.spec.{ts,tsx}',
  '!src/**/index.ts',
];
export const coverageDirectory = 'coverage';
export const coverageReporters = ['text', 'html', 'json-summary'];
export const coverageThreshold = {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
};
export const setupFilesAfterEnv = ['<rootDir>/src/test/setup.ts'];
export const moduleNameMapping = {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^@/domain/(.*)$': '<rootDir>/src/domain/$1',
  '^@/application/(.*)$': '<rootDir>/src/application/$1',
  '^@/infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
  '^@/presentation/(.*)$': '<rootDir>/src/presentation/$1',
};
export const testTimeout = 30000;
export const verbose = true;
export const detectOpenHandles = true;
export const forceExit = true;
export const clearMocks = true;
export const resetMocks = true;
export const restoreMocks = true;
