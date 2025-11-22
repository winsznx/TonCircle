import { ThemeToggle } from './ThemeToggle';
import { WalletButton } from './WalletButton';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img
            src="/tc.jpg"
            alt="TON Circle Logo"
            className="w-8 h-8 rounded-lg shadow-md"
          />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            TON Circle
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
