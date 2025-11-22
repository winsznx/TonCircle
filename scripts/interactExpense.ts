import { Address, toNano } from '@ton/core';
import { ExpenseSplitter } from '../wrappers/ExpenseSplitter';
import { NetworkProvider } from '@ton/blueprint';

// Replace with your deployed contract address
const contractAddress = Address.parse(process.env.EXPENSE_SPLITTER_ADDRESS || 'EQD...');

export async function run(provider: NetworkProvider) {
    const expenseSplitter = provider.open(new ExpenseSplitter(contractAddress));

    // Example: Create an expense
    console.log('Creating expense...');
    await expenseSplitter.sendCreateExpense(
        provider.sender(),
        {
            value: toNano('0.05'),
            amount: toNano('100'),
            description: 'Dinner at restaurant',
            participants: [
                // Add participant addresses here
            ],
        }
    );

    console.log('Transaction sent! Check explorer for confirmation.');

    // Example: Get balance (uncomment after contract deployment)
    // const balance = await expenseSplitter.getBalance(provider.sender().address!);
    // console.log('Your balance:', balance.toString());
}
