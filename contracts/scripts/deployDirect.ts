import { toNano, Address, internal } from '@ton/core';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { WalletContractV4, TonClient4 } from '@ton/ton';
import { GroupVaultFactory } from '../build/GroupVaultFactory/tact_GroupVaultFactory';
import { config } from 'dotenv';

config();

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log('🚀 Direct Deployment to Testnet\n');

    // Get mnemonic from env
    const mnemonic = process.env.MNEMONIC || process.env.WALLET_MNEMONIC;
    if (!mnemonic) {
        throw new Error('MNEMONIC not found in .env file');
    }

    // Create client with direct endpoint
    const client = new TonClient4({
        endpoint: 'https://testnet-v4.tonhubapi.com',
        timeout: 60000 // 60 second timeout
    });

    // Get wallet from mnemonic
    const key = await mnemonicToPrivateKey(mnemonic.split(' '));
    const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: key.publicKey
    });

    const contract = client.open(wallet);
    const walletAddress = wallet.address;

    console.log('📱 Wallet address:', walletAddress.toString());

    // Check balance
    const lastBlock = await client.getLastBlock();
    const balance = await client.getAccountLite(lastBlock.last.seqno, walletAddress);
    console.log('💰 Balance:', Number(balance.account.balance.coins) / 1e9, 'TON\n');

    if (Number(balance.account.balance.coins) < toNano('0.1')) {
        throw new Error('Insufficient balance. Need at least 0.1 TON for deployment');
    }

    // Create factory contract instance
    const factory = await GroupVaultFactory.fromInit(walletAddress);
    const factoryAddress = factory.address;

    console.log('📍 Factory will be deployed at:', factoryAddress.toString());
    console.log('🔗 Explorer:', `https://testnet.tonscan.org/address/${factoryAddress.toString()}\n`);

    // Check if already deployed
    try {
        const block = await client.getLastBlock();
        const state = await client.getAccountLite(block.last.seqno, factoryAddress);
        if (state.account.state.type === 'active') {
            console.log('✅ Factory already deployed!');
            console.log('Address:', factoryAddress.toString());
            return;
        }
    } catch (e) {
        // Not deployed yet
    }

    console.log('📤 Sending deployment transaction...');

    // Get seqno
    const seqno = await contract.getSeqno();

    // Send deployment
    await contract.sendTransfer({
        seqno,
        secretKey: key.secretKey,
        messages: [
            internal({
                to: factoryAddress,
                value: toNano('0.5'), // 0.5 TON for deployment
                bounce: false,
                init: factory.init,
                body: null as any
            })
        ]
    });

    console.log('✅ Transaction sent! Waiting for confirmation...\n');

    // Wait for deployment
    let deployed = false;
    let attempts = 0;
    const maxAttempts = 40; // 2 minutes (40 * 3 seconds)

    while (!deployed && attempts < maxAttempts) {
        attempts++;
        await sleep(3000);

        try {
            const block = await client.getLastBlock();
            const state = await client.getAccountLite(block.last.seqno, factoryAddress);

            if (state.account.state.type === 'active') {
                deployed = true;
                console.log('\n========================================');
                console.log('✅ Factory deployed successfully!');
                console.log('========================================');
                console.log('Address:', factoryAddress.toString());
                console.log('Explorer:', `https://testnet.tonscan.org/address/${factoryAddress.toString()}`);
                console.log('========================================\n');

                // Try to verify
                await sleep(5000);
                try {
                    const openedFactory = client.open(factory);
                    const owner = await openedFactory.getGetOwner();
                    console.log('✅ Contract verified');
                    console.log('Owner:', owner.toString());

                    const status = await openedFactory.getGetFactoryStatus();
                    console.log('Active:', status.isActive);
                    console.log('Total Groups:', status.totalGroups.toString());
                } catch (e) {
                    console.log('⚠️  Getters not ready yet (check in a minute)');
                }
            } else {
                process.stdout.write(`\r⏳ Waiting for deployment... ${attempts}/${maxAttempts}`);
            }
        } catch (error) {
            process.stdout.write(`\r⏳ Waiting for deployment... ${attempts}/${maxAttempts}`);
        }
    }

    if (!deployed) {
        console.log('\n\n⚠️  Deployment taking longer than expected');
        console.log('Check explorer in a few minutes:', `https://testnet.tonscan.org/address/${factoryAddress.toString()}`);
    }
}

run().catch(console.error);
