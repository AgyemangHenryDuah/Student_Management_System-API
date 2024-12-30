module.exports = {
    testTimeout: 50000,
    testEnvironment: "node", // Ensures a Node.js environment for testing.
    testMatch: ["**/__tests__/**/*.test.js"], // Match files ending with `.test.js`.
    collectCoverage: true, // Enables code coverage collection.
    coverageDirectory: "coverage", // Directory for coverage reports.
    moduleDirectories: ["node_modules", "src"], // Adjust based on your app structure.
};
