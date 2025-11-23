import React, { useState, useEffect } from 'react';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { beginCell, toNano } from '@ton/core';
import { Target, TrendingUp, AlertCircle, CheckCircle2, Calendar, Users } from 'lucide-react';
import { GAS_AMOUNTS } from '../config/contracts';
import { useGroup } from '../contexts/GroupContext';
import { groupVault } from '../services/contracts';

export function Goals() {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const { currentGroup } = useGroup();
  const [showCreateGoal, setShowCreateGoal] = useState(false);


  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [goalData, setGoalData] = useState({
    title: '',
    targetAmount: '',
    deadline: '',
    description: '',
    isPublic: false
  });

  // Load goals from contract
  useEffect(() => {
    async function loadGoals() {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        if (currentGroup && currentGroup.address) {
          // Load goals from GroupVault contract using dictionary parsing
          const goalsData = await groupVault.getGoals(currentGroup.address);

          // Transform goal data for UI
          const formattedGoals = goalsData.map(g => ({
            id: g.goalId,
            title: g.description || `Goal #${g.goalId}`,
            description: g.description,
            targetAmount: g.targetAmountTON || (Number(g.targetAmount) / 1e9).toFixed(2),
            currentAmount: g.currentAmountTON || (Number(g.currentAmount) / 1e9).toFixed(2),
            contributors: g.contributorCount || 0,
            deadline: g.deadline ? new Date(g.deadline * 1000) : new Date(),
            status: g.isCompleted ? 'completed' : 'active',
            createdBy: g.createdBy || address
          }));

          setGoals(formattedGoals);
        }
      } catch (error) {
        console.error('Error loading goals:', error);
      } finally {
        setLoading(false);
      }
    }

    loadGoals();
  }, [address, currentGroup]);

  const handleCreateGoal = async (e) => {
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

      const deadlineTimestamp = Math.floor(new Date(goalData.deadline).getTime() / 1000);

      await groupVault.createGoal({
        groupAddress: currentGroup.address,
        title: goalData.title,
        description: goalData.description,
        targetAmount: goalData.targetAmount,
        deadline: deadlineTimestamp,
        recipientAddress: address, // Default to creator for now, or add field
        sendTransaction: tonConnectUI.sendTransaction.bind(tonConnectUI)
      });

      setShowCreateGoal(false);
      setGoalData({
        title: '',
        targetAmount: '',
        deadline: '',
        description: '',
        isPublic: false
      });

      // Reload goals
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error creating goal:', error);
      alert(`Failed to create goal: ${error.message || error}`);
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();

    if (!address || !tonConnectUI) {
      alert('Please connect your wallet');
      return;
    }

    if (!selectedGoal || !contributionAmount || parseFloat(contributionAmount) <= 0) {
      alert('Please enter a valid contribution amount');
      return;
    }

    try {
      if (!currentGroup || !currentGroup.address) {
        alert('Please select a group first');
        return;
      }

      const groupAddress = currentGroup.address;

      const body = beginCell()
        .storeUint(0x2005, 32) // GROUP_CONTRIBUTE_TO_GOAL opcode
        .storeUint(0, 64) // query_id
        .storeUint(selectedGoal.id, 64)
        .storeCoins(toNano(contributionAmount))
        .endCell();

      const totalAmount = parseFloat(contributionAmount) + parseFloat(GAS_AMOUNTS.CONTRIBUTE_TO_GOAL);

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

      await tonConnectUI.sendTransaction(transaction);

      setShowContributeModal(false);
      setContributionAmount('');
      setSelectedGoal(null);

      // Reload goals
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error contributing to goal:', error);
      alert('Failed to contribute. Please try again.');
    }
  };

  const openContributeModal = (goal) => {
    setSelectedGoal(goal);
    setShowContributeModal(true);
  };

  const calculateProgress = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Target className="w-8 h-8 text-blue-800 dark:text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Goals
          </h2>
        </div>
        <button
          onClick={() => setShowCreateGoal(true)}
          disabled={!address}
          className="px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Goal
        </button>
      </div>

      {/* Create Goal Modal */}
      {showCreateGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Create New Goal
            </h3>
            <form onSubmit={handleCreateGoal}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Goal Title
                </label>
                <input
                  type="text"
                  value={goalData.title}
                  onChange={(e) => setGoalData({ ...goalData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-blue-600"
                  placeholder="e.g., Summer Vacation Fund"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Amount (TON)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={goalData.targetAmount}
                  onChange={(e) => setGoalData({ ...goalData, targetAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-blue-600"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  value={goalData.deadline}
                  onChange={(e) => setGoalData({ ...goalData, deadline: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-blue-600"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={goalData.description}
                  onChange={(e) => setGoalData({ ...goalData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-blue-600"
                  rows="3"
                  placeholder="Add details about your goal..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateGoal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors"
                  disabled={!address}
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {showContributeModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Contribute to Goal
            </h3>
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-5 h-5 text-blue-800 dark:text-blue-600" />
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {selectedGoal.title}
                </h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {selectedGoal.currentAmount} / {selectedGoal.targetAmount} TON
              </p>
              <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-800 dark:bg-blue-600"
                  style={{ width: `${calculateProgress(selectedGoal.currentAmount, selectedGoal.targetAmount)}%` }}
                />
              </div>
            </div>
            <form onSubmit={handleContribute}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contribution Amount (TON)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-blue-600"
                  placeholder="0.00"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  + {GAS_AMOUNTS.CONTRIBUTE_TO_GOAL} TON gas fee
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowContributeModal(false);
                    setContributionAmount('');
                    setSelectedGoal(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors"
                  disabled={!address || !contributionAmount || parseFloat(contributionAmount) <= 0}
                >
                  Contribute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goals List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800 dark:border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading goals...</p>
        </div>
      ) : goals.length > 0 ? (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
            const isCompleted = goal.status === 'completed';
            const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-neutral-800"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-5 h-5 text-blue-800 dark:text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {goal.title}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{goal.contributors} contributors</span>
                      </span>
                      {!isCompleted && daysLeft > 0 && (
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{daysLeft} days left</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${isCompleted
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                    }`}>
                    {isCompleted ? (
                      <><CheckCircle2 className="w-3 h-3" /> <span>Completed</span></>
                    ) : (
                      <><TrendingUp className="w-3 h-3" /> <span>Active</span></>
                    )}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      {goal.currentAmount} / {goal.targetAmount} TON
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${isCompleted
                        ? 'bg-green-600 dark:bg-green-500'
                        : 'bg-blue-800 dark:bg-blue-600'
                        }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {goal.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {goal.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-3">
                  {!isCompleted && (
                    <button
                      onClick={() => openContributeModal(goal)}
                      className="px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors"
                    >
                      Contribute
                    </button>
                  )}
                  <button className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Target className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No goals yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first group saving goal
          </p>
          <button
            onClick={() => setShowCreateGoal(true)}
            disabled={!address}
            className="px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Goal
          </button>
        </div>
      )}
    </div>
  );
}
