import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { useTelegram } from '../hooks/useTelegram';
import { Link } from 'react-router-dom';
import { Users, TrendingDown, TrendingUp, Target, Calculator, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { groupVaultFactory } from '../services/contracts';

export function Home() {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const { user } = useTelegram();
  const [stats, setStats] = useState({
    activeGroups: 0,
    youOwe: '0',
    owedToYou: '0',
    activeGoals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        // Get total groups from factory
        const totalGroups = await groupVaultFactory.getTotalGroups();

        // TODO: Calculate debts and goals across all groups
        // For now, using placeholders until we implement group iteration
        setStats({
          activeGroups: totalGroups,
          youOwe: '0',
          owedToYou: '0',
          activeGoals: 0
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [address]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-neutral-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to TON Circle
        </h2>

        {user && (
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Hello, {user.first_name}!
          </p>
        )}

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Split expenses and manage group finances on the TON Blockchain.
        </p>

        {address ? (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">Connected Wallet</p>
            <p className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
              {address}
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-4">
            <p className="text-gray-700 dark:text-gray-300">
              Connect your wallet to get started
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {address && (
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Active Groups"
            value={loading ? '...' : stats.activeGroups.toString()}
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            title="You Owe"
            value={loading ? '...' : `${stats.youOwe} TON`}
            color="text-red-600 dark:text-red-400"
            icon={<TrendingDown className="w-5 h-5" />}
          />
          <StatCard
            title="Owed to You"
            value={loading ? '...' : `${stats.owedToYou} TON`}
            color="text-green-600 dark:text-green-400"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard
            title="Active Goals"
            value={loading ? '...' : stats.activeGoals.toString()}
            icon={<Target className="w-5 h-5" />}
          />
        </div>
      )}

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <FeatureCard
          title="Groups"
          description="Create and manage expense groups"
          link="/groups"
          icon={<Users className="w-8 h-8" />}
        />
        <FeatureCard
          title="Expenses"
          description="Track and split shared expenses"
          link="/expenses"
          icon={<Calculator className="w-8 h-8" />}
        />
        <FeatureCard
          title="Goals"
          description="Save together for shared goals"
          link="/goals"
          icon={<Target className="w-8 h-8" />}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color = 'text-gray-900 dark:text-white' }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-4 border border-gray-200 dark:border-neutral-800">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-600 dark:text-gray-400">{title}</p>
        <div className="text-gray-600 dark:text-gray-400">{icon}</div>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function FeatureCard({ title, description, icon, link }) {
  return (
    <Link
      to={link}
      className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-6 hover:shadow-lg transition-all border border-gray-200 dark:border-neutral-800 hover:border-blue-500 dark:hover:border-blue-600 block"
    >
      <div className="text-blue-800 dark:text-blue-500 mb-3">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </Link>
  );
}
