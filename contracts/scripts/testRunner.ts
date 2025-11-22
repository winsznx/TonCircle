#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

interface TestSuite {
    name: string;
    pattern: string;
    description: string;
}

const testSuites: TestSuite[] = [
    {
        name: 'GroupVaultFactory',
        pattern: 'tests/GroupVaultFactory.spec.ts',
        description: 'Tests for GroupVaultFactory contract including deployment, group registration, settings management, and emergency controls'
    },
    {
        name: 'GroupVault',
        pattern: 'tests/GroupVault.spec.ts',
        description: 'Tests for GroupVault contract including member management, goal management, expense management, and settings'
    },
    {
        name: 'Member',
        pattern: 'tests/Member.spec.ts',
        description: 'Tests for Member contract including profile management, reputation tracking, contributions, and debt management'
    },
    {
        name: 'Integration',
        pattern: 'tests/Integration.spec.ts',
        description: 'Integration tests covering complete workflows and contract interactions'
    },
    {
        name: 'EdgeCases',
        pattern: 'tests/EdgeCases.spec.ts',
        description: 'Edge cases and error handling tests including security vectors and boundary conditions'
    }
];

function printUsage() {
    console.log('TON Circle Test Runner');
    console.log('');
    console.log('Usage: npm run test:runner [options]');
    console.log('');
    console.log('Options:');
    console.log('  --list, -l        List all available test suites');
    console.log('  --suite, -s <name>  Run specific test suite');
    console.log('  --coverage, -c    Generate coverage report');
    console.log('  --verbose, -v    Verbose output');
    console.log('  --help, -h       Show this help message');
    console.log('');
    console.log('Available test suites:');
    testSuites.forEach(suite => {
        console.log(`  ${suite.name.padEnd(12)} - ${suite.description}`);
    });
}

function runTestSuite(suiteName: string, options: any = {}) {
    const suite = testSuites.find(s => s.name.toLowerCase() === suiteName.toLowerCase());
    
    if (!suite) {
        console.error(`Test suite "${suiteName}" not found`);
        console.log('Available suites:');
        testSuites.forEach(s => console.log(`  - ${s.name}`));
        process.exit(1);
    }

    if (!existsSync(suite.pattern)) {
        console.error(`Test file not found: ${suite.pattern}`);
        process.exit(1);
    }

    console.log(`Running ${suite.name} test suite...`);
    console.log(`Description: ${suite.description}`);
    console.log('');

    const jestArgs = [
        'jest',
        suite.pattern,
        '--detectOpenHandles'
    ];

    if (options.coverage) {
        jestArgs.push('--coverage');
    }

    if (options.verbose) {
        jestArgs.push('--verbose');
    }

    try {
        execSync(`npx ${jestArgs.join(' ')}`, {
            stdio: 'inherit',
            cwd: process.cwd()
        });
    } catch (error) {
        console.error(`Test suite "${suite.name}" failed`);
        process.exit(1);
    }
}

function runAllTests(options: any = {}) {
    console.log('Running all test suites...');
    console.log('');

    const jestArgs = [
        'jest',
        'tests/',
        '--detectOpenHandles'
    ];

    if (options.coverage) {
        jestArgs.push('--coverage');
    }

    if (options.verbose) {
        jestArgs.push('--verbose');
    }

    try {
        execSync(`npx ${jestArgs.join(' ')}`, {
            stdio: 'inherit',
            cwd: process.cwd()
        });
    } catch (error) {
        console.error('Some test suites failed');
        process.exit(1);
    }
}

function parseArgs() {
    const args = process.argv.slice(2);
    const options: any = {};

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--list':
            case '-l':
                printUsage();
                process.exit(0);
                break;
            case '--suite':
            case '-s':
                if (i + 1 < args.length) {
                    const suiteName = args[i + 1];
                    runTestSuite(suiteName, options);
                    process.exit(0);
                } else {
                    console.error('Suite name required after --suite option');
                    process.exit(1);
                }
                break;
            case '--coverage':
            case '-c':
                options.coverage = true;
                break;
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case '--help':
            case '-h':
                printUsage();
                process.exit(0);
                break;
            default:
                if (args[i].startsWith('--')) {
                    console.error(`Unknown option: ${args[i]}`);
                    printUsage();
                    process.exit(1);
                }
                break;
        }
    }

    // If no specific suite requested, run all tests
    runAllTests(options);
}

function main() {
    if (process.argv.length <= 2) {
        runAllTests();
    } else {
        parseArgs();
    }
}

main();