import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  VideoIcon, 
  BarChartIcon, 
  GearIcon,
  RocketIcon,
  QuestionMarkCircledIcon
} from '@radix-ui/react-icons';
import { cn } from '@/utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Video Generator', href: '/video-generator', icon: VideoIcon },
  { name: 'Analytics', href: '/analytics', icon: BarChartIcon },
  { name: 'Settings', href: '/settings', icon: GearIcon },
];

const bottomNavigation = [
  { name: 'Upgrade to Pro', href: '/upgrade', icon: RocketIcon },
  { name: 'Help & Support', href: '/help', icon: QuestionMarkCircledIcon },
];

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <nav className="flex flex-col h-full p-4">
        <div className="flex-1 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </div>

        <div className="space-y-1 pt-4 border-t border-gray-200 dark:border-gray-800">
          {bottomNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  item.name === 'Upgrade to Pro'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600'
                    : isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
}