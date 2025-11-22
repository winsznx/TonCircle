import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, Address } from '@ton/core';
import { ExpenseSplitter } from '../wrappers/ExpenseSplitter';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('ExpenseSplitter', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('ExpenseSplitter');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let expenseSplitter: SandboxContract<ExpenseSplitter>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        expenseSplitter = blockchain.openContract(
            ExpenseSplitter.createFromConfig(
                {
                    groupId: 12345,
                    expenseCount: 0,
                },
                code
            )
        );

        deployer = await blockchain.treasury('deployer');

        const deployResult = await expenseSplitter.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: expenseSplitter.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and expenseSplitter are ready to use
    });

    it('should create expense correctly', async () => {
        // TODO: Implement after contract is ready
        // Test expense creation
    });

    it('should calculate splits accurately', async () => {
        // TODO: Implement after contract is ready
        // Test split calculation logic
    });

    it('should settle debt and update balances', async () => {
        // TODO: Implement after contract is ready
        // Test debt settlement
    });

    it('should get balance for address', async () => {
        // TODO: Implement after contract is ready
        // const balance = await expenseSplitter.getBalance(someAddress);
        // expect(balance).toBeDefined();
    });

    it('should get expense by ID', async () => {
        // TODO: Implement after contract is ready
        // const expense = await expenseSplitter.getExpense(1);
        // expect(expense).toBeDefined();
    });

    it('should get unsettled expenses', async () => {
        // TODO: Implement after contract is ready
        // const unsettled = await expenseSplitter.getUnsettledExpenses();
        // expect(Array.isArray(unsettled)).toBe(true);
    });

    it('should reject invalid amount', async () => {
        // TODO: Implement after contract is ready
        // Test error handling for invalid amounts
        // Should throw error code 102 (INVALID_AMOUNT)
    });

    it('should reject insufficient funds for settlement', async () => {
        // TODO: Implement after contract is ready
        // Test error handling for insufficient funds
        // Should throw error code 100 (INSUFFICIENT_FUNDS)
    });

    // Gas optimization test (MANDATORY per docs)
    it('should consume minimal gas for expense operations', async () => {
        // TODO: Implement after contract is ready
        // Monitor and assert gas consumption < target
    });

    // Integration test
    it('should handle complete expense lifecycle', async () => {
        // TODO: Implement after contract is ready
        // 1. Create expense
        // 2. Multiple debtors settle
        // 3. Verify final balances
        // 4. Check expense marked as settled
    });
});
