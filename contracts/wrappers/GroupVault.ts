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
    Dictionary
} from '@ton/core';

export type GroupVaultConfig = {
    groupIndex: bigint;
    factory: Address;
};

export type GroupInfo = {
    groupHash: bigint;
    groupName: string;
    adminAddress: Address;
    createdAt: bigint;
    memberCount: bigint;
    isActive: boolean;
};

export type GoalInfo = {
    goalId: bigint;
    title: string;
    description: string;
    targetAmount: bigint;
    currentAmount: bigint;
    deadline: bigint;
    recipientAddress: Address;
    isCompleted: boolean;
    contributorCount: bigint;
    createdAt: bigint;
};

export type ExpenseInfo = {
    expenseId: bigint;
    description: string;
    totalAmount: bigint;
    paidBy: Address;
    createdAt: bigint;
    isSettled: boolean;
};

export type DebtInfo = {
    debtId: bigint;
    debtor: Address;
    creditor: Address;
    amount: bigint;
    createdAt: bigint;
    isSettled: boolean;
    reason: string;
};

export function groupVaultConfigToCell(config: GroupVaultConfig): Cell {
    return beginCell()
        .storeUint(config.groupIndex, 64)
        .storeAddress(config.factory)
        .endCell();
}

export class GroupVault implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new GroupVault(address);
    }

    static createFromConfig(config: GroupVaultConfig, code: Cell, workchain = 0) {
        const data = groupVaultConfigToCell(config);
        const init = { code, data };
        return new GroupVault(contractAddress(workchain, init), init);
    }

    // ==================== MEMBER MANAGEMENT ====================

    /**
     * Add a member to the group
     * @param provider Contract provider
     * @param via Sender
     * @param memberAddress Address of member to add
     */
    async sendAddMember(
        provider: ContractProvider,
        via: Sender,
        opts: {
            memberAddress: Address;
            value?: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value ?? toNano('0.1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x2001, 32) // AddMember opcode
                .storeUint(0, 64) // query_id
                .storeAddress(opts.memberAddress)
                .endCell(),
        });
    }

    /**
     * Remove a member from the group (admin only)
     * @param provider Contract provider
     * @param via Sender
     * @param opts Member to remove and reason
     */
    async sendRemoveMember(
        provider: ContractProvider,
        via: Sender,
        opts: {
            memberAddress: Address;
            reason: string;
            value?: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value ?? toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x2002, 32) // RemoveMember opcode
                .storeUint(0, 64) // query_id
                .storeAddress(opts.memberAddress)
                .storeStringTail(opts.reason)
                .endCell(),
        });
    }

    // ==================== GOALS MANAGEMENT ====================

    /**
     * Create a new group goal
     * @param provider Contract provider
     * @param via Sender
     * @param opts Goal details
     */
    async sendCreateGoal(
        provider: ContractProvider,
        via: Sender,
        opts: {
            title: string;
            description: string;
            targetAmount: bigint;
            deadline: bigint;
            recipientAddress: Address;
            value?: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value ?? toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x2004, 32) // CreateGoal opcode
                .storeUint(0, 64) // query_id
                .storeUint(0, 64) // goalId (will be assigned by contract)
                .storeStringTail(opts.title)
                .storeRef(
                    beginCell()
                        .storeStringTail(opts.description)
                        .endCell()
                )
                .storeCoins(opts.targetAmount)
                .storeUint(opts.deadline, 64)
                .storeAddress(opts.recipientAddress)
                .endCell(),
        });
    }

    /**
     * Contribute to a goal
     * @param provider Contract provider
     * @param via Sender
     * @param opts Goal ID and contribution amount
     */
    async sendContributeToGoal(
        provider: ContractProvider,
        via: Sender,
        opts: {
            goalId: bigint;
            amount: bigint;
            message?: string;
        }
    ) {
        await provider.internal(via, {
            value: opts.amount + toNano('0.05'), // Amount + gas
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x2005, 32) // ContributeToGoal opcode
                .storeUint(0, 64) // query_id
                .storeUint(opts.goalId, 64)
                .storeCoins(opts.amount)
                .storeStringTail(opts.message ?? '')
                .endCell(),
        });
    }

    // ==================== EXPENSE MANAGEMENT ====================

    /**
     * Record a new expense
     * @param provider Contract provider
     * @param via Sender
     * @param opts Expense details
     */
    async sendRecordExpense(
        provider: ContractProvider,
        via: Sender,
        opts: {
            description: string;
            totalAmount: bigint;
            paidBy: Address;
            splitBetween: Address[];
            splitAmounts: bigint[];
            value?: bigint;
        }
    ) {
        // Encode split addresses array
        const splitBetweenCell = beginCell();
        splitBetweenCell.storeUint(opts.splitBetween.length, 32);
        for (const addr of opts.splitBetween) {
            splitBetweenCell.storeAddress(addr);
        }

        // Encode split amounts array
        const splitAmountsCell = beginCell();
        splitAmountsCell.storeUint(opts.splitAmounts.length, 32);
        for (const amount of opts.splitAmounts) {
            splitAmountsCell.storeUint(Number(amount), 64);
        }

        await provider.internal(via, {
            value: opts.value ?? toNano('0.1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x2007, 32) // RecordExpense opcode
                .storeUint(0, 64) // query_id
                .storeUint(0, 64) // expenseId (will be assigned by contract)
                .storeStringTail(opts.description)
                .storeCoins(opts.totalAmount)
                .storeAddress(opts.paidBy)
                .storeRef(splitBetweenCell.endCell())
                .storeRef(splitAmountsCell.endCell())
                .endCell(),
        });
    }

    // ==================== DEBT SETTLEMENT ====================

    /**
     * Settle a debt
     * @param provider Contract provider
     * @param via Sender
     * @param opts Debt ID and settlement details
     */
    async sendSettleDebt(
        provider: ContractProvider,
        via: Sender,
        opts: {
            debtId: bigint;
            amount: bigint;
            creditor: Address;
        }
    ) {
        await provider.internal(via, {
            value: opts.amount + toNano('0.05'), // Amount + gas
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x2008, 32) // GroupSettleDebt opcode
                .storeUint(0, 64) // query_id
                .storeUint(opts.debtId, 64)
                .storeCoins(opts.amount)
                .storeAddress(opts.creditor)
                .storeUint(0, 64) // settlementId (will be generated by contract)
                .endCell(),
        });
    }

    // ==================== GETTERS ====================

    /**
     * Get group information
     * @param provider Contract provider
     * @returns Group info
     */
    async getGroupInfo(provider: ContractProvider): Promise<GroupInfo> {
        const result = await provider.get('getGroupInfo', []);

        return {
            groupHash: result.stack.readBigNumber(),
            groupName: result.stack.readString(),
            adminAddress: result.stack.readAddress(),
            createdAt: result.stack.readBigNumber(),
            memberCount: result.stack.readBigNumber(),
            isActive: result.stack.readBoolean(),
        };
    }

    /**
     * Get member count
     * @param provider Contract provider
     * @returns Member count
     */
    async getMemberCount(provider: ContractProvider): Promise<bigint> {
        const result = await provider.get('getMemberCount', []);
        return result.stack.readBigNumber();
    }

    /**
     * Get specific goal information
     * @param provider Contract provider
     * @param goalId Goal ID
     * @returns Goal info or null
     */
    async getGoal(provider: ContractProvider, goalId: bigint): Promise<GoalInfo | null> {
        const result = await provider.get('getGoal', [
            { type: 'int', value: goalId }
        ]);

        if (result.stack.remaining === 0) {
            return null;
        }

        return {
            goalId: result.stack.readBigNumber(),
            title: result.stack.readString(),
            description: result.stack.readString(),
            targetAmount: result.stack.readBigNumber(),
            currentAmount: result.stack.readBigNumber(),
            deadline: result.stack.readBigNumber(),
            recipientAddress: result.stack.readAddress(),
            isCompleted: result.stack.readBoolean(),
            contributorCount: result.stack.readBigNumber(),
            createdAt: result.stack.readBigNumber(),
        };
    }

    /**
     * Get specific expense information
     * @param provider Contract provider
     * @param expenseId Expense ID
     * @returns Expense info or null
     */
    async getExpense(provider: ContractProvider, expenseId: bigint): Promise<ExpenseInfo | null> {
        const result = await provider.get('getExpense', [
            { type: 'int', value: expenseId }
        ]);

        if (result.stack.remaining === 0) {
            return null;
        }

        return {
            expenseId: result.stack.readBigNumber(),
            description: result.stack.readString(),
            totalAmount: result.stack.readBigNumber(),
            paidBy: result.stack.readAddress(),
            createdAt: result.stack.readBigNumber(),
            isSettled: result.stack.readBoolean(),
        };
    }

    /**
     * Get specific debt information
     * @param provider Contract provider
     * @param debtId Debt ID
     * @returns Debt info or null
     */
    async getDebt(provider: ContractProvider, debtId: bigint): Promise<DebtInfo | null> {
        const result = await provider.get('getDebt', [
            { type: 'int', value: debtId }
        ]);

        if (result.stack.remaining === 0) {
            return null;
        }

        return {
            debtId: result.stack.readBigNumber(),
            debtor: result.stack.readAddress(),
            creditor: result.stack.readAddress(),
            amount: result.stack.readBigNumber(),
            createdAt: result.stack.readBigNumber(),
            isSettled: result.stack.readBoolean(),
            reason: result.stack.readString(),
        };
    }

    /**
     * Get member contract address
     * @param provider Contract provider
     * @param memberAddress Member address
     * @returns Member contract address or null
     */
    async getMemberContract(provider: ContractProvider, memberAddress: Address): Promise<Address | null> {
        const result = await provider.get('getMemberContract', [
            { type: 'slice', cell: beginCell().storeAddress(memberAddress).endCell() }
        ]);

        if (result.stack.remaining === 0) {
            return null;
        }

        return result.stack.readAddressOpt();
    }

    /**
     * Get admin address
     * @param provider Contract provider
     * @returns Admin address
     */
    async getAdminAddress(provider: ContractProvider): Promise<Address> {
        const result = await provider.get('getAdminAddress', []);
        return result.stack.readAddress();
    }

    /**
     * Get factory address
     * @param provider Contract provider
     * @returns Factory address
     */
    async getFactoryAddress(provider: ContractProvider): Promise<Address> {
        const result = await provider.get('getFactoryAddress', []);
        return result.stack.readAddress();
    }

    /**
     * Get group index
     * @param provider Contract provider
     * @returns Group index
     */
    async getGroupIndex(provider: ContractProvider): Promise<bigint> {
        const result = await provider.get('getGroupIndex', []);
        return result.stack.readBigNumber();
    }
}
