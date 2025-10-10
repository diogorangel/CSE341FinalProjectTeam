/** @type {import('jest').Config} */
const config = {
    // Sets the test environment to Node.js
    testEnvironment: 'node',

    // Configuration to ensure Jest can handle ES6 imports (modules)
    transform: {
        // Uses babel-jest to process .js files (if you use imports/exports)
        '^.+\\.js$': 'babel-jest',
    },
    
    // Ignores the node_modules directory and other default directories
    testPathIgnorePatterns: [
        "/node_modules/",
        "/dist/"
    ],

    // Allows you to use cleaner module paths
    moduleDirectories: ['node_modules', 'src'],
};

module.exports = config;
