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
    TupleBuilder,
} from '@ton/core';

export type ExpenseSplitterConfig = {
    groupId: number;
    expenseCount: number;
};

export function expenseSplitterConfigToCell(config: ExpenseSplitterConfig): Cell {
    return beginCell()
        .storeUint(config.groupId, 64)
        .storeDict(Dictionary.empty()) // expenses
        .storeUint(config.expenseCount, 32)
        .storeDict(Dictionary.empty()) // netBalances
        .endCell();
}

export class ExpenseSplitter implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromConfig(config: ExpenseSplitterConfig, code: Cell, workchain = 0) {
        const data = expenseSplitterConfigToCell(config);
        const init = { code, data };
        return new ExpenseSplitter(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendCreateExpense(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            amount: bigint;
            description: string;
            participants: Address[];
        }
    ) {
        const builder = beginCell()
            .storeUint(0x10, 32) // EXPENSE_CREATE opcode
            .storeUint(0, 64) // query_id
            .storeCoins(opts.amount)
            .storeStringTail(opts.description)
            .storeUint(opts.participants.length, 8);

        opts.participants.forEach((addr) => {
            builder.storeAddress(addr);
        });

        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: builder.endCell(),
        });
    }

    async sendPayExpense(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            expenseId: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x11, 32) // EXPENSE_PAY opcode
                .storeUint(0, 64) // query_id
                .storeUint(opts.expenseId, 32)
                .endCell(),
        });
    }

    async sendSettleExpense(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            expenseId: number;
            amount: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x12, 32) // EXPENSE_SETTLE opcode
                .storeUint(0, 64) // query_id
                .storeUint(opts.expenseId, 32)
                .storeCoins(opts.amount)
                .endCell(),
        });
    }

    async getBalance(provider: ContractProvider, address: Address) {
        const result = await provider.get('getBalance', [
            { type: 'slice', cell: beginCell().storeAddress(address).endCell() },
        ]);
        return result.stack.readBigNumber();
    }

    async getExpense(provider: ContractProvider, expenseId: number) {
        const result = await provider.get('getExpense', [
            { type: 'int', value: BigInt(expenseId) },
        ]);
        return {
            expenseId: result.stack.readNumber(),
            payerAddress: result.stack.readAddress(),
            totalAmount: result.stack.readBigNumber(),
            description: result.stack.readString(),
            timestamp: result.stack.readNumber(),
        };
    }

    async getUnsettledExpenses(provider: ContractProvider) {
        const result = await provider.get('getUnsettledExpenses', []);
        // Parse and return array of unsettled expenses
        return result.stack.readCell();
    }

    async getExpenseCount(provider: ContractProvider) {
        const result = await provider.get('getExpenseCount', []);
        return result.stack.readNumber();
    }
}
