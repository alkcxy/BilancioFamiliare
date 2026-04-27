module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/app/javascript'],
  moduleDirectories: ['node_modules', 'app/javascript'],
  setupFilesAfterEnv: ['<rootDir>/test/javascript/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|scss|sass)$': 'identity-obj-proxy',
  },
};
