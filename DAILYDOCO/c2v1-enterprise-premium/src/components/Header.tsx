import { MoonIcon, SunIcon, BellIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useThemeContext } from './ThemeProvider';
import { useWebSocket } from '@shared/hooks/useWebSocket';
import { cn } from '@/utils/cn';

export default function Header() {
  const { isDark, toggleTheme } = useThemeContext();
  const { metrics } = useWebSocket();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="search"
            placeholder="Search documentation, teams, or analytics..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Live Metrics Bar */}
        {metrics && (
          <div className="hidden lg:flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-slate-600 dark:text-slate-400">
                Active Users: <span className="font-semibold text-slate-900 dark:text-slate-100">{metrics.activeUsers.toLocaleString()}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-slate-600 dark:text-slate-400">
                Processing: <span className="font-semibold text-slate-900 dark:text-slate-100">{metrics.processingQueue}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <SunIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          ) : (
            <MoonIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          )}
        </button>

        <button
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          aria-label="Notifications"
        >
          <BellIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="ml-3 flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Sarah Chen
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              VP of Engineering
            </p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-purple rounded-full flex items-center justify-center text-white font-medium">
            SC
          </div>
        </div>
      </div>
    </header>
  );
}