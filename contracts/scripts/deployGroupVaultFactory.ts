import { toNano } from '@ton/core';
import { GroupVaultFactory } from '../build/GroupVaultFactory/GroupVaultFactory_GroupVaultFactory';
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

    console.log('GroupVaultFactory deployed at:', groupVaultFactory.address.toString());

    // Run some initial getters to verify deployment
    // const factoryStatus = await groupVaultFactory.getFactoryStatus();
    // console.log('Factory status:', factoryStatus);
    
    // const owner = await groupVaultFactory.getOwner();
    // console.log('Factory owner:', owner.toString());
    
    // const factoryAddress = await groupVaultFactory.getAddress();
    // console.log('Factory address:', factoryAddress.toString());
}