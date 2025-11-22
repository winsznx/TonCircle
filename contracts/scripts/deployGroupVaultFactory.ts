import { toNano } from '@ton/core';
import { GroupVaultFactory } from '../build/GroupVaultFactory/tact_GroupVaultFactory';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const groupVaultFactory = provider.open(await GroupVaultFactory.fromInit(provider.sender().address!));

    await groupVaultFactory.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        null,
    );

    await provider.waitForDeploy(groupVaultFactory.address);

    console.log('\n========================================');
    console.log('✅ GroupVaultFactory deployed successfully!');
    console.log('========================================');
    console.log('Address:', groupVaultFactory.address.toString());
    console.log('Explorer:', `https://testnet.tonscan.org/address/${groupVaultFactory.address.toString()}`);
    console.log('========================================\n');

    // Verify deployment
    try {
        const owner = await groupVaultFactory.getGetOwner();
        console.log('✅ Contract is active');
        console.log('Owner:', owner.toString());

        const status = await groupVaultFactory.getGetFactoryStatus();
        console.log('Factory Status:', status);
        console.log('Total Groups:', status.totalGroups.toString());
        console.log('\n✅ Ready to create groups!\n');
    } catch (error) {
        console.log('⚠️  Contract deployed but getters not yet available (normal on testnet)');
    }
}