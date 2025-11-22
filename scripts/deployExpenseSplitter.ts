import { toNano, Address } from '@ton/core';
import { ExpenseSplitter } from '../wrappers/ExpenseSplitter';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // Get Telegram group ID from environment or prompt
    const groupId = process.env.GROUP_ID ? parseInt(process.env.GROUP_ID) : 12345;

    const expenseSplitter = provider.open(
        ExpenseSplitter.createFromConfig(
            {
                groupId: groupId,
                expenseCount: 0,
            },
            await compile('ExpenseSplitter')
        )
    );

    await expenseSplitter.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(expenseSplitter.address);

    console.log('ExpenseSplitter deployed at address:', expenseSplitter.address.toString());
    console.log('Group ID:', groupId);

    // Save the address to .env or config
    console.log('\nAdd this to your .env file:');
    console.log(`EXPENSE_SPLITTER_ADDRESS=${expenseSplitter.address.toString()}`);
}
