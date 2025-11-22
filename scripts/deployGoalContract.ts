import { toNano, Address } from '@ton/core';
import { GoalContract } from '../wrappers/GoalContract';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // Get Telegram group ID from environment or prompt
    const groupId = process.env.GROUP_ID ? parseInt(process.env.GROUP_ID) : 12345;

    const goalContract = provider.open(
        GoalContract.createFromConfig(
            {
                groupId: groupId,
                goalCount: 0,
            },
            await compile('GoalContract')
        )
    );

    await goalContract.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(goalContract.address);

    console.log('GoalContract deployed at address:', goalContract.address.toString());
    console.log('Group ID:', groupId);

    // Save the address to .env or config
    console.log('\nAdd this to your .env file:');
    console.log(`GOAL_CONTRACT_ADDRESS=${goalContract.address.toString()}`);
}
