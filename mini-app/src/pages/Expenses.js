import React, { useState, useEffect } from 'react';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { beginCell, toNano, Address } from '@ton/core';
import { Calculator, Receipt, TrendingDown, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GAS_AMOUNTS } from '../config/contracts';
import { useGroup } from '../contexts/GroupContext';
import { groupVault } from '../services/contracts';

export function Expenses() {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const { currentGroup } = useGroup();
  const [showCreateExpense, setShowCreateExpense] = useState(false);



  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);
  const [balances, setBalances] = useState({ youOwe: '0', owedToYou: '0', netBalance: '0' });
  const [expenseData, setExpenseData] = useState({
    description: '',
    amount: '',
    paidBy: address || '', // initialize with wallet address if available
    splitType: 'equal',
    participants: []
  });

  // Keep paidBy in sync with wallet address changes
  useEffect(() => {
    if (address) {
      setExpenseData(prev => ({ ...prev, paidBy: address }));
    }
  }, [address]);

  // Load expenses from contract
  useEffect(() => {
    async function loadExpenses() {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        if (currentGroup && currentGroup.address) {
          // Load expenses from GroupVault contract
          const expenseData = await groupVault.getExpenses(currentGroup.address);

          // Transform expense data for UI
          const formattedExpenses = expenseData.map(exp => ({
            id: exp.expenseId,
            expenseId: exp.expenseId,
            description: exp.description,
            amount: exp.totalAmountTON || (Number(exp.totalAmount) / 1e9).toFixed(2),
            totalAmount: exp.totalAmountTON || (Number(exp.totalAmount) / 1e9).toFixed(2),
            paidBy: exp.paidBy === address ? 'You' : `${exp.paidBy.slice(0, 6)}...${exp.paidBy.slice(-4)}`,
            paidByAddress: exp.paidBy,
            splitBetween: exp.participants?.length || 0,
            participants: exp.participants || [],
            shares: exp.shares || [],
            yourShare: exp.shares && exp.participants ?
              (exp.participants.includes(address) ?
                exp.shares[exp.participants.indexOf(address)] : '0') : '0',
            date: exp.createdAt * 1000, // Convert to milliseconds
            status: exp.isSettled ? 'settled' : 'pending',
            isSettled: exp.isSettled
          }));

          setExpenses(formattedExpenses);

          // Load debts and calculate balances
          const debtsData = await groupVault.getDebts(currentGroup.address);
          if (debtsData && debtsData.length > 0) {
            // Filter debts where current user is the debtor
            const myDebts = debtsData.filter(d => d.debtor === address && !d.isSettled);
            setDebts(myDebts);
            setBalances(calculateBalances(debtsData));
          }
        }
      } catch (error) {
        console.error('Error loading expenses:', error);
      } finally {
        setLoading(false);
      }
    }

    loadExpenses();
  }, [address, currentGroup]);

  // Calculate balances from debts
  const calculateBalances = (debts) => {
    let youOwe = 0;
    let owedToYou = 0;

    debts.forEach(debt => {
      const amount = debt.amountTON ? parseFloat(debt.amountTON) : (Number(debt.amount) / 1e9);

      if (debt.debtor === address && !debt.isSettled) {
        youOwe += amount;
      }
      if (debt.creditor === address && !debt.isSettled) {
        owedToYou += amount;
      }
    });

    const netBalance = owedToYou - youOwe;

    return {
      youOwe: youOwe.toFixed(2),
      owedToYou: owedToYou.toFixed(2),
      netBalance: netBalance.toFixed(2),
    };
  };

  // Handle debt settlement
  const handleSettleDebt = async (debtId, amount, creditor) => {
    if (!address || !tonConnectUI) {
      alert('Please connect your wallet');
      return;
    }

    try {
      if (!currentGroup || !currentGroup.address) {
        alert('Please select a group first');
        return;
      }

      const body = beginCell()
        .storeUint(0x2008, 32) // GroupSettleDebt opcode
        .storeUint(0, 64) // query_id
        .storeUint(debtId, 64)
        .storeCoins(toNano(amount))
        .storeAddress(Address.parse(creditor))
        .storeUint(Date.now(), 64) // settlementId
        .endCell();

      const totalAmount = parseFloat(amount) + 0.05; // Amount + gas

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 5,
        messages: [
          {
            address: currentGroup.address,
            amount: toNano(totalAmount).toString(),
            payload: body.toBoc().toString('base64'),
          },
        ],
      };

      await tonConnectUI.sendTransaction(transaction);

      // Reload expenses and debts
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error settling debt:', error);
      alert('Failed to settle debt. Please try again.');
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();

    if (!address || !tonConnectUI) {
      alert('Please connect your wallet');
      return;
    }

    try {
      if (!currentGroup || !currentGroup.address) {
        alert('Please select a group first');
        return;
      }

      const groupAddress = currentGroup.address;

      // Prepare participants
      // For demo, if no participants selected, use self
      const participants = expenseData.participants.length > 0 ? expenseData.participants : [address];

      // Validate paidBy address
      if (!expenseData.paidBy) {
        alert('Payer address is missing');
        return;
      }
      try {
        Address.parse(expenseData.paidBy);
      } catch (e) {
        alert('Invalid payer address: ' + expenseData.paidBy);
        return;
      }

      await groupVault.createExpense({
        groupAddress: currentGroup.address,
        description: expenseData.description,
        amount: expenseData.amount,
        paidBy: expenseData.paidBy,
        participants: participants,
        sendTransaction: tonConnectUI.sendTransaction.bind(tonConnectUI)
      });

      setShowCreateExpense(false);
      setExpenseData({
        description: '',
        amount: '',
        paidBy: address,
        splitType: 'equal',
        participants: [],
        currency: 'TON'
      });

      // Reload expenses
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error creating expense:', error);
      alert(`Failed to create expense: ${error.message || error}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calculator className="w-8 h-8 text-blue-800 dark:text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Expenses
          </h2>
        </div>
        <button
          onClick={() => setShowCreateExpense(true)}
          disabled={!address}
          className="px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Expense
        </button>
      </div>

      {!address ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-800 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-800 dark:text-yellow-400">
            Please connect your wallet to manage expenses
          </p>
        </div>
      ) : null}

      {/* Outstanding Balance Summary */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-4 border border-gray-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">You Owe</p>
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{balances.youOwe} TON</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-4 border border-gray-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">Owed to You</p>
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{balances.owedToYou} TON</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-4 border border-gray-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">Net Balance</p>
            <Receipt className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{balances.netBalance} TON</p>
        </div>
      </div>

      {/* Pending Debts Section */}
      {debts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Pending Debts</h3>
          <div className="space-y-3">
            {debts.map((debt) => (
              <div
                key={debt.debtId}
                className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-4 border border-gray-200 dark:border-neutral-800 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {debt.reason || 'Expense settlement'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    To: {debt.creditor.slice(0, 8)}...{debt.creditor.slice(-6)}
                  </p>
                </div>
                <div className="text-right flex items-center space-x-3">
                  <div>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      {debt.amountTON || (Number(debt.amount) / 1e9).toFixed(2)} TON
                    </p>
                  </div>
                  <button
                    onClick={() => handleSettleDebt(debt.debtId, debt.amountTON || (Number(debt.amount) / 1e9).toFixed(2), debt.creditor)}
                    className="px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Expense Modal */}
      {showCreateExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Add New Expense
            </h3>
            <form onSubmit={handleCreateExpense}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={expenseData.description}
                  onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-blue-600"
                  placeholder="e.g., Dinner at Restaurant"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (TON)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={expenseData.amount}
                  onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-blue-600"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency
                </label>
                <select
                  value={expenseData.currency}
                  onChange={(e) => setExpenseData({ ...expenseData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-blue-600"
                >
                  <option value="TON">TON</option>
                  <option value="USDT">USDT (Tether)</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Split Type
                </label>
                <select
                  value={expenseData.splitType}
                  onChange={(e) => setExpenseData({ ...expenseData, splitType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-blue-600"
                >
                  <option value="equal">Split Equally</option>
                  <option value="custom">Custom Amounts</option>
                  <option value="percentage">By Percentage</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateExpense(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors"
                  disabled={!address}
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expenses List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800 dark:border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading expenses...</p>
        </div>
      ) : expenses.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Expenses</h3>
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-neutral-800"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {expense.description}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Paid by {expense.paidBy} • Split between {expense.splitBetween} people
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(expense.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {expense.amount} TON
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your share: {expense.yourShare} TON
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-neutral-800">
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${expense.status === 'settled'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                  }`}>
                  {expense.status === 'settled' ? (
                    <><CheckCircle2 className="w-3 h-3" /> <span>Settled</span></>
                  ) : (
                    <><AlertCircle className="w-3 h-3" /> <span>Pending</span></>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Receipt className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No expenses yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Add your first expense to start tracking
          </p>
          <button
            onClick={() => setShowCreateExpense(true)}
            disabled={!address}
            className="px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Expense
          </button>
        </div>
      )}
    </div>
  );
}
