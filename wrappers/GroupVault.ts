import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    Dictionary,
} from '@ton/core';

export type GroupVaultConfig = {
    groupId: number;
    adminAddress: Address;
};

export function groupVaultConfigToCell(config: GroupVaultConfig): Cell {
    return beginCell()
        .storeUint(config.groupId, 64)
        .storeAddress(config.adminAddress)
        .storeDict(Dictionary.empty()) // memberAddresses
        .storeUint(0, 32) // totalMembers
        .storeUint(Math.floor(Date.now() / 1000), 64) // createdAt
        .storeBit(true) // isActive
        .endCell();
}

export class GroupVault implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromConfig(config: GroupVaultConfig, code: Cell, workchain = 0) {
        const data = groupVaultConfigToCell(config);
        const init = { code, data };
        return new GroupVault(contractAddress(workchain, init), init);
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
            groupId: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x01, 32) // opcode for GROUP_DEPOSIT/REGISTER
                .storeUint(0, 64) // query_id
                .storeUint(opts.groupId, 64)
                .endCell(),
        });
    }

    async sendAddMember(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            memberAddress: Address;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x02, 32) // opcode for ADD_MEMBER
                .storeUint(0, 64) // query_id
                .storeAddress(opts.memberAddress)
                .endCell(),
        });
    }

    async sendRemoveMember(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            memberAddress: Address;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x03, 32) // opcode for REMOVE_MEMBER
                .storeUint(0, 64) // query_id
                .storeAddress(opts.memberAddress)
                .endCell(),
        });
    }

    async getGroupInfo(provider: ContractProvider) {
        const result = await provider.get('getGroupInfo', []);
        return {
            groupId: result.stack.readNumber(),
            adminAddress: result.stack.readAddress(),
            totalMembers: result.stack.readNumber(),
            createdAt: result.stack.readNumber(),
            isActive: result.stack.readBoolean(),
        };
    }

    async getMemberCount(provider: ContractProvider) {
        const result = await provider.get('getMemberCount', []);
        return result.stack.readNumber();
    }

    async isMember(provider: ContractProvider, address: Address) {
        const result = await provider.get('isMember', [
            { type: 'slice', cell: beginCell().storeAddress(address).endCell() },
        ]);
        return result.stack.readBoolean();
    }
}
