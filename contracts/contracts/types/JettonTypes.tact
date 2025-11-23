/// Jetton (Token) types for multi-currency support
/// Enables TON Circle to work with USDT, USDC, and other Jettons

import "../utils/GroupUtils.tact";

/// Standard Jetton wallet information
struct JettonWalletData {
    balance: Int as coins;
    owner: Address;
    jettonMaster: Address;
}

/// Currency type enumeration
const CURRENCY_TYPE_TON: Int = 0;
const CURRENCY_TYPE_JETTON: Int = 1;

/// Currency information
struct CurrencyInfo {
    currencyType: Int; // 0 = TON, 1 = Jetton
    jettonMasterAddress: Address?; // null for TON, Jetton Master for tokens
    symbol: String; // "TON", "USDT", "USDC", etc.
    decimals: Int; // Usually 9 for TON, 6 for USDT
}

/// Common Jetton addresses on TON (to be updated with actual addresses)
/// These will be populated based on network (testnet/mainnet)

// Placeholder - will be set in contract initialization
const JETTON_USDT_MASTER: Address = address("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c");
const JETTON_USDC_MASTER: Address = address("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c");

/// Jetton transfer notification payload
/// Received when someone sends Jettons to the contract
struct JettonTransferNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forwardPayload: Slice as remaining;
}

/// Jetton expense tracking
struct JettonExpenseInfo {
    expenseId: Int;
    description: String;
    totalAmount: Int as coins;
    paidBy: Address;
    currencyInfo: CurrencyInfo;
    jettonWallet: Address?; // Jetton wallet address if using Jettons
    splitBetween: map<Address, Int>; // Address -> share amount in Jettons
    createdAt: Int;
    isSettled: Bool;
}

/// Jetton goal tracking
struct JettonGoalInfo {
    goalId: Int;
    description: String;
    targetAmount: Int as coins;
    currentAmount: Int as coins;
    currencyInfo: CurrencyInfo;
    deadline: Int;
    contributors: map<Address, Int>; // Address -> contributed amount
    isCompleted: Bool;
    createdAt: Int;
}

/// Helper function to get currency symbol
fun getCurrencySymbol(currencyType: Int, jettonMaster: Address?): String {
    if (currencyType == CURRENCY_TYPE_TON) {
        return "TON";
    }

    // Check known Jettons
    if (jettonMaster != null) {
        if (jettonMaster!! == JETTON_USDT_MASTER) {
            return "USDT";
        }
        if (jettonMaster!! == JETTON_USDC_MASTER) {
            return "USDC";
        }
    }

    return "TOKEN";
}

/// Helper to create TON currency info
fun createTONCurrency(): CurrencyInfo {
    return CurrencyInfo {
        currencyType: CURRENCY_TYPE_TON,
        jettonMasterAddress: null,
        symbol: "TON",
        decimals: 9
    };
}

/// Helper to create Jetton currency info
fun createJettonCurrency(jettonMaster: Address, symbol: String, decimals: Int): CurrencyInfo {
    return CurrencyInfo {
        currencyType: CURRENCY_TYPE_JETTON,
        jettonMasterAddress: jettonMaster,
        symbol: symbol,
        decimals: decimals
    };
}

/// Jetton balance tracking per member
struct MemberJettonBalance {
    memberAddress: Address;
    jettonMaster: Address;
    balance: Int as coins; // Can be positive (credit) or negative (debt)
    jettonWallet: Address; // Member's Jetton wallet address
}
