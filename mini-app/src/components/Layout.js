import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />

      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 p-4 md:p-6 bg-gray-50 dark:bg-neutral-900">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden mb-4 p-2 rounded-lg bg-blue-800 dark:bg-blue-600 text-white shadow-md hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {children}
        </main>
      </div>
    </div>
  );
}
