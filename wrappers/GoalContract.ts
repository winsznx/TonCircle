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

export type GoalContractConfig = {
    groupId: number;
    goalCount: number;
};

export function goalContractConfigToCell(config: GoalContractConfig): Cell {
    return beginCell()
        .storeUint(config.groupId, 64)
        .storeDict(Dictionary.empty()) // goals
        .storeUint(config.goalCount, 32)
        .endCell();
}

export class GoalContract implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromConfig(config: GoalContractConfig, code: Cell, workchain = 0) {
        const data = goalContractConfigToCell(config);
        const init = { code, data };
        return new GoalContract(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendCreateGoal(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            title: string;
            targetAmount: bigint;
            recipientAddress: Address;
            deadline: number;
            isPublic: boolean;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x20, 32) // GOAL_CREATE opcode
                .storeUint(0, 64) // query_id
                .storeStringTail(opts.title)
                .storeCoins(opts.targetAmount)
                .storeAddress(opts.recipientAddress)
                .storeUint(opts.deadline, 64)
                .storeBit(opts.isPublic)
                .endCell(),
        });
    }

    async sendContribute(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            goalId: number;
            amount: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x21, 32) // GOAL_CONTRIBUTE opcode
                .storeUint(0, 64) // query_id
                .storeUint(opts.goalId, 32)
                .storeCoins(opts.amount)
                .endCell(),
        });
    }

    async sendWithdrawGoal(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            goalId: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x22, 32) // GOAL_WITHDRAW opcode
                .storeUint(0, 64) // query_id
                .storeUint(opts.goalId, 32)
                .endCell(),
        });
    }

    async sendRefundGoal(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            goalId: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x23, 32) // GOAL_REFUND opcode
                .storeUint(0, 64) // query_id
                .storeUint(opts.goalId, 32)
                .endCell(),
        });
    }

    async getGoal(provider: ContractProvider, goalId: number) {
        const result = await provider.get('getGoal', [
            { type: 'int', value: BigInt(goalId) },
        ]);
        return {
            goalId: result.stack.readNumber(),
            title: result.stack.readString(),
            targetAmount: result.stack.readBigNumber(),
            currentAmount: result.stack.readBigNumber(),
            recipientAddress: result.stack.readAddress(),
            deadline: result.stack.readNumber(),
            isPublic: result.stack.readBoolean(),
            status: result.stack.readNumber(),
            createdAt: result.stack.readNumber(),
        };
    }

    async getActiveGoals(provider: ContractProvider) {
        const result = await provider.get('getActiveGoals', []);
        return result.stack.readCell();
    }

    async getContributorAmount(provider: ContractProvider, goalId: number, address: Address) {
        const result = await provider.get('getContributorAmount', [
            { type: 'int', value: BigInt(goalId) },
            { type: 'slice', cell: beginCell().storeAddress(address).endCell() },
        ]);
        return result.stack.readBigNumber();
    }

    async getGoalCount(provider: ContractProvider) {
        const result = await provider.get('getGoalCount', []);
        return result.stack.readNumber();
    }
}
