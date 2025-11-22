import { Address, beginCell, toNano, TonClient } from '@ton/core';
import { OPCODES, TON, CONTRACT_ADDRESSES } from '../../../common/constants.js';

/**
 * Service for interacting with TON Split smart contracts
 * Follows Blueprint patterns from the tutorial
 */
export class ContractService {
  constructor(tonConnectUI, network = 'testnet') {
    this.tonConnectUI = tonConnectUI;
    this.network = network;
    this.contracts = CONTRACT_ADDRESSES[network.toUpperCase()];
  }

  /**
   * Generic method to send a transaction to any contract
   * @param {string} contractAddress - Contract address
   * @param {string} amount - Amount in TON
   * @param {Cell} body - Message body
   */
  async sendTransaction(contractAddress, amount, body) {
    if (!this.tonConnectUI.connected) {
      throw new Error('Wallet not connected');
    }

    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes
      messages: [
        {
          address: contractAddress,
          amount: toNano(amount).toString(),
          payload: body.toBoc().toString('base64')
        }
      ]
    };

    return await this.tonConnectUI.sendTransaction(transaction);
  }

  // ==================== GroupVault Methods ====================

  /**
   * Register a new group
   * @param {number} groupId - Telegram group ID
   */
  async registerGroup(groupId) {
    const body = beginCell()
      .storeUint(OPCODES.GROUP_REGISTER, 32)
      .storeUint(0, 64) // query_id
      .storeUint(groupId, 64)
      .endCell();

    return await this.sendTransaction(
      this.contracts.GROUP_VAULT,
      TON.GAS_MEMBER,
      body
    );
  }

  /**
   * Add member to group
   * @param {string} memberAddress - Member's TON address
   */
  async addMember(memberAddress) {
    const body = beginCell()
      .storeUint(OPCODES.GROUP_ADD_MEMBER, 32)
      .storeUint(0, 64) // query_id
      .storeAddress(Address.parse(memberAddress))
      .endCell();

    return await this.sendTransaction(
      this.contracts.GROUP_VAULT,
      TON.GAS_MEMBER,
      body
    );
  }

  /**
   * Remove member from group
   * @param {string} memberAddress - Member's TON address
   */
  async removeMember(memberAddress) {
    const body = beginCell()
      .storeUint(OPCODES.GROUP_REMOVE_MEMBER, 32)
      .storeUint(0, 64) // query_id
      .storeAddress(Address.parse(memberAddress))
      .endCell();

    return await this.sendTransaction(
      this.contracts.GROUP_VAULT,
      TON.GAS_MEMBER,
      body
    );
  }

  // ==================== ExpenseSplitter Methods ====================

  /**
   * Create a new expense
   * @param {Object} expenseData - Expense details
   * @param {string} expenseData.amount - Total amount in TON
   * @param {string} expenseData.description - Expense description
   * @param {Array<string>} expenseData.participants - Array of participant addresses
   */
  async createExpense(expenseData) {
    const { amount, description, participants } = expenseData;

    const builder = beginCell()
      .storeUint(OPCODES.EXPENSE_CREATE, 32)
      .storeUint(0, 64) // query_id
      .storeCoins(toNano(amount))
      .storeStringTail(description)
      .storeUint(participants.length, 8);

    participants.forEach(addr => {
      builder.storeAddress(Address.parse(addr));
    });

    return await this.sendTransaction(
      this.contracts.EXPENSE_SPLITTER,
      TON.GAS_EXPENSE,
      builder.endCell()
    );
  }

  /**
   * Pay an expense
   * @param {number} expenseId - Expense ID
   * @param {string} amount - Amount to pay in TON
   */
  async payExpense(expenseId, amount) {
    const body = beginCell()
      .storeUint(OPCODES.EXPENSE_PAY, 32)
      .storeUint(0, 64) // query_id
      .storeUint(expenseId, 32)
      .endCell();

    return await this.sendTransaction(
      this.contracts.EXPENSE_SPLITTER,
      amount, // Amount includes payment + gas
      body
    );
  }

  /**
   * Settle an expense debt
   * @param {number} expenseId - Expense ID
   * @param {string} amount - Amount to settle in TON
   */
  async settleExpense(expenseId, amount) {
    const body = beginCell()
      .storeUint(OPCODES.EXPENSE_SETTLE, 32)
      .storeUint(0, 64) // query_id
      .storeUint(expenseId, 32)
      .storeCoins(toNano(amount))
      .endCell();

    return await this.sendTransaction(
      this.contracts.EXPENSE_SPLITTER,
      TON.GAS_EXPENSE,
      body
    );
  }

  /**
   * Get balance for an address
   * @param {string} address - TON address
   */
  async getBalance(address) {
    // This would require a TonClient instance to call get methods
    // For now, return a placeholder
    // TODO: Implement with TonClient
    throw new Error('Get methods require TonClient - implement in provider context');
  }

  // ==================== GoalContract Methods ====================

  /**
   * Create a new goal
   * @param {Object} goalData - Goal details
   * @param {string} goalData.title - Goal title
   * @param {string} goalData.targetAmount - Target amount in TON
   * @param {string} goalData.recipientAddress - Recipient's TON address
   * @param {number} goalData.deadline - Deadline timestamp
   * @param {boolean} goalData.isPublic - Public visibility
   */
  async createGoal(goalData) {
    const { title, targetAmount, recipientAddress, deadline, isPublic } = goalData;

    const body = beginCell()
      .storeUint(OPCODES.GOAL_CREATE, 32)
      .storeUint(0, 64) // query_id
      .storeStringTail(title)
      .storeCoins(toNano(targetAmount))
      .storeAddress(Address.parse(recipientAddress))
      .storeUint(deadline, 64)
      .storeBit(isPublic)
      .endCell();

    return await this.sendTransaction(
      this.contracts.GOAL_CONTRACT,
      TON.GAS_GOAL,
      body
    );
  }

  /**
   * Contribute to a goal
   * @param {number} goalId - Goal ID
   * @param {string} amount - Contribution amount in TON
   */
  async contributeToGoal(goalId, amount) {
    const body = beginCell()
      .storeUint(OPCODES.GOAL_CONTRIBUTE, 32)
      .storeUint(0, 64) // query_id
      .storeUint(goalId, 32)
      .storeCoins(toNano(amount))
      .endCell();

    return await this.sendTransaction(
      this.contracts.GOAL_CONTRACT,
      amount, // Amount includes contribution + gas
      body
    );
  }

  /**
   * Withdraw funds from a completed goal
   * @param {number} goalId - Goal ID
   */
  async withdrawGoal(goalId) {
    const body = beginCell()
      .storeUint(OPCODES.GOAL_WITHDRAW, 32)
      .storeUint(0, 64) // query_id
      .storeUint(goalId, 32)
      .endCell();

    return await this.sendTransaction(
      this.contracts.GOAL_CONTRACT,
      TON.GAS_GOAL,
      body
    );
  }

  /**
   * Refund a failed goal
   * @param {number} goalId - Goal ID
   */
  async refundGoal(goalId) {
    const body = beginCell()
      .storeUint(OPCODES.GOAL_REFUND, 32)
      .storeUint(0, 64) // query_id
      .storeUint(goalId, 32)
      .endCell();

    return await this.sendTransaction(
      this.contracts.GOAL_CONTRACT,
      TON.GAS_GOAL,
      body
    );
  }

  // ==================== Utility Methods ====================

  /**
   * Format address for display
   * @param {string} address - Full address
   */
  static formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Convert nanoTON to TON
   * @param {bigint|string} nanoTON - Amount in nanoTON
   */
  static fromNano(nanoTON) {
    return (BigInt(nanoTON) / BigInt(1e9)).toString();
  }

  /**
   * Convert TON to nanoTON
   * @param {string|number} ton - Amount in TON
   */
  static toNano(ton) {
    return toNano(ton).toString();
  }

  /**
   * Validate TON address
   * @param {string} address - Address to validate
   */
  static isValidAddress(address) {
    try {
      Address.parse(address);
      return true;
    } catch {
      return false;
    }
  }
}
