import {
  LayoutDashboard,
  GitFork,      // Changed from GitBranch
  PlayCircle,   // Changed from Clock, more fitting for timeline
  BarChart3,
  Settings2,    // Changed from Settings for consistency
  Zap,
  UserCircle,   // For User/Account
  HelpCircle    // For Help/Support
} from 'lucide-react';
import React from 'react'; // Import React for FC type

type View = 'dashboard' | 'editor' | 'timeline' | 'analytics' | 'settings'; // Added 'settings'

interface ToolbarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'editor' as View, label: 'Visual Editor', icon: GitFork },
    { id: 'timeline' as View, label: '3D Timeline', icon: PlayCircle },
    { id: 'analytics' as View, label: 'Analytics', icon: BarChart3 },
  ];

  const rightNavItems = [
    { id: 'settings' as View, label: 'Settings', icon: Settings2, action: () => onViewChange('settings') },
    // Add more actions like help, user profile if needed
    // { id: 'help', label: 'Help', icon: HelpCircle, action: () => console.log("Help clicked") },
    // { id: 'profile', label: 'Profile', icon: UserCircle, action: () => console.log("Profile clicked") },
  ];


  return (
    <header className="h-16 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-primary)] flex items-center justify-between px-4 sm:px-6 shadow-md">
      {/* Left Section: Logo and Branding */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="flex items-center space-x-2">
          <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--color-primary)]" />
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-pink-500 bg-clip-text text-transparent">
            AegntiX
          </h1>
        </div>
        <span className="hidden md:inline-block text-xs bg-emerald-600/50 text-emerald-300 px-2 py-1 rounded-full border border-emerald-500/50">
          Phase 3: Visual Revolution
        </span>
      </div>

      {/* Center Section: Navigation */}
      <nav className="hidden md:flex items-center space-x-1 bg-[var(--color-bg-tertiary)] p-1 rounded-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              title={item.label}
              className={`
                flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium
                ${isActive
                  ? 'bg-[var(--color-primary)] text-white shadow-md'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-primary)]'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>
      {/* Mobile Navigation (placeholder or use a dropdown) */}
      <div className="md:hidden">
         <select
            value={currentView}
            onChange={(e) => onViewChange(e.target.value as View)}
            className="bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm p-2 rounded-md border border-[var(--color-border-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
          >
           {navItems.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
           {rightNavItems.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
         </select>
      </div>


      {/* Right Section: Status and Actions */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="hidden sm:flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-[var(--color-text-muted)]">Connected</span>
        </div>
        {rightNavItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={item.action}
              title={item.label}
              className={`p-2 rounded-md transition-colors
              ${isActive
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-primary)]'
              }`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          );
        })}
      </div>
    </header>
  );
}

Toolbar.displayName = 'Toolbar';
export default Toolbar;
