/// Jetton message definitions for TEP-74 standard Jetton operations
/// Ref: https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md

/// Standard Jetton transfer message
message(0xf8a7ea5) JettonTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    responseDestination: Address;
    customPayload: Cell?;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

/// Jetton transfer notification (from Jetton wallet to contract)
message(0x7362d09c) JettonTransferNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forwardPayload: Slice as remaining;
}

/// Jetton burn message
message(0x595f07bc) JettonBurn {
    queryId: Int as uint64;
    amount: Int as coins;
    responseDestination: Address;
    customPayload: Cell?;
}

/// Provide wallet address message (query)
message(0x2c76b973) ProvideWalletAddress {
    queryId: Int as uint64;
    ownerAddress: Address;
    includeAddress: Bool;
}

/// Take wallet address message (response)
message(0xd1735400) TakeWalletAddress {
    queryId: Int as uint64;
    walletAddress: Address;
    ownerAddress: Slice as remaining;
}

/// Custom messages for TON Circle Jetton operations

/// Add expense in Jettons
message(0x3001) JettonAddExpense {
    queryId: Int as uint64;
    expenseId: Int;
    description: String;
    jettonMaster: Address;
    splitBetween: Cell; // Map of participants
    createdAt: Int;
}

/// Create goal in Jettons
message(0x3002) JettonCreateGoal {
    queryId: Int as uint64;
    goalId: Int;
    description: String;
    targetAmount: Int as coins;
    jettonMaster: Address;
    deadline: Int;
}

/// Contribute to Jetton goal
message(0x3003) JettonContributeToGoal {
    queryId: Int as uint64;
    goalId: Int;
    amount: Int as coins;
    contributor: Address;
}

/// Settle debt in Jettons
message(0x3004) JettonSettleDebt {
    queryId: Int as uint64;
    debtId: Int;
    amount: Int as coins;
    creditor: Address;
    jettonMaster: Address;
}

/// Withdraw Jettons from group vault
message(0x3005) JettonWithdraw {
    queryId: Int as uint64;
    amount: Int as coins;
    jettonMaster: Address;
    destination: Address;
}

/// Internal message: Jetton received
message(0x3006) InternalJettonReceived {
    from: Address;
    amount: Int as coins;
    jettonMaster: Address;
    purpose: String; // "expense", "goal", "debt", "deposit"
    referenceId: Int; // expenseId, goalId, etc.
}

/// Get Jetton wallet address for this contract
message(0x3007) GetJettonWallet {
    jettonMaster: Address;
}
