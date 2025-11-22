import { useState } from 'react';
import { useTonAddress } from '@tonconnect/ui-react';

export function Escrow() {
  const address = useTonAddress();
  const [showCreateEscrow, setShowCreateEscrow] = useState(false);
  const [escrowData, setEscrowData] = useState({
    amount: '',
    recipient: '',
    requiredSignatures: 2,
    deadline: '',
    description: ''
  });

  const [escrows, setEscrows] = useState([
    // Mock data - will be replaced with contract data
    {
      id: 1,
      description: 'Venue Deposit Payment',
      amount: 100,
      recipient: 'EQD...xyz',
      requiredSignatures: 3,
      currentSignatures: 2,
      signers: ['Alice', 'Bob'],
      deadline: '2025-02-28',
      status: 'pending',
      createdAt: '2025-01-15'
    },
    {
      id: 2,
      description: 'Equipment Purchase',
      amount: 50,
      recipient: 'EQD...abc',
      requiredSignatures: 2,
      currentSignatures: 2,
      signers: ['Alice', 'Charlie'],
      deadline: '2025-01-30',
      status: 'released',
      createdAt: '2025-01-10'
    },
  ]);

  const handleCreateEscrow = (e) => {
    e.preventDefault();
    // TODO: Implement contract interaction
    console.log('Creating escrow:', escrowData);
    setShowCreateEscrow(false);
    setEscrowData({
      amount: '',
      recipient: '',
      requiredSignatures: 2,
      deadline: '',
      description: ''
    });
  };

  const calculateProgress = (current, required) => {
    return (current / required) * 100;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'released':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'refunded':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Escrow
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Multi-signature escrow for secure group payments
          </p>
        </div>
        <button
          onClick={() => setShowCreateEscrow(true)}
          className="px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors"
        >
          Create Escrow
        </button>
      </div>

      {!address ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escrows List */}
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {escrow.description}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {escrow.amount} TON • To: {escrow.recipient.substring(0, 8)}...
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Created: {new Date(escrow.createdAt).toLocaleDateString()}
                    {escrow.status === 'pending' && daysLeft > 0 && ` • ${daysLeft} days left`}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(escrow.status)}`}>
                  {escrow.status.charAt(0).toUpperCase() + escrow.status.slice(1)}
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
                {escrow.signers.length > 0 && (
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Signed by:</span>
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
                {escrow.status === 'pending' && (
                  <>
                    <button className="px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors">
                      Approve
                    </button>
                    {escrow.currentSignatures >= escrow.requiredSignatures && (
                      <button className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-colors">
                        Release Funds
                      </button>
                    )}
                    <button className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
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

      {escrows.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No escrows yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first escrow for secure multi-sig payments
          </p>
          <button
            onClick={() => setShowCreateEscrow(true)}
            className="px-4 py-2 bg-blue-800 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors"
          >
            Create Escrow
          </button>
        </div>
      )}
    </div>
  );
}
