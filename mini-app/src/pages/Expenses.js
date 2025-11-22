import React, { useState } from 'react';
import { useTonAddress } from '@tonconnect/ui-react';

export function Expenses() {
  const address = useTonAddress();
  const [showCreateExpense, setShowCreateExpense] = useState(false);
  const [expenseData, setExpenseData] = useState({
    description: '',
    amount: '',
    splitType: 'equal'
  });

  const [expenses, setExpenses] = useState([
    // Mock data - will be replaced with contract data
    {
      id: 1,
      description: 'Dinner at Restaurant',
      amount: '2.5 TON',
      paidBy: 'Alice',
      splitBetween: 4,
      yourShare: '0.625 TON',
      status: 'pending',
      date: '2025-01-20'
    },
    {
      id: 2,
      description: 'Uber ride',
      amount: '0.8 TON',
      paidBy: 'You',
      splitBetween: 3,
      yourShare: '0 TON',
      status: 'settled',
      date: '2025-01-19'
    },
  ]);

  const handleCreateExpense = (e) => {
    e.preventDefault();
    // TODO: Implement contract interaction
    console.log('Creating expense:', expenseData);
    setShowCreateExpense(false);
    setExpenseData({ description: '', amount: '', splitType: 'equal' });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Expenses
        </h2>
        <button
          onClick={() => setShowCreateExpense(true)}
          className="px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors"
        >
          Add Expense
        </button>
      </div>

      {!address ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 dark:text-yellow-400">
            Please connect your wallet to manage expenses
          </p>
        </div>
      ) : null}

      {/* Outstanding Balance Summary */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-4 border border-gray-200 dark:border-neutral-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">You Owe</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">1.5 TON</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-4 border border-gray-200 dark:border-neutral-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Owed to You</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">0.8 TON</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-4 border border-gray-200 dark:border-neutral-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Balance</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">-0.7 TON</p>
        </div>
      </div>

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
                  onChange={(e) => setExpenseData({...expenseData, description: e.target.value})}
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
                  value={expenseData.amount}
                  onChange={(e) => setExpenseData({...expenseData, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-blue-600"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Split Type
                </label>
                <select
                  value={expenseData.splitType}
                  onChange={(e) => setExpenseData({...expenseData, splitType: e.target.value})}
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
                  {expense.amount}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your share: {expense.yourShare}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-neutral-800">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                expense.status === 'settled'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
              }`}>
                {expense.status === 'settled' ? 'Settled' : 'Pending'}
              </span>
              {expense.status === 'pending' && expense.paidBy !== 'You' && (
                <button className="px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors">
                  Pay Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {expenses.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No expenses yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Add your first expense to start tracking
          </p>
          <button
            onClick={() => setShowCreateExpense(true)}
            className="px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors"
          >
            Add Expense
          </button>
        </div>
      )}
    </div>
  );
}
