/**
 * Common constants shared across the application
 * Aligned with contract opcodes and error codes
 */

// Contract operation codes (MUST match Tolk contract opcodes)
export const OPCODES = {
  // GroupVault opcodes
  GROUP_REGISTER: 0x01,
  GROUP_ADD_MEMBER: 0x02,
  GROUP_REMOVE_MEMBER: 0x03,

  // ExpenseSplitter opcodes
  EXPENSE_CREATE: 0x10,
  EXPENSE_PAY: 0x11,
  EXPENSE_SETTLE: 0x12,

  // GoalContract opcodes
  GOAL_CREATE: 0x20,
  GOAL_CONTRIBUTE: 0x21,
  GOAL_WITHDRAW: 0x22,
  GOAL_REFUND: 0x23
};

// Error codes (MUST match contract error codes)
export const ERROR_CODES = {
  INSUFFICIENT_FUNDS: 100,
  UNAUTHORIZED: 101,
  INVALID_AMOUNT: 102,
  NOT_FOUND: 103,
  ALREADY_SETTLED: 104,
  DEADLINE_PASSED: 105,
  GOAL_NOT_REACHED: 106,
  GOAL_ALREADY_FUNDED: 107,
  INVALID_PARTICIPANT: 108,
  ALREADY_MEMBER: 109,
  NOT_MEMBER: 110,
  INVALID_OPCODE: 0xFFFF
};

// Network configuration
export const NETWORK = {
  TESTNET: 'testnet',
  MAINNET: 'mainnet'
};

// TON values
export const TON = {
  NANO: 1e9,
  MIN_STORAGE: 0.05, // Minimum TON for storage
  GAS_EXPENSE: 0.05, // Estimated gas for expense operations
  GAS_GOAL: 0.05, // Estimated gas for goal operations
  GAS_MEMBER: 0.02 // Estimated gas for member operations
};

// Contract addresses (to be filled after deployment)
export const CONTRACT_ADDRESSES = {
  TESTNET: {
    GROUP_VAULT: process.env.VITE_GROUP_VAULT_ADDRESS || '',
    EXPENSE_SPLITTER: process.env.VITE_EXPENSE_SPLITTER_ADDRESS || '',
    GOAL_CONTRACT: process.env.VITE_GOAL_CONTRACT_ADDRESS || ''
  },
  MAINNET: {
    GROUP_VAULT: process.env.VITE_GROUP_VAULT_ADDRESS_MAINNET || '',
    EXPENSE_SPLITTER: process.env.VITE_EXPENSE_SPLITTER_ADDRESS_MAINNET || '',
    GOAL_CONTRACT: process.env.VITE_GOAL_CONTRACT_ADDRESS_MAINNET || ''
  }
};

// Goal status enum (matches contract)
export const GOAL_STATUS = {
  ACTIVE: 0,
  FUNDED: 1,
  COMPLETED: 2,
  REFUNDED: 3
};

// Split types for expenses
export const SPLIT_TYPE = {
  EQUAL: 'equal',
  CUSTOM: 'custom',
  PERCENTAGE: 'percentage'
};
