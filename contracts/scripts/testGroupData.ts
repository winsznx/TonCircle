import { Address } from '@ton/core';
import { GroupVaultFactory } from '../wrappers/GroupVaultFactory';
import { GroupVault } from '../wrappers/GroupVault';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const factoryAddress = Address.parse('EQDU7ANbVtUxcw79x7dFfltROR2hNYGefwBIzdPEm33wKbs9');
    const factory = provider.open(GroupVaultFactory.createFromAddress(factoryAddress));

    console.log('\n=== FACTORY STATUS ===');
    const status = await factory.getFactoryStatus();
    console.log('Total Groups:', status.totalGroups);
    console.log('Is Active:', status.isActive);
    console.log('Registration Fee:', Number(status.registrationFee) / 1e9, 'TON');

    if (status.totalGroups > 0) {
        console.log('\n=== GROUP 0 DATA ===');
        const groupAddress = await factory.getGroupByIndex(0n);
        console.log('Group Address:', groupAddress?.toString());

        if (groupAddress) {
            const groupVault = provider.open(GroupVault.createFromAddress(groupAddress));
            const groupInfo = await groupVault.getGroupInfo();

            console.log('\nGroup Info:');
            console.log('  Group Hash:', groupInfo.groupHash.toString());
            console.log('  Group Name:', groupInfo.groupName);
            console.log('  Admin Address:', groupInfo.adminAddress.toString());
            console.log('  Created At:', new Date(Number(groupInfo.createdAt) * 1000).toISOString());
            console.log('  Member Count:', groupInfo.memberCount.toString());
            console.log('  Is Active:', groupInfo.isActive);

            console.log('\nAddress Formats:');
            console.log('  Admin (User-Friendly):', groupInfo.adminAddress.toString());
            console.log('  Admin (Raw):', groupInfo.adminAddress.toRawString());
        }
    }
}
