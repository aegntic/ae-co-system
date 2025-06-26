import { NavLink } from 'react-router-dom';
import { 
  DashboardIcon,
  BarChartIcon,
  PersonIcon,
  ComponentInstanceIcon,
  LockClosedIcon,
  RocketIcon,
  GearIcon,
  QuestionMarkCircledIcon,
  VideoIcon
} from '@radix-ui/react-icons';
import { cn } from '@/utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
  { name: 'Video Generator', href: '/video-generator', icon: VideoIcon },
  { name: 'Analytics', href: '/analytics', icon: BarChartIcon },
  { name: 'Team', href: '/team', icon: PersonIcon },
  { name: 'Workflows', href: '/workflows', icon: ComponentInstanceIcon },
  { name: 'Compliance', href: '/compliance', icon: LockClosedIcon },
];

const bottomNavigation = [
  { name: 'Enterprise Features', href: '/enterprise', icon: RocketIcon },
  { name: 'Settings', href: '/settings', icon: GearIcon },
  { name: 'Support', href: '/support', icon: QuestionMarkCircledIcon },
];

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-slate-100">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">D</span>
          </div>
          <div>
            <h2 className="font-semibold text-lg text-white">DailyDoco Pro</h2>
            <p className="text-xs text-slate-400">Enterprise Edition</p>
          </div>
        </div>
      </div>

      <nav className="px-3">
        <div className="space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 space-y-1">
          {bottomNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Organization Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
            <span className="text-slate-400 font-medium">TC</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              TechCorp Industries
            </p>
            <p className="text-xs text-slate-500">
              Enterprise Plan • 500 seats
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}