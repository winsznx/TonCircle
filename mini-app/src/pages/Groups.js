import React, { useState } from 'react';
import { useTonAddress } from '@tonconnect/ui-react';
import { useTelegram } from '../hooks/useTelegram';

export function Groups() {
  const address = useTonAddress();
  const { user } = useTelegram();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groups, setGroups] = useState([
    // Mock data - will be replaced with contract data
    { id: 1, name: 'Weekend Trip 2025', members: 5, balance: '0.5 TON', isActive: true },
    { id: 2, name: 'Office Lunch Split', members: 8, balance: '-1.2 TON', isActive: true },
  ]);

  const handleCreateGroup = (e) => {
    e.preventDefault();
    // TODO: Implement contract interaction
    console.log('Creating group:', groupName);
    setShowCreateGroup(false);
    setGroupName('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Groups
        </h2>
        <button
          onClick={() => setShowCreateGroup(true)}
          className="px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors"
        >
          Create Group
        </button>
      </div>

      {!address ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 dark:text-yellow-400">
            Please connect your wallet to manage groups
          </p>
        </div>
      ) : null}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Create New Group
            </h3>
            <form onSubmit={handleCreateGroup}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-blue-600"
                  placeholder="e.g., Weekend Trip"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors"
                  disabled={!address}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="grid gap-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-neutral-800 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {group.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {group.members} members
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                group.balance.startsWith('-')
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
              }`}>
                {group.balance}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <button className="text-blue-800 dark:text-blue-600 hover:underline font-medium">
                View Details
              </button>
              <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Members
              </button>
              <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Settings
              </button>
            </div>
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No groups yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first group to start splitting expenses
          </p>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors"
          >
            Create Group
          </button>
        </div>
      )}
    </div>
  );
}
