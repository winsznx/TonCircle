import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    globalSetup: './jest.setup.ts',
    cache: false, // disabled caching to prevent old Tact files from being used after a rebuild
    testEnvironment: '@ton/sandbox/jest-environment',
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    reporters: ['default', ['@ton/sandbox/jest-reporter', {}]],
    testTimeout: 30000, // 30 seconds timeout for complex integration tests
    maxWorkers: 4, // Limit workers to prevent resource exhaustion
    verbose: true, // Detailed output for debugging
    collectCoverage: true, // Enable code coverage
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'contracts/**/*.tact',
        'tests/**/*.ts'
    ],
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    }
};

export default config;
