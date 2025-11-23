import React, { useState, useEffect } from 'react';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { useTelegram } from '../hooks/useTelegram';
import { Users, Plus, Settings, AlertCircle, Loader2, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { groupVaultFactory, groupVault } from '../services/contracts';
import { getExplorerUrl } from '../config/contracts';
import { useGroup } from '../contexts/GroupContext';

export function Groups() {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const { user } = useTelegram();
  const { currentGroup, groups: contextGroups, selectGroup, refreshGroups } = useGroup();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [selectedGroupForJoin, setSelectedGroupForJoin] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadGroups();
  }, [address]);

  // Sync local groups with context groups
  useEffect(() => {
    if (contextGroups && contextGroups.length > 0) {
      // Context groups are already loaded, use them
      setGroups(contextGroups);
      setLoading(false);
    }
  }, [contextGroups]);

  async function loadGroups() {
    if (!address) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const totalGroups = await groupVaultFactory.getTotalGroups();

      const loadedGroups = [];
      for (let i = 0; i < totalGroups; i++) {
        try {
          const groupAddress = await groupVaultFactory.getGroupByIndex(BigInt(i));
          if (groupAddress) {
            const groupInfo = await groupVault.getGroupInfo(groupAddress);
            if (groupInfo) {
              loadedGroups.push({
                address: groupAddress,
                name: groupInfo.groupName,
                members: Number(groupInfo.memberCount),
                isActive: groupInfo.isActive,
                adminAddress: groupInfo.adminAddress
              });
            }
          }
        } catch (err) {
          console.error(`Error loading group ${i}:`, err);
        }
      }

      setGroups(loadedGroups);
    } catch (err) {
      console.error('Error loading groups:', err);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGroup(e) {
    e.preventDefault();
    if (!address || !groupName.trim()) return;

    try {
      setCreating(true);
      setError(null);

      // Generate unique hash for the group
      const groupHash = BigInt(Date.now() + Math.random() * 1000000).toString();

      const result = await groupVaultFactory.registerGroup({
        groupName: groupName.trim(),
        groupHash,
        adminAddress: address,
        sendTransaction: tonConnectUI.sendTransaction
      });

      if (result.success) {
        setSuccessMessage('Group created successfully! You are now the admin.');
        setTimeout(() => setSuccessMessage(''), 5000);
        setShowCreateGroup(false);
        setGroupName('');

        // Reload groups and refresh context
        setTimeout(async () => {
          await loadGroups();
          await refreshGroups();
        }, 3000);
      } else {
        setError(result.error || 'Failed to create group');
      }
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinGroup(e) {
    e.preventDefault();
    if (!address || !selectedGroupForJoin) return;

    try {
      setJoining(true);
      setError(null);

      // Add member to the group (this will deploy a Member contract)
      const result = await groupVault.addMember({
        groupAddress: selectedGroupForJoin.address,
        memberAddress: address,
        sendTransaction: tonConnectUI.sendTransaction
      });

      if (result.success) {
        setSuccessMessage('Successfully joined the group! Your member contract is being deployed.');
        setTimeout(() => setSuccessMessage(''), 5000);
        setShowJoinGroup(false);
        setSelectedGroupForJoin(null);

        // Reload groups
        setTimeout(async () => {
          await loadGroups();
          await refreshGroups();
        }, 3000);
      } else {
        setError(result.error || 'Failed to join group');
      }
    } catch (err) {
      console.error('Error joining group:', err);
      setError(err.message || 'Failed to join group');
    } finally {
      setJoining(false);
    }
  }

  function handleSelectGroup(group) {
    selectGroup(group);
    setSuccessMessage(`Selected: ${group.name}`);
    setTimeout(() => setSuccessMessage(''), 3000);
  }

  function handleOpenJoinModal(group) {
    setSelectedGroupForJoin(group);
    setShowJoinGroup(true);
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Groups
        </h2>
        <button
          onClick={() => setShowCreateGroup(true)}
          disabled={!address}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-green-800 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Wallet Connection Warning */}
      {!address && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <p className="text-yellow-800 dark:text-yellow-400">
            Please connect your wallet to manage groups
          </p>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinGroup && selectedGroupForJoin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-md w-full border border-gray-200 dark:border-neutral-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Join Group
            </h3>
            <form onSubmit={handleJoinGroup}>
              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  You are about to join:
                </p>
                <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3 border border-gray-200 dark:border-neutral-700">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedGroupForJoin.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedGroupForJoin.members} members
                  </p>
                </div>
              </div>
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                <p>This will:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Deploy your Member contract (~0.05 TON + gas)</li>
                  <li>Register you as a member of this group</li>
                  <li>Allow you to participate in group activities</li>
                </ul>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinGroup(false);
                    setSelectedGroupForJoin(null);
                  }}
                  disabled={joining}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!address || joining}
                  className="flex-1 px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {joining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Joining...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Join Group</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-md w-full border border-gray-200 dark:border-neutral-800">
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
                  disabled={creating}
                />
              </div>
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                <p>Cost: 2.2 TON (2 TON registration fee + gas)</p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  disabled={creating}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!address || creating || !groupName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading groups...</p>
        </div>
      ) : (
        <>
          {/* Groups List */}
          {groups.length > 0 ? (
            <div className="grid gap-4">
              {groups.map((group) => (
                <div
                  key={group.address}
                  className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-neutral-800 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {group.name}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{group.members} members</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
                        {group.address.slice(0, 8)}...{group.address.slice(-6)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      group.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400'
                    }`}>
                      {group.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-neutral-800">
                    <a
                      href={getExplorerUrl(group.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-800 dark:text-blue-600 hover:underline font-medium"
                    >
                      View on Explorer
                    </a>
                    <div className="flex items-center space-x-2">
                      {group.adminAddress === address ? (
                        <span className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 mr-2">
                          <Settings className="w-4 h-4" />
                          <span>Admin</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenJoinModal(group)}
                          disabled={joining}
                          className="px-3 py-1.5 text-sm bg-green-600 dark:bg-green-500 text-white rounded-lg font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center space-x-1"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Join</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleSelectGroup(group)}
                        disabled={currentGroup?.address === group.address}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                          currentGroup?.address === group.address
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 cursor-not-allowed'
                            : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {currentGroup?.address === group.address ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No groups yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first group to start splitting expenses
              </p>
              <button
                onClick={() => setShowCreateGroup(true)}
                disabled={!address}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                <span>Create Group</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
