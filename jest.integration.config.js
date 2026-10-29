module.exports = {
  ...require('./jest.config'),
  testPathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/tests/integration/*.test.ts'],
};
