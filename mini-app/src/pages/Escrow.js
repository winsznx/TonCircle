import React, { useState, useEffect } from 'react';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { beginCell, toNano } from '@ton/core';
import { Lock, Shield, Clock, CheckCircle2, XCircle, AlertCircle, Users } from 'lucide-react';
import { GAS_AMOUNTS } from '../config/contracts';
import { useGroup } from '../contexts/GroupContext';

export function Escrow() {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const { currentGroup } = useGroup();
  const [showCreateEscrow, setShowCreateEscrow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [escrows, setEscrows] = useState([]);
  const [escrowData, setEscrowData] = useState({
    amount: '',
    recipient: '',
    requiredSignatures: 2,
    deadline: '',
    description: ''
  });

  // Load escrows from contract
  useEffect(() => {
    async function loadEscrows() {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        if (currentGroup && currentGroup.address) {
          // Load escrows from GroupVault contract
          const escrowData = await groupVault.getEscrows(currentGroup.address);
          setEscrows(escrowData || []);
        }
      } catch (error) {
        console.error('Error loading escrows:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEscrows();
  }, [address, currentGroup]);

  const handleCreateEscrow = async (e) => {
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

      const deadlineTimestamp = Math.floor(new Date(escrowData.deadline).getTime() / 1000);

      const result = await groupVault.createEscrow({
        groupAddress: currentGroup.address,
        description: escrowData.description,
        amount: escrowData.amount,
        recipientAddress: escrowData.recipient,
        requiredSignatures: escrowData.requiredSignatures,
        deadline: deadlineTimestamp,
        sendTransaction: tonConnectUI.sendTransaction
      });

      if (result.success) {
        setShowCreateEscrow(false);
        setEscrowData({
          amount: '',
          recipient: '',
          requiredSignatures: 2,
          deadline: '',
          description: ''
        });

        // Reload escrows
        setTimeout(() => window.location.reload(), 2000);
      } else {
        alert(result.error || 'Failed to create escrow');
      }
    } catch (error) {
      console.error('Error creating escrow:', error);
      alert('Failed to create escrow. Please try again.');
    }
  };

  const handleApproveEscrow = async (escrowId) => {
    if (!address || !tonConnectUI) {
      alert('Please connect your wallet');
      return;
    }

    try {
      if (!currentGroup || !currentGroup.address) {
        alert('Please select a group first');
        return;
      }

      const result = await groupVault.approveEscrow({
        groupAddress: currentGroup.address,
        escrowId,
        sendTransaction: tonConnectUI.sendTransaction
      });

      if (result.success) {
        // Reload escrows
        setTimeout(() => window.location.reload(), 2000);
      } else {
        alert(result.error || 'Failed to approve escrow');
      }
    } catch (error) {
      console.error('Error approving escrow:', error);
      alert('Failed to approve escrow. Please try again.');
    }
  };

  const handleReleaseEscrow = async (escrowId) => {
    if (!address || !tonConnectUI) {
      alert('Please connect your wallet');
      return;
    }

    try {
      if (!currentGroup || !currentGroup.address) {
        alert('Please select a group first');
        return;
      }

      const result = await groupVault.releaseEscrow({
        groupAddress: currentGroup.address,
        escrowId,
        sendTransaction: tonConnectUI.sendTransaction
      });

      if (result.success) {
        // Reload escrows
        setTimeout(() => window.location.reload(), 2000);
      } else {
        alert(result.error || 'Failed to release escrow');
      }
    } catch (error) {
      console.error('Error releasing escrow:', error);
      alert('Failed to release escrow. Please try again.');
    }
  };

  const handleRefundEscrow = async (escrowId) => {
    if (!address || !tonConnectUI) {
      alert('Please connect your wallet');
      return;
    }

    try {
      if (!currentGroup || !currentGroup.address) {
        alert('Please select a group first');
        return;
      }

      const result = await groupVault.refundEscrow({
        groupAddress: currentGroup.address,
        escrowId,
        sendTransaction: tonConnectUI.sendTransaction
      });

      if (result.success) {
        // Reload escrows
        setTimeout(() => window.location.reload(), 2000);
      } else {
        alert(result.error || 'Failed to refund escrow');
      }
    } catch (error) {
      console.error('Error refunding escrow:', error);
      alert('Failed to refund escrow. Please try again.');
    }
  };

  const calculateProgress = (current, required) => {
    return (current / required) * 100;
  };

  const getStatusColor = (status) => {
    // status: 0=pending, 1=released, 2=refunded
    switch (status) {
      case 0:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 1:
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 2:
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return 'pending';
      case 1:
        return 'released';
      case 2:
        return 'refunded';
      default:
        return 'unknown';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Lock className="w-8 h-8 text-blue-800 dark:text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Escrow
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Multi-signature escrow for secure group payments
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateEscrow(true)}
          disabled={!address}
          className="px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Escrow
        </button>
      </div>

      {!address ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-800 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-800 dark:text-yellow-400">
            Please connect your wallet to manage escrows
          </p>
        </div>
      ) : null}

      {/* Create Escrow Modal */}
      {showCreateEscrow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Create New Escrow
            </h3>
            <form onSubmit={handleCreateEscrow}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={escrowData.description}
                  onChange={(e) => setEscrowData({...escrowData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-blue-600"
                  placeholder="e.g., Venue Deposit"
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
                  value={escrowData.amount}
                  onChange={(e) => setEscrowData({...escrowData, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-blue-600"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={escrowData.recipient}
                  onChange={(e) => setEscrowData({...escrowData, recipient: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-blue-600"
                  placeholder="EQD..."
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Required Signatures
                </label>
                <select
                  value={escrowData.requiredSignatures}
                  onChange={(e) => setEscrowData({...escrowData, requiredSignatures: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-blue-600"
                >
                  <option value="2">2 of N</option>
                  <option value="3">3 of N</option>
                  <option value="4">4 of N</option>
                  <option value="5">5 of N</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  value={escrowData.deadline}
                  onChange={(e) => setEscrowData({...escrowData, deadline: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-800 dark:focus:ring-blue-600"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateEscrow(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors"
                  disabled={!address}
                >
                  Create Escrow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escrows List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800 dark:border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading escrows...</p>
        </div>
      ) : escrows.length > 0 ? (
        <div className="space-y-4">
          {escrows.map((escrow) => {
          const progress = calculateProgress(escrow.currentSignatures, escrow.requiredSignatures);
          const daysLeft = Math.ceil((new Date(escrow.deadline) - new Date()) / (1000 * 60 * 60 * 24));

          return (
            <div
              key={escrow.id}
              className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-neutral-800"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-5 h-5 text-blue-800 dark:text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {escrow.description}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {escrow.amountTON} TON • To: {escrow.recipient.substring(0, 8)}...
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500 mt-1">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Created: {new Date(escrow.createdAt).toLocaleDateString()}</span>
                    </span>
                    {escrow.status === 0 && daysLeft > 0 && (
                      <span>{daysLeft} days left</span>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(escrow.status)}`}>
                  {escrow.status === 1 ? (
                    <><CheckCircle2 className="w-3 h-3" /> <span>Released</span></>
                  ) : escrow.status === 2 ? (
                    <><XCircle className="w-3 h-3" /> <span>Refunded</span></>
                  ) : (
                    <><Clock className="w-3 h-3" /> <span>Pending</span></>
                  )}
                </span>
              </div>

              {/* Signature Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Signatures: {escrow.currentSignatures} / {escrow.requiredSignatures}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-800 dark:bg-blue-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {escrow.signers && escrow.signers.length > 0 && (
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>Signed by:</span>
                    </span>
                    {escrow.signers.map((signer, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs rounded-full"
                      >
                        {signer}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3 pt-3 border-t border-gray-200 dark:border-neutral-800">
                {escrow.status === 0 && (
                  <>
                    <button
                      onClick={() => handleApproveEscrow(escrow.id)}
                      className="px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors"
                    >
                      Approve
                    </button>
                    {escrow.currentSignatures >= escrow.requiredSignatures && (
                      <button
                        onClick={() => handleReleaseEscrow(escrow.id)}
                        className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                      >
                        Release Funds
                      </button>
                    )}
                    <button
                      onClick={() => handleRefundEscrow(escrow.id)}
                      className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Refund
                    </button>
                  </>
                )}
                <button className="ml-auto text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  View Details
                </button>
              </div>
            </div>
          );
        })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Lock className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No escrows yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first escrow for secure multi-sig payments
          </p>
          <button
            onClick={() => setShowCreateEscrow(true)}
            disabled={!address}
            className="px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Escrow
          </button>
        </div>
      )}
    </div>
  );
}
