import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    toNano,
} from '@ton/core';

export type GroupVaultFactoryConfig = {
    owner: Address;
};

export function groupVaultFactoryConfigToCell(config: GroupVaultFactoryConfig): Cell {
    return beginCell()
        .storeAddress(config.owner)
        .endCell();
}

export class GroupVaultFactory implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) { }

    static createFromConfig(config: GroupVaultFactoryConfig, code: Cell, workchain = 0) {
        const data = groupVaultFactoryConfigToCell(config);
        const init = { code, data };
        return new GroupVaultFactory(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendRegisterGroup(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            groupName: string;
            adminAddress: Address;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x1001, 32) // RegisterGroup opcode (placeholder, check actual opcode)
                .storeUint(0, 64) // query_id
                .storeRef(beginCell().storeStringTail(opts.groupName).endCell())
                .storeAddress(opts.adminAddress)
                .endCell(),
        });
    }
}
