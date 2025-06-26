import { NavLink } from 'react-router-dom';
import { 
  HomeIcon,
  MagicWandIcon,
  LightningBoltIcon,
  CubeIcon,
  GearIcon,
  RocketIcon,
  QuestionMarkCircledIcon,
  VideoIcon
} from '@radix-ui/react-icons';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Quantum Docs', href: '/video-generator', icon: VideoIcon },
  { name: 'AI Studio', href: '/ai-studio', icon: MagicWandIcon },
  { name: 'Neural Insights', href: '/neural-insights', icon: LightningBoltIcon },
  { name: 'Automation', href: '/automation', icon: CubeIcon },
];

const bottomNavigation = [
  { name: 'AI Models', href: '/models', icon: RocketIcon },
  { name: 'Settings', href: '/settings', icon: GearIcon },
  { name: 'Help', href: '/help', icon: QuestionMarkCircledIcon },
];

export default function Sidebar() {
  return (
    <aside className="w-72 min-h-screen glass border-r border-white/10">
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neural-blue to-neural-purple flex items-center justify-center">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-neural-blue to-neural-purple blur-xl opacity-50"></div>
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">DailyDoco Pro</h2>
            <p className="text-xs text-neural-cyan">AI-First Edition</p>
          </div>
        </motion.div>
      </div>

      <nav className="px-3 pb-6">
        <div className="space-y-1">
          {navigation.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-neural-blue/20 to-neural-purple/20 text-white border border-neural-blue/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )
                }
              >
                <item.icon className="w-5 h-5 group-hover:animate-pulse" />
                {item.name}
              </NavLink>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 space-y-1">
          {bottomNavigation.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (navigation.length + index) * 0.1 }}
            >
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )
                }
              >
                <item.icon className="w-5 h-5 group-hover:animate-pulse" />
                {item.name}
              </NavLink>
            </motion.div>
          ))}
        </div>
      </nav>

      {/* AI Status Panel */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400">Neural Network Status</span>
            <span className="text-xs text-neural-green">Online</span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Processing Power</span>
                <span className="text-white">87%</span>
              </div>
              <div className="w-full h-1 bg-dark-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-neural-blue to-neural-purple"
                  initial={{ width: 0 }}
                  animate={{ width: '87%' }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Model Accuracy</span>
                <span className="text-white">99.2%</span>
              </div>
              <div className="w-full h-1 bg-dark-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-neural-green to-neural-cyan"
                  initial={{ width: 0 }}
                  animate={{ width: '99.2%' }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}