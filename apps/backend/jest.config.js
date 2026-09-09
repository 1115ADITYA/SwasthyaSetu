/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/**/*.test.ts'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { tsconfig: 'tsconfig.test.json' },
    ],
  },
};
