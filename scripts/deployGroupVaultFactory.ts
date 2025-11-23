import { toNano } from '@ton/core';
import { GroupVaultFactory } from '../wrappers/GroupVaultFactory';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const factory = provider.open(
        GroupVaultFactory.createFromConfig(
            {
                owner: provider.sender().address!,
            },
            await compile('GroupVaultFactory')
        )
    );

    await factory.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(factory.address);

    console.log('GroupVaultFactory deployed at address:', factory.address.toString());
}
