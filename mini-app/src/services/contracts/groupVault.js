import { Address, beginCell, toNano } from '@ton/core';
import { getTonClient } from '../tonConnect';
import { GAS_AMOUNTS } from '../../config/contracts';

/**
 * GroupVault Service
 * Handles all interactions with individual group vault contracts
 */
class GroupVaultService {
  /**
   * Add a member to the group
   * @param {Object} params
   * @param {string} params.groupAddress - Group vault address
   * @param {string} params.memberAddress - Member wallet address
   * @param {Function} params.sendTransaction - TON Connect send function
   */
  async addMember({ groupAddress, memberAddress, sendTransaction }) {
    try {
      const body = beginCell()
        .storeUint(0x2001, 32) // AddMember opcode
        .storeUint(0, 64) // query_id
        .storeAddress(Address.parse(memberAddress))
        .endCell();

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 5,
        messages: [
          {
            address: groupAddress,
            amount: toNano(GAS_AMOUNTS.ADD_MEMBER).toString(),
            payload: body.toBoc().toString('base64'),
          },
        ],
      };

      const result = await sendTransaction(transaction);
      return { success: true, result };
    } catch (error) {
      console.error('Error adding member:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove a member from the group
   * @param {Object} params
   */
  async removeMember({ groupAddress, memberAddress, sendTransaction }) {
    try {
      const body = beginCell()
        .storeUint(0x2002, 32) // RemoveMember opcode
        .storeUint(0, 64)
        .storeAddress(Address.parse(memberAddress))
        .endCell();

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 5,
        messages: [
          {
            address: groupAddress,
            amount: toNano(GAS_AMOUNTS.REMOVE_MEMBER).toString(),
            payload: body.toBoc().toString('base64'),
          },
        ],
      };

      const result = await sendTransaction(transaction);
      return { success: true, result };
    } catch (error) {
      console.error('Error removing member:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new goal
   * @param {Object} params
   * @param {string} params.groupAddress - Group vault address
   * @param {string} params.title - Goal title
   * @param {string} params.targetAmount - Target amount in TON
   * @param {number} params.deadline - Unix timestamp deadline
   * @param {string} params.recipientAddress - Recipient address
   * @param {Function} params.sendTransaction - TON Connect send function
   */
  async createGoal({ groupAddress, title, targetAmount, deadline, recipientAddress, sendTransaction }) {
    try {
      const body = beginCell()
        .storeUint(0x2004, 32) // CreateGoal opcode
        .storeUint(0, 64)
        .storeStringTail(title)
        .storeCoins(toNano(targetAmount))
        .storeUint(deadline, 64)
        .storeAddress(Address.parse(recipientAddress))
        .endCell();

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 5,
        messages: [
          {
            address: groupAddress,
            amount: toNano(GAS_AMOUNTS.CREATE_GOAL).toString(),
            payload: body.toBoc().toString('base64'),
          },
        ],
      };

      const result = await sendTransaction(transaction);
      return { success: true, result };
    } catch (error) {
      console.error('Error creating goal:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Contribute to a goal
   * @param {Object} params
   * @param {string} params.groupAddress - Group vault address
   * @param {number} params.goalId - Goal ID
   * @param {string} params.amount - Contribution amount in TON
   * @param {Function} params.sendTransaction - TON Connect send function
   */
  async contributeToGoal({ groupAddress, goalId, amount, sendTransaction }) {
    try {
      const contributionAmount = toNano(amount);
      const body = beginCell()
        .storeUint(0x2005, 32) // ContributeToGoal opcode
        .storeUint(0, 64)
        .storeUint(goalId, 32)
        .storeCoins(contributionAmount)
        .endCell();

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 5,
        messages: [
          {
            address: groupAddress,
            amount: (contributionAmount + toNano(GAS_AMOUNTS.CONTRIBUTE_TO_GOAL)).toString(), // contribution + gas
            payload: body.toBoc().toString('base64'),
          },
        ],
      };

      const result = await sendTransaction(transaction);
      return { success: true, result };
    } catch (error) {
      console.error('Error contributing to goal:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Record an expense
   * @param {Object} params
   * @param {string} params.groupAddress - Group vault address
   * @param {string} params.description - Expense description
   * @param {string} params.totalAmount - Total amount in TON
   * @param {string} params.paidBy - Payer address
   * @param {string[]} params.splitBetween - Array of member addresses
   * @param {string[]} params.splitAmounts - Array of split amounts in TON
   * @param {Function} params.sendTransaction - TON Connect send function
   */
  async recordExpense({ groupAddress, description, totalAmount, paidBy, splitBetween, splitAmounts, sendTransaction }) {
    try {
      // Encode split addresses
      const splitAddressesCell = beginCell();
      splitAddressesCell.storeUint(splitBetween.length, 32);
      for (const addr of splitBetween) {
        splitAddressesCell.storeAddress(Address.parse(addr));
      }

      // Encode split amounts
      const splitAmountsCell = beginCell();
      splitAmountsCell.storeUint(splitAmounts.length, 32);
      for (const amount of splitAmounts) {
        splitAmountsCell.storeCoins(toNano(amount));
      }

      const body = beginCell()
        .storeUint(0x2007, 32) // RecordExpense opcode
        .storeUint(0, 64)
        .storeStringTail(description)
        .storeCoins(toNano(totalAmount))
        .storeAddress(Address.parse(paidBy))
        .storeRef(splitAddressesCell.endCell())
        .storeRef(splitAmountsCell.endCell())
        .endCell();

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 5,
        messages: [
          {
            address: groupAddress,
            amount: toNano(GAS_AMOUNTS.RECORD_EXPENSE).toString(),
            payload: body.toBoc().toString('base64'),
          },
        ],
      };

      const result = await sendTransaction(transaction);
      return { success: true, result };
    } catch (error) {
      console.error('Error recording expense:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Settle a debt
   * @param {Object} params
   * @param {string} params.groupAddress - Group vault address
   * @param {number} params.debtId - Debt ID
   * @param {string} params.amount - Settlement amount in TON
   * @param {Function} params.sendTransaction - TON Connect send function
   */
  async settleDebt({ groupAddress, debtId, amount, sendTransaction }) {
    try {
      const settlementAmount = toNano(amount);
      const body = beginCell()
        .storeUint(0x2008, 32) // GroupSettleDebt opcode
        .storeUint(0, 64)
        .storeUint(debtId, 32)
        .storeCoins(settlementAmount)
        .endCell();

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 5,
        messages: [
          {
            address: groupAddress,
            amount: (settlementAmount + toNano(GAS_AMOUNTS.SETTLE_DEBT)).toString(),
            payload: body.toBoc().toString('base64'),
          },
        ],
      };

      const result = await sendTransaction(transaction);
      return { success: true, result };
    } catch (error) {
      console.error('Error settling debt:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get group information
   * @param {string} groupAddress - Group vault address
   * @returns {Promise<Object>} Group info
   */
  async getGroupInfo(groupAddress) {
    try {
      const client = await getTonClient();
      const vaultAddress = Address.parse(groupAddress);

      const result = await client.runMethod(vaultAddress, 'getGroupInfo', []);

      return {
        groupHash: result.stack.readBigNumber().toString(),
        groupName: result.stack.readString(),
        adminAddress: result.stack.readAddress().toString(),
        memberCount: Number(result.stack.readBigNumber()),
        isActive: result.stack.readBoolean(),
      };
    } catch (error) {
      console.error('Error getting group info:', error);
      return null;
    }
  }

  /**
   * Get all goals for a group
   * @param {string} groupAddress - Group vault address
   * @returns {Promise<Array>} Array of goals
   */
  async getGoals(groupAddress) {
    try {
      const client = await getTonClient();
      const vaultAddress = Address.parse(groupAddress);

      const result = await client.runMethod(vaultAddress, 'getGoals', []);
      const goalsDict = result.stack.readCellOpt();

      // Parse goals dictionary - implementation depends on contract structure
      // This is a placeholder - adjust based on actual contract response
      const goals = [];
      // TODO: Parse dictionary into goals array

      return goals;
    } catch (error) {
      console.error('Error getting goals:', error);
      return [];
    }
  }

  /**
   * Get all expenses for a group
   * @param {string} groupAddress - Group vault address
   * @returns {Promise<Array>} Array of expenses
   */
  async getExpenses(groupAddress) {
    try {
      const client = await getTonClient();
      const vaultAddress = Address.parse(groupAddress);

      const result = await client.runMethod(vaultAddress, 'getExpenses', []);
      // Parse expenses - adjust based on contract response
      const expenses = [];

      return expenses;
    } catch (error) {
      console.error('Error getting expenses:', error);
      return [];
    }
  }

  /**
   * Get all debts for a group
   * @param {string} groupAddress - Group vault address
   * @returns {Promise<Array>} Array of debts
   */
  async getDebts(groupAddress) {
    try {
      const client = await getTonClient();
      const vaultAddress = Address.parse(groupAddress);

      const result = await client.runMethod(vaultAddress, 'getDebts', []);
      // Parse debts - adjust based on contract response
      const debts = [];

      return debts;
    } catch (error) {
      console.error('Error getting debts:', error);
      return [];
    }
  }

  /**
   * Get member balance in group
   * @param {string} groupAddress - Group vault address
   * @param {string} memberAddress - Member wallet address
   * @returns {Promise<string>} Balance in TON
   */
  async getMemberBalance(groupAddress, memberAddress) {
    try {
      const client = await getTonClient();
      const vaultAddress = Address.parse(groupAddress);

      const result = await client.runMethod(vaultAddress, 'getMemberBalance', [
        { type: 'slice', cell: beginCell().storeAddress(Address.parse(memberAddress)).endCell() },
      ]);

      const balance = result.stack.readBigNumber();
      return (Number(balance) / 1e9).toFixed(2); // Convert from nanotons to TON
    } catch (error) {
      console.error('Error getting member balance:', error);
      return '0';
    }
  }
}

export default new GroupVaultService();
