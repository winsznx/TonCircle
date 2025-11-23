import { useState, useEffect } from 'react';
import { useTonAddress } from '@tonconnect/ui-react';
import { useTelegram } from '../hooks/useTelegram';
import { User, Award, TrendingUp, BarChart3, Trophy, AlertCircle } from 'lucide-react';
import { useGroup } from '../contexts/GroupContext';
import { groupVault } from '../services/contracts';
import member from '../services/contracts/member';

export function Profile() {
  const address = useTonAddress();
  const { user } = useTelegram();
  const { currentGroup } = useGroup();
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState(null);

  // Load member profile from contract
  useEffect(() => {
    async function loadMemberData() {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        if (currentGroup && currentGroup.address) {
          // Get member contract address for current user
          const memberContractAddress = await groupVault.getMemberContract(
            currentGroup.address,
            address
          );

          if (memberContractAddress) {
            // Load member data from Member contract
            const profile = await member.getMemberProfile(memberContractAddress);
            const stats = await member.getMemberStats(memberContractAddress);

            setMemberData({
              profile,
              stats: {
                contributionCount: stats.contributionCount,
                totalContributed: stats.totalContributed,
                expensesSettled: 0, // Not tracked separately yet
                goalsCompleted: 0, // Not tracked separately yet
                reputationScore: stats.reputationScore,
                groupCount: stats.groupsJoined
              }
            });
          }
        }
      } catch (error) {
        console.error('Error loading member data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMemberData();
  }, [address, currentGroup]);

  // Default values when no data
  const userStats = memberData?.stats || {
    contributionCount: 0,
    totalContributed: 0,
    expensesSettled: 0,
    goalsCompleted: 0,
    reputationScore: 0
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <User className="w-8 h-8 text-blue-800 dark:text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Profile
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your contribution history and statistics
        </p>
      </div>

      {!address ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-800 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-800 dark:text-yellow-400">
            Please connect your wallet to view your profile
          </p>
        </div>
      ) : loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800 dark:border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading profile...</p>
        </div>
      ) : (
        <>
          {/* User Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-neutral-800">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {user?.first_name || 'User'} {user?.last_name || ''}
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-600 font-semibold mb-2">
                  TON Circle Member
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {address ? `${address.substring(0, 8)}...${address.substring(address.length - 6)}` : ''}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-1">
                  <Trophy className="w-5 h-5 text-blue-800 dark:text-blue-600" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Reputation</p>
                </div>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-600">
                  {userStats.reputationScore}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-neutral-800">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === 'stats'
                  ? 'border-blue-800 dark:border-blue-600 text-blue-800 dark:text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistics</span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === 'activity'
                  ? 'border-blue-800 dark:border-blue-600 text-blue-800 dark:text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Activity</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'stats' && (
            <div className="grid md:grid-cols-3 gap-4">
              <StatCard
                title="Total Contributions"
                value={userStats.contributionCount}
                icon={<Award className="w-5 h-5 text-blue-800 dark:text-blue-600" />}
              />
              <StatCard
                title="Total Value"
                value={`${userStats.totalContributed} TON`}
                icon={<TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />}
              />
              <StatCard
                title="Expenses Settled"
                value={userStats.expensesSettled}
                icon={<BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
              />
              <StatCard
                title="Goals Completed"
                value={userStats.goalsCompleted}
                icon={<Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />}
              />
              <StatCard
                title="Reputation Score"
                value={userStats.reputationScore}
                icon={<Trophy className="w-5 h-5 text-blue-800 dark:text-blue-600" />}
              />
              <StatCard
                title="Active Groups"
                value={memberData?.profile?.groupCount || 0}
                icon={<User className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
              />
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md border border-gray-200 dark:border-neutral-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Recent Activity</span>
              </h3>
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  Your activity history will appear here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Start contributing to goals and settling expenses to build your history
                </p>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-800 dark:text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-1">
                  Build Your Reputation
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-600">
                  Contribute to group goals, settle expenses on time, and participate actively to increase your reputation score. Higher reputation gives you more influence in group decisions.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-4 border border-gray-200 dark:border-neutral-800">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-600 dark:text-gray-400">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
