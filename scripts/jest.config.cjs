module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/*.test.js'
  ],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.js'
  ],
  // Only test files within the scripts directory
  roots: ['<rootDir>'],
  // Ignore the parent short-video-maker directory
  testPathIgnorePatterns: [
    '/node_modules/',
    '../short-video-maker/'
  ]
};