module.exports = {
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  testPathIgnorePatterns: ['/node_modules/'],
  moduleFileExtensions: ['js'],
  moduleDirectories: ['src', 'node_modules'],
  verbose: true,
  testEnvironment: 'node',
  preset: 'ts-jest',
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.ts'],
  reporters: ['default', 'jest-junit'],
  transformIgnorePatterns: ['node_modules'],
  clearMocks: true,
  bail: 1,
};
