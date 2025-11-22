import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { useTelegram } from '../hooks/useTelegram';
import { Link } from 'react-router-dom';

export function Home() {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const { user } = useTelegram();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-neutral-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to TON Split
        </h2>

        {user && (
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Hello, {user.first_name}! 👋
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
            value="2"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatCard
            title="You Owe"
            value="1.5 TON"
            color="text-red-600 dark:text-red-400"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            }
          />
          <StatCard
            title="Owed to You"
            value="0.8 TON"
            color="text-green-600 dark:text-green-400"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            }
          />
          <StatCard
            title="Active Goals"
            value="1"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <FeatureCard
          title="Groups"
          description="Create and manage expense groups"
          link="/groups"
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <FeatureCard
          title="Expenses"
          description="Track and split shared expenses"
          link="/expenses"
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />
        <FeatureCard
          title="Goals"
          description="Save together for shared goals"
          link="/goals"
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
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
