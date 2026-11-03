module.exports = {
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {module: 'Node16', moduleResolution: 'Node16', isolatedModules: true},
    }],
  },
  moduleNameMapper: {'^(\\.{1,2}/.*)\\.js$': '$1'},
  testEnvironment: 'node',
  testTimeout: 10000,
  testPathIgnorePatterns: ['/node_modules/', '/tests/integration/'],
};
