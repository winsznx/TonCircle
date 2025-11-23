import { Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const walletAddress = Address.parse('EQBX2HNTkNnt7_31ts04h0Ln0oPpCUNFryCektEbl3Bscpst');

    console.log('Checking wallet balance...');
    console.log('Address:', walletAddress.toString());

    const balance = await provider.provider(walletAddress).getState();

    console.log('\nWallet Status:');
    console.log('  Balance:', (Number(balance.balance) / 1e9).toFixed(4), 'TON');
    console.log('  State:', balance.state.type);

    if (Number(balance.balance) < 2.2e9) {
        console.log('\n⚠️  Insufficient balance!');
        console.log('  Required: 2.2 TON');
        console.log('  Current:', (Number(balance.balance) / 1e9).toFixed(4), 'TON');
        console.log('\n💡 Get testnet TON from: https://t.me/testgiver_ton_bot');
    } else {
        console.log('\n✅ Sufficient balance for group creation');
    }

    // Also check factory status
    console.log('\n---');
    console.log('Checking factory at: EQDU7ANbVtUxcw79x7dFfltROR2hNYGefwBIzdPEm33wKbs9');

    const factoryAddress = Address.parse('EQDU7ANbVtUxcw79x7dFfltROR2hNYGefwBIzdPEm33wKbs9');
    const factoryState = await provider.provider(factoryAddress).getState();

    console.log('Factory Status:');
    console.log('  State:', factoryState.state.type);
    console.log('  Balance:', (Number(factoryState.balance) / 1e9).toFixed(4), 'TON');
}
