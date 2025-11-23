import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    toNano
} from '@ton/core';

export type GroupVaultFactoryConfig = {
    owner: Address;
};

export type FactoryStatus = {
    totalGroups: bigint;
    isActive: boolean;
    registrationFee: bigint;
};

export function groupVaultFactoryConfigToCell(config: GroupVaultFactoryConfig): Cell {
    return beginCell()
        .storeAddress(config.owner)
        .endCell();
}

export class GroupVaultFactory implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) { }

    static createFromAddress(address: Address) {
        return new GroupVaultFactory(address);
    }

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

    /**
     * Register a new group
     * @param provider Contract provider
     * @param via Sender
     * @param opts Registration options
     */
    async sendRegisterGroup(
        provider: ContractProvider,
        via: Sender,
        opts: {
            groupName: string;
            groupHash: bigint;
            adminAddress: Address;
            value?: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value ?? toNano('2.2'), // Registration fee + deployment
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x1001, 32) // RegisterGroup opcode
                .storeUint(0, 64) // query_id
                .storeStringTail(opts.groupName)
                .storeInt(opts.groupHash, 257) // groupHash as 257-bit Int
                .storeAddress(opts.adminAddress)
                .endCell(),
        });
    }

    /**
     * Update factory settings (owner only)
     * @param provider Contract provider
     * @param via Sender
     * @param opts Settings to update
     */
    async sendUpdateSettings(
        provider: ContractProvider,
        via: Sender,
        opts: {
            maxGroupsPerAdmin?: number;
            registrationFee?: bigint;
            value?: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value ?? toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x1005, 32) // UpdateFactorySettings opcode
                .storeUint(0, 64) // query_id
                .storeUint(opts.maxGroupsPerAdmin ?? 10, 32)
                .storeCoins(opts.registrationFee ?? toNano('2'))
                .endCell(),
        });
    }

    /**
     * Emergency stop factory (owner only)
     * @param provider Contract provider
     * @param via Sender
     * @param reason Reason for emergency stop
     */
    async sendEmergencyStop(
        provider: ContractProvider,
        via: Sender,
        opts: {
            reason: string;
            value?: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value ?? toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x1006, 32) // EmergencyStop opcode
                .storeUint(0, 64) // query_id
                .storeStringTail(opts.reason)
                .endCell(),
        });
    }

    /**
     * Resume factory (owner only)
     * @param provider Contract provider
     * @param via Sender
     */
    async sendResumeFactory(
        provider: ContractProvider,
        via: Sender,
        value?: bigint
    ) {
        await provider.internal(via, {
            value: value ?? toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x1007, 32) // ResumeFactory opcode
                .storeUint(0, 64) // query_id
                .endCell(),
        });
    }

    /**
     * Get group vault address by index
     * @param provider Contract provider
     * @param groupIndex Group index
     * @returns Group vault address
     */
    async getGroupByIndex(provider: ContractProvider, groupIndex: bigint): Promise<Address | null> {
        const result = await provider.get('getGroupByIndex', [
            { type: 'int', value: groupIndex }
        ]);

        if (result.stack.remaining === 0) {
            return null;
        }

        return result.stack.readAddressOpt();
    }

    /**
     * Get factory status
     * @param provider Contract provider
     * @returns Factory status
     */
    async getFactoryStatus(provider: ContractProvider): Promise<FactoryStatus> {
        const result = await provider.get('getFactoryStatus', []);

        return {
            totalGroups: result.stack.readBigNumber(),
            isActive: result.stack.readBoolean(),
            registrationFee: result.stack.readBigNumber(),
        };
    }

    /**
     * Get factory owner address
     * @param provider Contract provider
     * @returns Owner address
     */
    async getOwner(provider: ContractProvider): Promise<Address> {
        const result = await provider.get('getOwner', []);
        return result.stack.readAddress();
    }
}
