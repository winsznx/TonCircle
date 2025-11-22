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

export type MemberConfig = {
    memberIndex: bigint;
    groupVault: Address;
};

export type MemberProfile = {
    memberAddress: Address;
    displayName: string;
    avatarHash?: string;
    bio?: string;
    reputationScore: bigint;
    joinedAt: bigint;
    isActive: boolean;
    totalContributed: bigint;
    totalOwed: bigint;
};

export type MemberStats = {
    contributionCount: bigint;
    totalContributed: bigint;
    debtCount: bigint;
    totalOwed: bigint;
    reputationScore: bigint;
    memberSince: bigint;
    lastActive: bigint;
};

export function memberConfigToCell(config: MemberConfig): Cell {
    return beginCell()
        .storeUint(config.memberIndex, 64)
        .storeAddress(config.groupVault)
        .endCell();
}

export class Member implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new Member(address);
    }

    static createFromConfig(config: MemberConfig, code: Cell, workchain = 0) {
        const data = memberConfigToCell(config);
        const init = { code, data };
        return new Member(contractAddress(workchain, init), init);
    }

    // ==================== PROFILE MANAGEMENT ====================

    /**
     * Update member profile
     * @param provider Contract provider
     * @param via Sender
     * @param opts Profile updates
     */
    async sendUpdateProfile(
        provider: ContractProvider,
        via: Sender,
        opts: {
            displayName?: string;
            avatarHash?: string;
            bio?: string;
            value?: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value ?? toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x3001, 32) // UpdateProfile opcode
                .storeUint(0, 64) // query_id
                .storeStringTail(opts.displayName ?? '')
                .storeStringTail(opts.avatarHash ?? '')
                .storeStringTail(opts.bio ?? '')
                .endCell(),
        });
    }

    /**
     * Update member settings
     * @param provider Contract provider
     * @param via Sender
     * @param opts Settings to update
     */
    async sendUpdateSettings(
        provider: ContractProvider,
        via: Sender,
        opts: {
            isPrivate?: boolean;
            allowDirectMessages?: boolean;
            value?: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value ?? toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x3006, 32) // UpdateSettings opcode
                .storeUint(0, 64) // query_id
                .storeBit(opts.isPrivate ?? false)
                .storeBit(opts.allowDirectMessages ?? true)
                .endCell(),
        });
    }

    /**
     * Leave the group
     * @param provider Contract provider
     * @param via Sender
     * @param opts Leave options
     */
    async sendLeaveGroup(
        provider: ContractProvider,
        via: Sender,
        opts: {
            reason: string;
            finalSettlement: boolean;
            value?: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value ?? toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x3007, 32) // LeaveGroup opcode
                .storeUint(0, 64) // query_id
                .storeStringTail(opts.reason)
                .storeBit(opts.finalSettlement)
                .endCell(),
        });
    }

    // ==================== GETTERS ====================

    /**
     * Get member profile
     * @param provider Contract provider
     * @returns Member profile
     */
    async getMemberProfile(provider: ContractProvider): Promise<MemberProfile> {
        const result = await provider.get('getMemberProfile', []);

        return {
            memberAddress: result.stack.readAddress(),
            displayName: result.stack.readString(),
            avatarHash: result.stack.readStringOpt(),
            bio: result.stack.readStringOpt(),
            reputationScore: result.stack.readBigNumber(),
            joinedAt: result.stack.readBigNumber(),
            isActive: result.stack.readBoolean(),
            totalContributed: result.stack.readBigNumber(),
            totalOwed: result.stack.readBigNumber(),
        };
    }

    /**
     * Get member statistics
     * @param provider Contract provider
     * @returns Member statistics
     */
    async getMemberStats(provider: ContractProvider): Promise<MemberStats> {
        const result = await provider.get('getMemberStats', []);

        return {
            contributionCount: result.stack.readBigNumber(),
            totalContributed: result.stack.readBigNumber(),
            debtCount: result.stack.readBigNumber(),
            totalOwed: result.stack.readBigNumber(),
            reputationScore: result.stack.readBigNumber(),
            memberSince: result.stack.readBigNumber(),
            lastActive: result.stack.readBigNumber(),
        };
    }

    /**
     * Get reputation score
     * @param provider Contract provider
     * @returns Reputation score
     */
    async getReputationScore(provider: ContractProvider): Promise<bigint> {
        const result = await provider.get('getReputationScore', []);
        return result.stack.readBigNumber();
    }

    /**
     * Get member address
     * @param provider Contract provider
     * @returns Member address
     */
    async getMemberAddress(provider: ContractProvider): Promise<Address> {
        const result = await provider.get('getMemberAddress', []);
        return result.stack.readAddress();
    }

    /**
     * Get group vault address
     * @param provider Contract provider
     * @returns Group vault address
     */
    async getGroupVault(provider: ContractProvider): Promise<Address> {
        const result = await provider.get('getGroupVault', []);
        return result.stack.readAddress();
    }

    /**
     * Get total contributed amount
     * @param provider Contract provider
     * @returns Total contributed
     */
    async getTotalContributed(provider: ContractProvider): Promise<bigint> {
        const result = await provider.get('getTotalContributed', []);
        return result.stack.readBigNumber();
    }

    /**
     * Get total owed amount
     * @param provider Contract provider
     * @returns Total owed
     */
    async getTotalOwed(provider: ContractProvider): Promise<bigint> {
        const result = await provider.get('getTotalOwed', []);
        return result.stack.readBigNumber();
    }

    /**
     * Get member status
     * @param provider Contract provider
     * @returns Member status (1=active, 0=inactive, etc.)
     */
    async getMemberStatus(provider: ContractProvider): Promise<bigint> {
        const result = await provider.get('getMemberStatus', []);
        return result.stack.readBigNumber();
    }

    /**
     * Check if member is active
     * @param provider Contract provider
     * @returns True if active
     */
    async isActive(provider: ContractProvider): Promise<boolean> {
        const status = await this.getMemberStatus(provider);
        return status === 1n; // MEMBER_STATUS_ACTIVE = 1
    }
}
