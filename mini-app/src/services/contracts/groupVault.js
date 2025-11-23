import { Address, beginCell, toNano, Dictionary } from '@ton/core';
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

      // Get all goals using the getAllGoals getter
      const result = await client.runMethod(vaultAddress, 'getAllGoals', []);

      const goals = [];

      try {
        const dictCell = result.stack.readCellOpt();
        if (!dictCell) {
          return goals;
        }

        // Parse the dictionary - map<Int, GoalInfo>
        const dict = Dictionary.loadDirect(
          Dictionary.Keys.Int(32), // Key: Int (32-bit)
          Dictionary.Values.Cell(), // Value: Cell (GoalInfo struct)
          dictCell
        );

        // Iterate through all entries
        for (const [key, value] of dict) {
          try {
            const goalId = Number(key);
            const slice = value.beginParse();

            // Parse GoalInfo struct
            // Based on GroupTypes.tact GoalInfo structure
            const goal = {
              goalId,
              title: slice.loadStringTail(),
              description: slice.loadStringTail(),
              targetAmount: slice.loadCoins(),
              currentAmount: slice.loadCoins(),
              deadline: Number(slice.loadUintBig(64)),
              recipientAddress: slice.loadAddress().toString(),
              isCompleted: slice.loadBoolean(),
              contributorCount: Number(slice.loadUintBig(32)),
              createdAt: Number(slice.loadUintBig(64)),
            };

            // Convert amounts from nanotons to TON
            goal.targetAmountTON = (Number(goal.targetAmount) / 1e9).toFixed(2);
            goal.currentAmountTON = (Number(goal.currentAmount) / 1e9).toFixed(2);

            goals.push(goal);
          } catch (entryError) {
            console.error(`Error parsing goal entry ${key}:`, entryError);
          }
        }
      } catch (parseError) {
        console.error('Dictionary parsing error for goals:', parseError);
        // Fallback to ID range query if dictionary parsing fails
        return await this.getGoalsByIdRange(groupAddress, 100);
      }

      return goals;
    } catch (error) {
      console.error('Error getting goals:', error);
      return [];
    }
  }

  /**
   * Get a specific goal by ID
   * @param {string} groupAddress - Group vault address
   * @param {number} goalId - Goal ID
   * @returns {Promise<Object|null>} Goal info or null
   */
  async getGoal(groupAddress, goalId) {
    try {
      const client = await getTonClient();
      const vaultAddress = Address.parse(groupAddress);

      const result = await client.runMethod(vaultAddress, 'getGoal', [
        { type: 'int', value: BigInt(goalId) }
      ]);

      // Read optional GoalInfo struct
      const goalExists = result.stack.readBoolean();
      if (!goalExists) return null;

      const goal = {
        goalId: Number(result.stack.readBigNumber()),
        title: result.stack.readString(),
        description: result.stack.readString(),
        targetAmount: result.stack.readBigNumber().toString(),
        currentAmount: result.stack.readBigNumber().toString(),
        deadline: Number(result.stack.readBigNumber()),
        recipientAddress: result.stack.readAddress().toString(),
        isCompleted: result.stack.readBoolean(),
        contributorCount: Number(result.stack.readBigNumber()),
        createdAt: Number(result.stack.readBigNumber()),
      };

      // Convert amounts from nanotons to TON
      goal.targetAmountTON = (Number(goal.targetAmount) / 1e9).toFixed(2);
      goal.currentAmountTON = (Number(goal.currentAmount) / 1e9).toFixed(2);

      return goal;
    } catch (error) {
      console.error(`Error getting goal ${goalId}:`, error);
      return null;
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

      const result = await client.runMethod(vaultAddress, 'getAllExpenses', []);

      const expenses = [];

      try {
        const dictCell = result.stack.readCellOpt();
        if (!dictCell) {
          return expenses;
        }

        // Parse the dictionary - map<Int, ExpenseInfo>
        const dict = Dictionary.loadDirect(
          Dictionary.Keys.Int(32), // Key: Int (32-bit)
          Dictionary.Values.Cell(), // Value: Cell (we'll parse the struct from the cell)
          dictCell
        );

        // Iterate through all entries
        for (const [key, value] of dict) {
          try {
            const expenseId = Number(key);
            const slice = value.beginParse();

            // Parse ExpenseInfo struct
            // Based on GroupTypes.tact ExpenseInfo structure
            const expense = {
              expenseId,
              description: slice.loadStringTail(),
              totalAmount: slice.loadCoins(),
              paidBy: slice.loadAddress().toString(),
              splitBetween: slice.loadRef(), // Cell containing addresses
              splitAmounts: slice.loadRef(), // Cell containing amounts
              createdAt: Number(slice.loadUintBig(64)),
              isSettled: slice.loadBoolean(),
            };

            // Convert amount from nanotons to TON
            expense.totalAmountTON = (Number(expense.totalAmount) / 1e9).toFixed(2);

            // Parse splitBetween and splitAmounts cells
            try {
              const splitBetweenSlice = expense.splitBetween.beginParse();
              const splitAmountsSlice = expense.splitAmounts.beginParse();

              const count = splitBetweenSlice.loadUint(32);
              expense.participants = [];
              expense.shares = [];

              for (let i = 0; i < count; i++) {
                expense.participants.push(splitBetweenSlice.loadAddress().toString());
              }

              const amountCount = splitAmountsSlice.loadUint(32);
              for (let i = 0; i < amountCount; i++) {
                const amount = splitAmountsSlice.loadCoins();
                expense.shares.push((Number(amount) / 1e9).toFixed(2));
              }
            } catch (parseError) {
              console.error('Error parsing expense split data:', parseError);
              expense.participants = [];
              expense.shares = [];
            }

            expenses.push(expense);
          } catch (entryError) {
            console.error(`Error parsing expense entry ${key}:`, entryError);
          }
        }
      } catch (parseError) {
        console.error('Dictionary parsing error for expenses:', parseError);
        // Fallback to ID range query if dictionary parsing fails
        return await this.getExpensesByIdRange(groupAddress, 100);
      }

      return expenses;
    } catch (error) {
      console.error('Error getting expenses:', error);
      return [];
    }
  }

  /**
   * Get a specific expense by ID
   * @param {string} groupAddress - Group vault address
   * @param {number} expenseId - Expense ID
   * @returns {Promise<Object|null>} Expense info or null
   */
  async getExpense(groupAddress, expenseId) {
    try {
      const client = await getTonClient();
      const vaultAddress = Address.parse(groupAddress);

      const result = await client.runMethod(vaultAddress, 'getExpense', [
        { type: 'int', value: BigInt(expenseId) }
      ]);

      const expenseExists = result.stack.readBoolean();
      if (!expenseExists) return null;

      const expense = {
        expenseId: Number(result.stack.readBigNumber()),
        description: result.stack.readString(),
        totalAmount: result.stack.readBigNumber().toString(),
        paidBy: result.stack.readAddress().toString(),
        splitBetween: result.stack.readCell(), // Cell containing addresses
        splitAmounts: result.stack.readCell(), // Cell containing amounts
        createdAt: Number(result.stack.readBigNumber()),
        isSettled: result.stack.readBoolean(),
      };

      // Convert amount from nanotons to TON
      expense.totalAmountTON = (Number(expense.totalAmount) / 1e9).toFixed(2);

      // Parse splitBetween and splitAmounts cells
      try {
        const splitBetweenSlice = expense.splitBetween.beginParse();
        const splitAmountsSlice = expense.splitAmounts.beginParse();

        const count = splitBetweenSlice.loadUint(32);
        expense.participants = [];
        expense.shares = [];

        for (let i = 0; i < count; i++) {
          expense.participants.push(splitBetweenSlice.loadAddress().toString());
        }

        const amountCount = splitAmountsSlice.loadUint(32);
        for (let i = 0; i < amountCount; i++) {
          const amount = splitAmountsSlice.loadCoins();
          expense.shares.push((Number(amount) / 1e9).toFixed(2));
        }
      } catch (parseError) {
        console.error('Error parsing expense split data:', parseError);
        expense.participants = [];
        expense.shares = [];
      }

      return expense;
    } catch (error) {
      console.error(`Error getting expense ${expenseId}:`, error);
      return null;
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

      const result = await client.runMethod(vaultAddress, 'getAllDebts', []);

      const debts = [];

      try {
        const dictCell = result.stack.readCellOpt();
        if (!dictCell) {
          return debts;
        }

        // Parse the dictionary - map<Int, DebtInfo>
        const dict = Dictionary.loadDirect(
          Dictionary.Keys.Int(32), // Key: Int (32-bit)
          Dictionary.Values.Cell(), // Value: Cell (DebtInfo struct)
          dictCell
        );

        // Iterate through all entries
        for (const [key, value] of dict) {
          try {
            const debtId = Number(key);
            const slice = value.beginParse();

            // Parse DebtInfo struct
            // Based on GroupTypes.tact DebtInfo structure
            const debt = {
              debtId,
              debtor: slice.loadAddress().toString(),
              creditor: slice.loadAddress().toString(),
              amount: slice.loadCoins(),
              createdAt: Number(slice.loadUintBig(64)),
              dueDate: null, // Optional field
              isSettled: slice.loadBoolean(),
              reason: slice.loadStringTail(),
            };

            // Try to read optional dueDate
            try {
              if (!slice.endParse) {
                // If there's more data, try to read dueDate
                const maybeDueDate = slice.loadMaybeUintBig(64);
                if (maybeDueDate !== null) {
                  debt.dueDate = Number(maybeDueDate);
                }
              }
            } catch (e) {
              // dueDate is optional, ignore if not present
            }

            // Convert amount from nanotons to TON
            debt.amountTON = (Number(debt.amount) / 1e9).toFixed(2);

            debts.push(debt);
          } catch (entryError) {
            console.error(`Error parsing debt entry ${key}:`, entryError);
          }
        }
      } catch (parseError) {
        console.error('Dictionary parsing error for debts:', parseError);
        // Fallback to ID range query if dictionary parsing fails
        return await this.getDebtsByIdRange(groupAddress, 100);
      }

      return debts;
    } catch (error) {
      console.error('Error getting debts:', error);
      return [];
    }
  }

  /**
   * Get a specific debt by ID
   * @param {string} groupAddress - Group vault address
   * @param {number} debtId - Debt ID
   * @returns {Promise<Object|null>} Debt info or null
   */
  async getDebt(groupAddress, debtId) {
    try {
      const client = await getTonClient();
      const vaultAddress = Address.parse(groupAddress);

      const result = await client.runMethod(vaultAddress, 'getDebt', [
        { type: 'int', value: BigInt(debtId) }
      ]);

      const debtExists = result.stack.readBoolean();
      if (!debtExists) return null;

      const debt = {
        debtId: Number(result.stack.readBigNumber()),
        debtor: result.stack.readAddress().toString(),
        creditor: result.stack.readAddress().toString(),
        amount: result.stack.readBigNumber().toString(),
        createdAt: Number(result.stack.readBigNumber()),
        dueDate: null, // Optional field
        isSettled: result.stack.readBoolean(),
        reason: result.stack.readString(),
      };

      // Try to read optional dueDate
      try {
        const hasDueDate = result.stack.readBoolean();
        if (hasDueDate) {
          debt.dueDate = Number(result.stack.readBigNumber());
        }
      } catch (e) {
        // dueDate is optional, ignore if not present
      }

      // Convert amount from nanotons to TON
      debt.amountTON = (Number(debt.amount) / 1e9).toFixed(2);

      return debt;
    } catch (error) {
      console.error(`Error getting debt ${debtId}:`, error);
      return null;
    }
  }

  /**
   * Get debts for a specific member
   * @param {string} groupAddress - Group vault address
   * @param {string} memberAddress - Member wallet address
   * @returns {Promise<Array>} Array of debts involving this member
   */
  async getDebtsForMember(groupAddress, memberAddress) {
    try {
      // This is a helper function that would need to iterate through debts
      // For now, we'll call getAllDebts and filter
      const allDebts = await this.getDebts(groupAddress);

      return allDebts.filter(debt =>
        debt.debtor === memberAddress || debt.creditor === memberAddress
      );
    } catch (error) {
      console.error('Error getting debts for member:', error);
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

  /**
   * Get goals by querying individual IDs
   * This is a workaround until dictionary parsing is implemented
   * @param {string} groupAddress - Group vault address
   * @param {number} maxId - Maximum goal ID to check (defaults to 100)
   * @returns {Promise<Array>} Array of goals
   */
  async getGoalsByIdRange(groupAddress, maxId = 100) {
    const goals = [];

    for (let i = 1; i <= maxId; i++) {
      try {
        const goal = await this.getGoal(groupAddress, i);
        if (goal) {
          goals.push(goal);
        }
      } catch (error) {
        // Goal doesn't exist, continue
        break;
      }
    }

    return goals;
  }

  /**
   * Get expenses by querying individual IDs
   * @param {string} groupAddress - Group vault address
   * @param {number} maxId - Maximum expense ID to check
   * @returns {Promise<Array>} Array of expenses
   */
  async getExpensesByIdRange(groupAddress, maxId = 100) {
    const expenses = [];

    for (let i = 1; i <= maxId; i++) {
      try {
        const expense = await this.getExpense(groupAddress, i);
        if (expense) {
          expenses.push(expense);
        }
      } catch (error) {
        break;
      }
    }

    return expenses;
  }

  /**
   * Get debts by querying individual IDs
   * @param {string} groupAddress - Group vault address
   * @param {number} maxId - Maximum debt ID to check
   * @returns {Promise<Array>} Array of debts
   */
  async getDebtsByIdRange(groupAddress, maxId = 100) {
    const debts = [];

    for (let i = 1; i <= maxId; i++) {
      try {
        const debt = await this.getDebt(groupAddress, i);
        if (debt) {
          debts.push(debt);
        }
      } catch (error) {
        break;
      }
    }

    return debts;
  }

  /**
   * Get all escrows for a group
   * @param {string} groupAddress - Group vault address
   * @returns {Promise<Array>} Array of escrows
   */
  async getEscrows(groupAddress) {
    try {
      const client = await getTonClient();
      const vaultAddress = Address.parse(groupAddress);

      const result = await client.runMethod(vaultAddress, 'getAllEscrows', []);

      const escrows = [];

      try {
        const dictCell = result.stack.readCellOpt();
        if (!dictCell) {
          return escrows;
        }

        // Parse the dictionary - map<Int, EscrowInfo>
        const dict = Dictionary.loadDirect(
          Dictionary.Keys.Int(32),
          Dictionary.Values.Cell(),
          dictCell
        );

        // Iterate through all entries
        for (const [key, value] of dict) {
          try {
            const escrowId = Number(key);
            const slice = value.beginParse();

            // Parse EscrowInfo struct
            const escrow = {
              id: escrowId,
              escrowId,
              description: slice.loadStringTail(),
              amount: slice.loadCoins(),
              recipientAddress: slice.loadAddress().toString(),
              creatorAddress: slice.loadAddress().toString(),
              requiredSignatures: Number(slice.loadUintBig(32)),
              currentSignatures: Number(slice.loadUintBig(32)),
              // approvals map is stored as a cell reference
              approvalsCell: slice.loadRef(),
              deadline: Number(slice.loadUintBig(64)),
              createdAt: Number(slice.loadUintBig(64)),
              status: Number(slice.loadUintBig(8)),
            };

            // Convert amount from nanotons to TON
            escrow.amountTON = (Number(escrow.amount) / 1e9).toFixed(2);

            // Parse approvals to get list of signers
            try {
              const approvalsDict = Dictionary.loadDirect(
                Dictionary.Keys.Address(),
                Dictionary.Values.Bool(),
                escrow.approvalsCell
              );

              escrow.signers = [];
              for (const [addr, approved] of approvalsDict) {
                if (approved) {
                  const addrStr = addr.toString();
                  escrow.signers.push(`${addrStr.slice(0, 6)}...${addrStr.slice(-4)}`);
                }
              }
            } catch (e) {
              escrow.signers = [];
            }

            // Format for UI
            escrow.recipient = escrow.recipientAddress;

            escrows.push(escrow);
          } catch (entryError) {
            console.error(`Error parsing escrow entry ${key}:`, entryError);
          }
        }
      } catch (parseError) {
        console.error('Dictionary parsing error for escrows:', parseError);
      }

      return escrows;
    } catch (error) {
      console.error('Error getting escrows:', error);
      return [];
    }
  }

  /**
   * Create a new escrow
   * @param {Object} params
   * @param {string} params.groupAddress - Group vault address
   * @param {string} params.description - Escrow description
   * @param {string} params.amount - Amount in TON
   * @param {string} params.recipientAddress - Recipient address
   * @param {number} params.requiredSignatures - Required signatures
   * @param {number} params.deadline - Deadline timestamp
   * @param {Function} params.sendTransaction - TON Connect send function
   */
  async createEscrow({ groupAddress, description, amount, recipientAddress, requiredSignatures, deadline, sendTransaction }) {
    try {
      const body = beginCell()
        .storeUint(0x200B, 32) // CreateEscrow opcode
        .storeUint(0, 64) // query_id
        .storeUint(0, 64) // escrowId (auto-generated by contract, send 0)
        .storeStringTail(description)
        .storeCoins(toNano(amount))
        .storeAddress(Address.parse(recipientAddress))
        .storeUint(requiredSignatures, 32)
        .storeUint(deadline, 64)
        .endCell();

      const totalAmount = parseFloat(amount) + 0.1; // Amount + gas

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 5,
        messages: [
          {
            address: groupAddress,
            amount: toNano(totalAmount).toString(),
            payload: body.toBoc().toString('base64'),
          },
        ],
      };

      const result = await sendTransaction(transaction);
      return { success: true, result };
    } catch (error) {
      console.error('Error creating escrow:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Approve an escrow
   * @param {Object} params
   * @param {string} params.groupAddress - Group vault address
   * @param {number} params.escrowId - Escrow ID
   * @param {Function} params.sendTransaction - TON Connect send function
   */
  async approveEscrow({ groupAddress, escrowId, sendTransaction }) {
    try {
      const body = beginCell()
        .storeUint(0x200C, 32) // ApproveEscrow opcode
        .storeUint(0, 64) // query_id
        .storeUint(escrowId, 64)
        .endCell();

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 5,
        messages: [
          {
            address: groupAddress,
            amount: toNano('0.05').toString(),
            payload: body.toBoc().toString('base64'),
          },
        ],
      };

      const result = await sendTransaction(transaction);
      return { success: true, result };
    } catch (error) {
      console.error('Error approving escrow:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Release escrow funds
   * @param {Object} params
   * @param {string} params.groupAddress - Group vault address
   * @param {number} params.escrowId - Escrow ID
   * @param {Function} params.sendTransaction - TON Connect send function
   */
  async releaseEscrow({ groupAddress, escrowId, sendTransaction }) {
    try {
      const body = beginCell()
        .storeUint(0x200D, 32) // ReleaseEscrow opcode
        .storeUint(0, 64) // query_id
        .storeUint(escrowId, 64)
        .endCell();

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 5,
        messages: [
          {
            address: groupAddress,
            amount: toNano('0.05').toString(),
            payload: body.toBoc().toString('base64'),
          },
        ],
      };

      const result = await sendTransaction(transaction);
      return { success: true, result };
    } catch (error) {
      console.error('Error releasing escrow:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Refund escrow
   * @param {Object} params
   * @param {string} params.groupAddress - Group vault address
   * @param {number} params.escrowId - Escrow ID
   * @param {Function} params.sendTransaction - TON Connect send function
   */
  async refundEscrow({ groupAddress, escrowId, sendTransaction }) {
    try {
      const body = beginCell()
        .storeUint(0x200E, 32) // RefundEscrow opcode
        .storeUint(0, 64) // query_id
        .storeUint(escrowId, 64)
        .endCell();

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 5,
        messages: [
          {
            address: groupAddress,
            amount: toNano('0.05').toString(),
            payload: body.toBoc().toString('base64'),
          },
        ],
      };

      const result = await sendTransaction(transaction);
      return { success: true, result };
    } catch (error) {
      console.error('Error refunding escrow:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get member contract address for a wallet address
   * @param {string} groupAddress - Group vault address
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<string|null>} Member contract address or null
   */
  async getMemberContract(groupAddress, walletAddress) {
    try {
      const client = await getTonClient();
      const vaultAddress = Address.parse(groupAddress);
      const memberWalletAddress = Address.parse(walletAddress);

      const result = await client.runMethod(vaultAddress, 'getMemberContract', [
        { type: 'slice', cell: beginCell().storeAddress(memberWalletAddress).endCell() }
      ]);

      // The result is an optional Address
      const addressCell = result.stack.readAddressOpt();
      return addressCell ? addressCell.toString() : null;
    } catch (error) {
      console.error('Error getting member contract:', error);
      return null;
    }
  }
}

export default new GroupVaultService();
