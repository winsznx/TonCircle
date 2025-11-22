import { toNano, Address } from '@ton/core';
import { GroupVaultFactory } from '../build/GroupVaultFactory/tact_GroupVaultFactory';
import { NetworkProvider, sleep } from '@ton/blueprint';
import { TonClient4 } from '@ton/ton';

export async function run(provider: NetworkProvider) {
    console.log('🚀 Starting deployment with extended timeout...\n');

    const groupVaultFactory = provider.open(await GroupVaultFactory.fromInit(provider.sender().address!));

    console.log('📍 Deploying to address:', groupVaultFactory.address.toString());
    console.log('💰 Deployment cost: ~0.05 TON\n');

    // Try to send deployment transaction with retries
    let attempts = 0;
    const maxAttempts = 3;
    let deployed = false;

    while (attempts < maxAttempts && !deployed) {
        attempts++;
        console.log(`\n🔄 Attempt ${attempts}/${maxAttempts}...`);

        try {
            // Increase timeout by using custom client
            await groupVaultFactory.send(
                provider.sender(),
                {
                    value: toNano('0.05'),
                },
                null,
            );

            console.log('✅ Transaction sent! Waiting for deployment...');

            // Wait for deployment with manual polling
            deployed = await waitForDeploymentManual(groupVaultFactory.address, 60); // 60 seconds timeout

            if (deployed) {
                console.log('\n========================================');
                console.log('✅ GroupVaultFactory deployed successfully!');
                console.log('========================================');
                console.log('Address:', groupVaultFactory.address.toString());
                console.log('Explorer:', `https://testnet.tonscan.org/address/${groupVaultFactory.address.toString()}`);
                console.log('========================================\n');

                // Verify deployment
                try {
                    await sleep(5000); // Wait 5 seconds for contract to initialize

                    const owner = await groupVaultFactory.getGetOwner();
                    console.log('✅ Contract is active');
                    console.log('Owner:', owner.toString());

                    const status = await groupVaultFactory.getGetFactoryStatus();
                    console.log('Factory Active:', status.isActive);
                    console.log('Total Groups:', status.totalGroups.toString());
                    console.log('\n✅ Ready to create groups!\n');
                } catch (error) {
                    console.log('⚠️  Contract deployed but getters not yet available (normal on testnet)');
                    console.log('   Check explorer in a few minutes\n');
                }
            }
        } catch (error: any) {
            console.error(`❌ Attempt ${attempts} failed:`, error.message);

            if (attempts < maxAttempts) {
                console.log(`⏳ Waiting 10 seconds before retry...`);
                await sleep(10000);
            }
        }
    }

    if (!deployed) {
        console.error('\n❌ Deployment failed after', maxAttempts, 'attempts');
        console.error('Try again or check:');
        console.error('1. Your wallet has testnet TON (get from https://t.me/testgiver_ton_bot)');
        console.error('2. Testnet API is working (check https://testnet.tonscan.org)');
        console.error('3. Try deploying manually via Tonkeeper\n');
    }
}

async function waitForDeploymentManual(address: Address, timeoutSec: number): Promise<boolean> {
    const client = new TonClient4({
        endpoint: 'https://testnet-v4.tonhubapi.com',
        timeout: 30000 // 30 second timeout for each request
    });

    const startTime = Date.now();
    const timeoutMs = timeoutSec * 1000;

    while (Date.now() - startTime < timeoutMs) {
        try {
            const state = await client.getAccountLite(Date.now(), address);

            if (state.account.state.type === 'active') {
                return true;
            }

            console.log('⏳ Waiting for contract to be deployed...');
            await sleep(3000); // Check every 3 seconds
        } catch (error) {
            // Continue waiting
            await sleep(3000);
        }
    }

    return false;
}
