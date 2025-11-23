import { Address, beginCell, toNano, TonClient } from '@ton/core';
import { OPCODES, TON, CONTRACT_ADDRESSES } from '../../../common/constants.js';

/**
 * Service for interacting with TON Circle smart contracts
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
   * @param {string} groupName - Group name
   * @param {string} groupHash - Unique group hash
   * @param {string} adminAddress - Admin address
   */
  async registerGroup(groupName, groupHash, adminAddress) {
    const body = beginCell()
      .storeUint(OPCODES.GROUP_REGISTER, 32)
      .storeRef(beginCell().storeStringTail(groupName).endCell()) // groupName as String in ref
      .storeInt(BigInt(groupHash), 257)
      .storeAddress(Address.parse(adminAddress))
      .endCell();

    return await this.sendTransaction(
      this.contracts.GROUP_VAULT_FACTORY, // Use factory address
      '2.2', // 2.2 TON to cover registration fee + gas
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
    const { amount, description, participants, paidBy } = expenseData;

    // Build splitBetween cell (Array of Address)
    const splitBetween = beginCell().storeUint(participants.length, 32);
    participants.forEach(addr => {
      splitBetween.storeAddress(Address.parse(addr));
    });

    // Build splitAmounts cell (Array of Int)
    // Calculate equal split for now (or pass amounts if available)
    const totalNano = BigInt(toNano(amount));
    const splitAmount = totalNano / BigInt(participants.length);
    const remainder = totalNano % BigInt(participants.length);

    const splitAmounts = beginCell().storeUint(participants.length, 32);
    for (let i = 0; i < participants.length; i++) {
      // Add remainder to first person or handle as needed. 
      // For simplicity, adding to first for now, or just equal.
      // Contract expects specific amounts.
      let share = splitAmount;
      if (i === 0) share += remainder;
      splitAmounts.storeUint(share, 64); // Storing as uint64 as per contract reading
    }

    // RecordExpense (0x2007)
    // expenseId: Int
    // description: String
    // totalAmount: Int
    // paidBy: Address
    // splitBetween: Cell
    // splitAmounts: Cell
    // currency: Address?
    const body = beginCell()
      .storeUint(0x2007, 32)
      .storeInt(0, 257) // expenseId
      .storeRef(beginCell().storeStringTail(description).endCell()) // description as Ref
      .storeInt(totalNano, 257) // totalAmount
      .storeAddress(Address.parse(paidBy))
      .storeRef(splitBetween.endCell())
      .storeRef(splitAmounts.endCell())
      .storeMaybeAddress(null) // currency (null for TON)
      .endCell();

    return await this.sendTransaction(
      this.contracts.GROUP_VAULT, // Send to GroupVault
      TON.GAS_EXPENSE,
      body
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
    const { title, description, targetAmount, recipientAddress, deadline } = goalData;

    // CreateGoal (0x2004)
    // goalId: Int
    // title: String
    // description: String
    // targetAmount: Int
    // deadline: Int
    // recipientAddress: Address
    const body = beginCell()
      .storeUint(0x2004, 32)
      .storeInt(0, 257) // goalId (placeholder)
      .storeRef(beginCell().storeStringTail(title).endCell()) // title as Ref
      .storeRef(beginCell().storeStringTail(description).endCell()) // description as Ref
      .storeInt(BigInt(toNano(targetAmount)), 257) // targetAmount
      .storeInt(BigInt(deadline), 257) // deadline
      .storeAddress(Address.parse(recipientAddress))
      .endCell();

    return await this.sendTransaction(
      this.contracts.GROUP_VAULT, // Send to GroupVault, not GOAL_CONTRACT
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
