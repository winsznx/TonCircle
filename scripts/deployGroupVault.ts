import { toNano, Address } from '@ton/core';
import { GroupVault } from '../wrappers/GroupVault';
import { GroupVaultFactory } from '../wrappers/GroupVaultFactory';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // Get Telegram group ID from environment or prompt
    const groupId = process.env.GROUP_ID ? parseInt(process.env.GROUP_ID) : 12345;

    const groupVault = provider.open(
        GroupVault.createFromConfig(
            {
                groupId: groupId,
                adminAddress: provider.sender().address!,
            },
            await compile('GroupVault')
        )
    );

    await groupVault.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(groupVault.address);

    console.log('GroupVault deployed at address:', groupVault.address.toString());
    console.log('Group ID:', groupId);
    console.log('Admin Address:', provider.sender().address?.toString());

    // Run initial setup if needed
    // await groupVault.sendRegisterGroup(...);
}
