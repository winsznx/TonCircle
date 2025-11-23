import { toNano, Address, beginCell } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { GroupVaultFactory } from '../wrappers/GroupVaultFactory';

export async function run(provider: NetworkProvider) {
    const factoryAddress = Address.parse('EQDU7ANbVtUxcw79x7dFfltROR2hNYGefwBIzdPEm33wKbs9');
    const factory = provider.open(GroupVaultFactory.createFromAddress(factoryAddress));

    // Generate a unique group hash
    const groupHash = BigInt(Date.now() + Math.floor(Math.random() * 1000000));
    const groupName = 'Test Group ' + new Date().toISOString().slice(0, 10);
    const adminAddress = provider.sender().address!;

    console.log('Creating test group...');
    console.log('Group Name:', groupName);
    console.log('Group Hash:', groupHash.toString());
    console.log('Admin:', adminAddress.toString());

    // Send RegisterGroup message with error handling
    try {
        const tx = await factory.sendRegisterGroup(
            provider.sender(),
            {
                groupName: groupName,
                groupHash: groupHash,
                adminAddress: adminAddress,
                value: toNano('2.2'), // 2 TON fee + 0.2 TON deployment
            },
        );
        console.log('✅ Transaction sent, hash:', tx);
    } catch (e) {
        console.error('❌ Transaction failed:', e);
        // Exit early if failed
        return;
    }
    console.log('Waiting for confirmation...\n');

    // Wait a bit for the transaction to be processed
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Get factory status
    const status = await factory.getFactoryStatus();
    console.log('Factory Status:');
    console.log('  Total Groups:', status.totalGroups.toString());
    console.log('  Is Active:', status.isActive);
    console.log('  Registration Fee:', (Number(status.registrationFee) / 1e9).toFixed(2), 'TON');

    // Wait for the transaction to be processed (increase to 30 seconds)
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Re-fetch factory status after waiting
    const finalStatus = await factory.getFactoryStatus();
    console.log('\nFactory status after waiting:');
    console.log('  Total Groups:', finalStatus.totalGroups.toString());
    console.log('  Is Active:', finalStatus.isActive);
    console.log('  Registration Fee:', (Number(finalStatus.registrationFee) / 1e9).toFixed(2), 'TON');

    // Calculate the group vault address
    if (status.totalGroups > 0n) {
        const groupIndex = status.totalGroups - 1n;
        const groupAddress = await factory.getGroupByIndex(groupIndex);
        if (groupAddress) {
            console.log('\n🎉 Group created successfully!');
            console.log('Group Index:', groupIndex.toString());
            console.log('Group Address:', groupAddress.toString());
            console.log('Explorer:', `https://testnet.tonscan.org/address/${groupAddress.toString()}`);
        }
    }
}
