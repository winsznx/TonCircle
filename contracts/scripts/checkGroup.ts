import { Address } from '@ton/core';
import { GroupVaultFactory } from '../wrappers/GroupVaultFactory';
import { GroupVault } from '../wrappers/GroupVault';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const factoryAddress = Address.parse('EQDU7ANbVtUxcw79x7dFfltROR2hNYGefwBIzdPEm33wKbs9');
    const factory = provider.open(GroupVaultFactory.createFromAddress(factoryAddress));
    
    console.log('Checking group at index 0...');
    
    try {
        const groupAddress = await factory.getGroupByIndex(0n);
        console.log('Group address:', groupAddress?.toString());
        
        if (groupAddress) {
            const groupVault = provider.open(GroupVault.createFromAddress(groupAddress));
            const groupInfo = await groupVault.getGroupInfo();
            console.log('Group info:', groupInfo);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
