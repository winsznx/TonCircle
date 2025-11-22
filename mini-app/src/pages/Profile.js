import { useState } from 'react';
import { useTonAddress } from '@tonconnect/ui-react';
import { useTelegram } from '../hooks/useTelegram';

export function Profile() {
  const address = useTonAddress();
  const { user } = useTelegram();
  const [activeTab, setActiveTab] = useState('badges'); // badges, stats, leaderboard

  // Mock user stats
  const userStats = {
    contributionCount: 15,
    totalContributed: 45.5,
    currentStreak: 7,
    expensesSettled: 12,
    goalsCompleted: 3,
    reputationScore: 850
  };

  // Mock badge data
  const userBadge = {
    tier: 'silver', // bronze, silver, gold, platinum
    badgeId: 42,
    issuedAt: '2025-01-01',
    nextTierRequirement: {
      contributions: 30,
      totalValue: 150
    }
  };

  // Mock leaderboard data
  const leaderboard = [
    { rank: 1, name: 'Alice', contributions: 45, totalValue: 250, tier: 'platinum' },
    { rank: 2, name: 'Bob', contributions: 30, totalValue: 180, tier: 'gold' },
    { rank: 3, name: 'You', contributions: 15, totalValue: 45.5, tier: 'silver' },
    { rank: 4, name: 'Charlie', contributions: 12, totalValue: 35, tier: 'silver' },
    { rank: 5, name: 'David', contributions: 8, totalValue: 22, tier: 'bronze' },
  ];

  // Mock achievements
  const achievements = [
    { id: 1, title: 'Early Adopter', description: 'Joined in the first month', unlocked: true, icon: '🎯' },
    { id: 2, title: 'Generous Contributor', description: 'Contributed to 10+ goals', unlocked: true, icon: '💝' },
    { id: 3, title: 'Streak Master', description: 'Maintain a 7-day streak', unlocked: true, icon: '🔥' },
    { id: 4, title: 'Goal Crusher', description: 'Complete 5 group goals', unlocked: false, progress: 60, icon: '🎖️' },
    { id: 5, title: 'Escrow Expert', description: 'Approve 20 escrows', unlocked: false, progress: 35, icon: '🔐' },
  ];

  const getTierColor = (tier) => {
    switch (tier) {
      case 'platinum':
        return 'from-gray-300 to-gray-500';
      case 'gold':
        return 'from-yellow-400 to-yellow-600';
      case 'silver':
        return 'from-gray-400 to-gray-600';
      case 'bronze':
        return 'from-orange-400 to-orange-600';
      default:
        return 'from-gray-300 to-gray-400';
    }
  };

  const getTierTextColor = (tier) => {
    switch (tier) {
      case 'platinum':
        return 'text-gray-700 dark:text-gray-300';
      case 'gold':
        return 'text-yellow-700 dark:text-yellow-400';
      case 'silver':
        return 'text-gray-700 dark:text-gray-300';
      case 'bronze':
        return 'text-orange-700 dark:text-orange-400';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Profile & Badges
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Your contribution reputation and achievements
        </p>
      </div>

      {!address ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 dark:text-yellow-400">
            Please connect your wallet to view your profile
          </p>
        </div>
      ) : (
        <>
          {/* User Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-neutral-800">
            <div className="flex items-start space-x-4">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getTierColor(userBadge.tier)} flex items-center justify-center text-4xl`}>
                {userBadge.tier === 'platinum' && '💎'}
                {userBadge.tier === 'gold' && '🏆'}
                {userBadge.tier === 'silver' && '🥈'}
                {userBadge.tier === 'bronze' && '🥉'}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {user?.first_name || 'User'}
                </h3>
                <p className={`text-sm font-semibold ${getTierTextColor(userBadge.tier)} mb-2`}>
                  {userBadge.tier.charAt(0).toUpperCase() + userBadge.tier.slice(1)} Badge Holder
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {address ? `${address.substring(0, 8)}...${address.substring(address.length - 6)}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Reputation</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-600">
                  {userStats.reputationScore}
                </p>
              </div>
            </div>

            {/* Progress to Next Tier */}
            {userBadge.tier !== 'platinum' && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-neutral-800">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Progress to {userBadge.tier === 'bronze' ? 'Silver' : userBadge.tier === 'silver' ? 'Gold' : 'Platinum'}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {userStats.contributionCount} / {userBadge.nextTierRequirement.contributions} contributions
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-800 dark:bg-blue-600"
                    style={{ width: `${(userStats.contributionCount / userBadge.nextTierRequirement.contributions) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-neutral-800">
            <button
              onClick={() => setActiveTab('badges')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'badges'
                  ? 'border-blue-800 dark:border-blue-600 text-blue-800 dark:text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Achievements
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'stats'
                  ? 'border-blue-800 dark:border-blue-600 text-blue-800 dark:text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Statistics
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'leaderboard'
                  ? 'border-blue-800 dark:border-blue-600 text-blue-800 dark:text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Leaderboard
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'badges' && (
            <div className="grid md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`bg-white dark:bg-neutral-900 rounded-lg shadow-md p-4 border ${
                    achievement.unlocked
                      ? 'border-blue-200 dark:border-blue-800'
                      : 'border-gray-200 dark:border-neutral-800 opacity-60'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {achievement.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {achievement.description}
                      </p>
                      {achievement.unlocked ? (
                        <span className="inline-block px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs rounded-full">
                          Unlocked ✓
                        </span>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Progress</span>
                            <span className="font-medium text-gray-900 dark:text-white">{achievement.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-blue-800 dark:bg-blue-600"
                              style={{ width: `${achievement.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="grid md:grid-cols-3 gap-4">
              <StatCard title="Total Contributions" value={userStats.contributionCount} icon="📊" />
              <StatCard title="Total Value" value={`${userStats.totalContributed} TON`} icon="💰" />
              <StatCard title="Current Streak" value={`${userStats.currentStreak} days`} icon="🔥" />
              <StatCard title="Expenses Settled" value={userStats.expensesSettled} icon="✅" />
              <StatCard title="Goals Completed" value={userStats.goalsCompleted} icon="🎯" />
              <StatCard title="Reputation Score" value={userStats.reputationScore} icon="⭐" />
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md border border-gray-200 dark:border-neutral-800">
              <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
                <h3 className="font-semibold text-gray-900 dark:text-white">Top Contributors</h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-neutral-800">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`p-4 flex items-center space-x-4 ${
                      entry.name === 'You' ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                      entry.rank === 2 ? 'bg-gray-400 text-gray-900' :
                      entry.rank === 3 ? 'bg-orange-400 text-orange-900' :
                      'bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-white'
                    }`}>
                      {entry.rank}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {entry.name}
                        {entry.name === 'You' && (
                          <span className="ml-2 text-xs text-blue-800 dark:text-blue-600">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {entry.contributions} contributions • {entry.totalValue} TON
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getTierTextColor(entry.tier)}`}>
                      {entry.tier.charAt(0).toUpperCase() + entry.tier.slice(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
