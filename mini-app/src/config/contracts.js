/**
 * Smart Contract Configuration
 *
 * UPDATE THESE ADDRESSES AFTER DEPLOYMENT
 */

// Network configuration
export const NETWORK = import.meta.env.VITE_TON_NETWORK || 'testnet';

// Factory contract address - DEPLOYED TO TESTNET
export const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS || 'EQDl2F_jqOyubk6rNsGb_-bhUzipHlkZg6A2MtSshylSihK2';

// Contract opcodes for reference
export const OPCODES = {
  // Factory opcodes
  FACTORY_REGISTER_GROUP: 0x1001,
  FACTORY_UPDATE_SETTINGS: 0x1002,
  FACTORY_EMERGENCY_STOP: 0x1003,
  FACTORY_RESUME: 0x1004,

  // GroupVault opcodes
  GROUP_ADD_MEMBER: 0x2001,
  GROUP_REMOVE_MEMBER: 0x2002,
  GROUP_UPDATE_SETTINGS: 0x2003,
  GROUP_CREATE_GOAL: 0x2004,
  GROUP_CONTRIBUTE_TO_GOAL: 0x2005,
  GROUP_CANCEL_GOAL: 0x2006,
  GROUP_RECORD_EXPENSE: 0x2007,
  GROUP_SETTLE_DEBT: 0x2008,
  GROUP_DEACTIVATE: 0x2009,
  GROUP_REACTIVATE: 0x200A,

  // Member opcodes
  MEMBER_UPDATE_PROFILE: 0x3001,
  MEMBER_RECORD_CONTRIBUTION: 0x3002,
  MEMBER_UPDATE_REPUTATION: 0x3003,
};

// Gas amounts for different operations (in TON)
export const GAS_AMOUNTS = {
  REGISTER_GROUP: '2.2',
  ADD_MEMBER: '0.1',
  REMOVE_MEMBER: '0.05',
  CREATE_GOAL: '0.15',
  CONTRIBUTE_TO_GOAL: '0.05', // + contribution amount
  RECORD_EXPENSE: '0.2',
  SETTLE_DEBT: '0.05', // + settlement amount
  UPDATE_PROFILE: '0.05',
};

// Validation constants
export const VALIDATION = {
  MIN_GROUP_NAME_LENGTH: 3,
  MAX_GROUP_NAME_LENGTH: 50,
  MIN_GOAL_AMOUNT: 0.1, // TON
  MAX_GOAL_AMOUNT: 10000, // TON
  MIN_EXPENSE_AMOUNT: 0.01, // TON
  MAX_MEMBERS_PER_GROUP: 100,
};

// Explorer URLs
export const EXPLORER_URLS = {
  testnet: 'https://testnet.tonscan.org',
  mainnet: 'https://tonscan.org',
};

/**
 * Get explorer URL for an address
 * @param {string} address - Contract or wallet address
 * @returns {string} Explorer URL
 */
export function getExplorerUrl(address) {
  const baseUrl = EXPLORER_URLS[NETWORK] || EXPLORER_URLS.testnet;
  return `${baseUrl}/address/${address}`;
}

/**
 * Get explorer URL for a transaction
 * @param {string} hash - Transaction hash
 * @returns {string} Explorer URL
 */
export function getTransactionUrl(hash) {
  const baseUrl = EXPLORER_URLS[NETWORK] || EXPLORER_URLS.testnet;
  return `${baseUrl}/tx/${hash}`;
}

/**
 * Validate contract addresses are configured
 * @returns {boolean} True if addresses are configured
 */
export function areContractsConfigured() {
  return FACTORY_ADDRESS && !FACTORY_ADDRESS.includes('REPLACE_WITH');
}
