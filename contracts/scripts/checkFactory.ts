import { Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { GroupVaultFactory } from '../wrappers/GroupVaultFactory';

export async function run(provider: NetworkProvider) {
    const factoryAddress = Address.parse('EQDU7ANbVtUxcw79x7dFfltROR2hNYGefwBIzdPEm33wKbs9');
    const factory = provider.open(GroupVaultFactory.createFromAddress(factoryAddress));
    const status = await factory.getFactoryStatus();
    console.log('Factory status after wait:');
    console.log('  Total Groups:', status.totalGroups.toString());
    console.log('  Is Active:', status.isActive);
    console.log('  Registration Fee:', (Number(status.registrationFee) / 1e9).toFixed(2), 'TON');
}
