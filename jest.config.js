module.exports = {
  moduleFileExtensions: ["ts", "tsx", "js"],
  modulePaths: ["<rootDir>"],
  transform: {
    "\\.(ts|tsx)$": "ts-jest",
  },
  testRegex: "(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$",
  testPathIgnorePatterns: ["\\.snap$", "<rootDir>/node_modules/"],
  cacheDirectory: ".jest/cache",
  collectCoverageFrom: ["src/**.{ts,tsx}"],
};
