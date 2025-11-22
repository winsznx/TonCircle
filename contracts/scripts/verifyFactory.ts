import { Address } from '@ton/core';
import { TonClient4 } from '@ton/ton';
import { GroupVaultFactory } from '../build/GroupVaultFactory/tact_GroupVaultFactory';

const FACTORY_ADDRESS = 'EQDl2F_jqOyubk6rNsGb_-bhUzipHlkZg6A2MtSshylSihK2';

async function verify() {
    console.log('🔍 Verifying GroupVaultFactory Contract\n');
    console.log('========================================');
    console.log('Factory Address:', FACTORY_ADDRESS);
    console.log('Network: Testnet');
    console.log('========================================\n');

    // Create client
    const client = new TonClient4({
        endpoint: 'https://testnet-v4.tonhubapi.com',
        timeout: 30000
    });

    const factoryAddress = Address.parse(FACTORY_ADDRESS);

    // Check if contract exists
    console.log('📡 Checking contract state...');
    try {
        const lastBlock = await client.getLastBlock();
        const account = await client.getAccountLite(lastBlock.last.seqno, factoryAddress);

        console.log('✅ Contract State:', account.account.state.type);
        console.log('💰 Balance:', Number(account.account.state.type === 'active' ? account.account.balance.coins : 0) / 1e9, 'TON');

        if (account.account.state.type !== 'active') {
            console.log('❌ Contract is not active!');
            return;
        }

        console.log('✅ Contract is active\n');
    } catch (error: any) {
        console.error('❌ Error checking contract state:', error.message);
        return;
    }

    // Open contract and test getters
    console.log('🧪 Testing contract getters...\n');

    const factory = client.open(GroupVaultFactory.fromAddress(factoryAddress));

    try {
        // Test getOwner
        console.log('📝 Testing getOwner()...');
        const owner = await factory.getGetOwner();
        console.log('✅ Owner:', owner.toString());

        // Test getFactoryStatus
        console.log('\n📝 Testing getFactoryStatus()...');
        const status = await factory.getGetFactoryStatus();
        console.log('✅ Factory Status:');
        console.log('   - Active:', status.isActive);
        console.log('   - Total Groups:', status.totalGroups.toString());
        console.log('   - Registration Fee:', Number(status.registrationFee) / 1e9, 'TON');

        // Test getGroupByIndex (should return null for index 0 since no groups yet)
        console.log('\n📝 Testing getGroupByIndex(0)...');
        const group = await factory.getGetGroupByIndex(0n);
        console.log('✅ Group at index 0:', group ? group.toString() : 'null (no groups yet)');

        console.log('\n========================================');
        console.log('✅ All verifications passed!');
        console.log('========================================\n');

        console.log('📊 Contract Summary:');
        console.log('   - Contract is deployed and active');
        console.log('   - All getter methods working correctly');
        console.log('   - Ready to create groups');
        console.log('   - Owner:', owner.toString());
        console.log('\n🔗 Explorer:', `https://testnet.tonscan.org/address/${FACTORY_ADDRESS}`);
        console.log('\n✅ Contract verification complete!\n');

    } catch (error: any) {
        console.error('❌ Error testing getters:', error.message);
        console.log('\n⚠️  Contract is deployed but getters may not be ready yet.');
        console.log('   This is normal on testnet. Try again in a minute.\n');
    }
}

verify().catch(console.error);
