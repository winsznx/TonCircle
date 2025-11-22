# TON Circle Test Suite

This directory contains comprehensive tests for the TON Circle smart contract system. The test suite is designed to ensure the reliability, security, and proper functioning of all contract components.

## Test Structure

### Test Files

1. **GroupVaultFactory.spec.ts** - Tests for the GroupVaultFactory contract
    - Contract deployment and initialization
    - Group registration with validation
    - Factory settings management
    - Emergency controls (stop/resume)
    - Getter functions
    - Error handling and edge cases

2. **GroupVault.spec.ts** - Tests for the GroupVault contract
    - Contract deployment and initialization
    - Member management (add/remove)
    - Goal creation and funding
    - Expense recording and debt management
    - Group settings management
    - Getter functions
    - Error handling and edge cases

3. **Member.spec.ts** - Tests for the Member contract
    - Contract deployment and initialization
    - Profile management
    - Reputation system
    - Contribution tracking
    - Debt management
    - Status management
    - Getter functions
    - Error handling and edge cases

4. **Integration.spec.ts** - End-to-end integration tests
    - Complete group lifecycle workflows
    - Multi-group scenarios
    - Contract interaction patterns
    - Performance and gas optimization
    - Error recovery scenarios

5. **EdgeCases.spec.ts** - Security and boundary condition tests
    - Security attack vectors
    - Boundary conditions (max/min values)
    - Resource exhaustion scenarios
    - Data integrity verification
    - Concurrent access handling
    - Recovery scenarios

## Running Tests

### Using the Test Runner

The project includes a custom test runner for better organization:

```bash
# Run all tests
npm run test:all

# Run specific test suite
npm run test:factory      # GroupVaultFactory tests
npm run test:group         # GroupVault tests
npm run test:member        # Member tests
npm run test:integration   # Integration tests
npm run test:edge          # Edge cases tests

# Run with coverage
npm run test:coverage

# List all available test suites
npm run test:runner --list
```

### Using Jest Directly

```bash
# Run all tests
npm test

# Run specific test file
npx jest tests/GroupVaultFactory.spec.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Test Coverage

The test suite aims for comprehensive coverage of:

- **Function Coverage**: All public and internal functions
- **Branch Coverage**: All conditional branches and error paths
- **Statement Coverage**: All lines of code
- **Integration Coverage**: Cross-contract interactions

### Coverage Targets

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Test Categories

### Unit Tests

- Individual contract functions
- Message handling
- State transitions
- Getter methods
- Error conditions

### Integration Tests

- Multi-contract workflows
- End-to-end scenarios
- State consistency
- Gas optimization

### Security Tests

- Authorization checks
- Input validation
- Reentrancy protection
- Overflow/underflow prevention

### Performance Tests

- Gas usage optimization
- Batch operations
- Concurrent access
- Resource limits

## Test Data

### Mock Addresses

- Uses deterministic test addresses
- Separate accounts for different roles
- Attacker account for security tests

### Test Values

- Boundary conditions (0, max values)
- Invalid inputs
- Large numbers
- Edge cases

## Debugging

### Verbose Output

```bash
npm run test:all --verbose
```

### Individual Test Files

```bash
# Run specific test with detailed output
npx jest tests/GroupVault.spec.ts --verbose
```

### Coverage Reports

Coverage reports are generated in the `coverage/` directory:

- HTML report: `coverage/lcov-report/index.html`
- LCOV format: `coverage/lcov.info`
- Text summary: Console output

## Best Practices

### Test Organization

- Group related tests together
- Use descriptive test names
- Include setup and teardown
- Mock external dependencies

### Test Data Management

- Use consistent test data
- Clean up after each test
- Avoid shared state between tests

### Error Testing

- Test all error paths
- Verify error messages
- Check state after failures
- Test recovery scenarios

### Performance Testing

- Measure gas usage
- Test with large datasets
- Verify timeout handling
- Check resource limits

## Continuous Integration

The test suite is designed to run in CI/CD environments:

- **GitHub Actions**: Automated testing on PRs
- **Coverage Reporting**: Integrated with coverage services
- **Parallel Execution**: Optimized for CI runners
- **Fail Fast**: Stop on first failure

## Troubleshooting

### Common Issues

1. **Timeout Errors**
    - Increase test timeout in jest.config.ts
    - Check for infinite loops
    - Verify async operations

2. **Gas Limit Exceeded**
    - Increase gas limits in tests
    - Optimize contract operations
    - Check for gas-intensive operations

3. **Contract Deployment Failures**
    - Verify contract compilation
    - Check initialization parameters
    - Ensure sufficient deployment gas

4. **Test Isolation**
    - Use fresh blockchain for each test
    - Clean up state between tests
    - Avoid shared test data

### Debug Mode

For detailed debugging:

```bash
# Run with Node.js debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test in debug mode
node --inspect-brk node_modules/.bin/jest tests/GroupVault.spec.ts --runInBand
```

## Contributing

When adding new tests:

1. **Follow the existing pattern**
    - Use `describe` blocks for organization
    - Use `it` for individual tests
    - Include proper setup/teardown

2. **Test all scenarios**
    - Success cases
    - Failure cases
    - Edge conditions
    - Error paths

3. **Maintain coverage**
    - Ensure new code is tested
    - Update coverage thresholds
    - Add integration tests if needed

4. **Document tests**
    - Add comments for complex scenarios
    - Explain test purpose
    - Document any limitations

## Test Results Interpretation

### Success Indicators

- ✅ All tests pass
- ✅ Coverage thresholds met
- ✅ No memory leaks
- ✅ Performance within limits

### Failure Indicators

- ❌ Test failures
- ❌ Coverage below threshold
- ❌ Timeout errors
- ❌ Gas limit exceeded

### Next Steps for Failures

1. Check test logs for error details
2. Verify contract state
3. Run individual failing tests
4. Check for environment issues
5. Review recent code changes
