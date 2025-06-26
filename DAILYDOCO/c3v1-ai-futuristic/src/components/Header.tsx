import { MagnifyingGlassIcon, BellIcon, CubeIcon } from '@radix-ui/react-icons';
import { useWebSocket } from '@shared/hooks/useWebSocket';
import { motion } from 'framer-motion';

export default function Header() {
  const { metrics } = useWebSocket();

  return (
    <header className="h-20 glass border-b border-white/10 px-6 flex items-center justify-between">
      <div className="flex items-center gap-6 flex-1">
        {/* AI Assistant Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neural-blue to-neural-purple flex items-center justify-center">
              <CubeIcon className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-neural-green rounded-full animate-pulse"></div>
          </div>
          <div>
            <p className="text-sm font-medium text-white">AI Assistant</p>
            <p className="text-xs text-gray-400">Neural Network Active</p>
          </div>
        </motion.div>

        {/* Neural Search */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            placeholder="Neural search across all documentation..."
            className="w-full pl-10 pr-4 py-3 glass rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neural-blue/50 transition-all"
          />
        </div>

        {/* Live Neural Activity */}
        {metrics && (
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="w-2 h-2 bg-neural-cyan rounded-full"
              />
              <span className="text-sm text-gray-400">
                Neural Processing: <span className="text-neural-cyan font-mono">{metrics.processingQueue}</span>
              </span>
            </div>
            <div className="h-6 w-px bg-white/10"></div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1 bg-dark-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-neural-blue to-neural-purple"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              </div>
              <span className="text-sm text-gray-400 font-mono">
                {metrics.docsCreatedToday} ops/hr
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 glass rounded-lg hover:bg-white/10 transition-colors">
          <BellIcon className="w-5 h-5 text-gray-300" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-neural-pink rounded-full animate-pulse"></span>
        </button>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-white">
              Dr. Alex Chen
            </p>
            <p className="text-xs text-gray-400">
              AI Research Lead
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neural-blue via-neural-purple to-neural-pink p-[2px]">
            <div className="w-full h-full bg-dark-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-medium">AC</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}