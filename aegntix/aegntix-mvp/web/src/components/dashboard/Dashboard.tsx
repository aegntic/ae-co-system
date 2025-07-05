import {
  Play,
  GitBranch,
  Users,
  Activity,
  Clock,
  TrendingUp,
  ArrowRight,
  Zap,
  Brain,
  Network
} from 'lucide-react';

type View = 'dashboard' | 'editor' | 'timeline' | 'analytics' | 'settings'; // Added settings

interface DashboardProps {
  onNavigate: (view: View) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const stats = [
    { label: 'Active Scenarios', value: '3', icon: Play, color: 'text-blue-400' },
    { label: 'Agents Running', value: '12', icon: Users, color: 'text-green-400' },
    { label: 'Timeline Events', value: '847', icon: Activity, color: 'text-purple-400' },
    { label: 'Avg Response', value: '85ms', icon: Clock, color: 'text-yellow-400' },
  ];

  const quickActions = [
    {
      title: 'Create New Scenario',
      description: 'Design multi-agent interactions visually',
      icon: GitBranch,
      action: () => onNavigate('editor'),
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      title: 'View 3D Timeline',
      description: 'Explore temporal relationships',
      icon: Network, // Changed from Play for better context
      action: () => onNavigate('timeline'),
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Analytics Dashboard',
      description: 'Performance insights and predictions',
      icon: TrendingUp,
      action: () => onNavigate('analytics'),
      gradient: 'from-green-500 to-teal-600'
    }
  ];

  const recentScenarios = [
    {
      name: 'Startup Pitch Analysis',
      agents: 4,
      status: 'running',
      lastUpdate: '2 min ago',
      performance: 94 // Assuming this is a percentage
    },
    {
      name: 'Product Review Meeting',
      agents: 6,
      status: 'paused',
      lastUpdate: '15 min ago',
      performance: 87
    },
    {
      name: 'Customer Support Simulation',
      agents: 3,
      status: 'completed',
      lastUpdate: '1 hour ago',
      performance: 92
    }
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gray-900 min-h-full overflow-y-auto"> {/* Ensure scrolling within this div */}
      {/* Welcome Header */}
      <div className="text-center py-6 md:py-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Welcome to AegntiX Visual Revolution
        </h1>
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
          The world's first immersive AI orchestration platform. Design, visualize, and optimize multi-agent scenarios with revolutionary ease.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-gray-800 rounded-xl p-5 sm:p-6 border border-gray-700 hover:border-gray-600 transition-all shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.action}
              className={`
                relative overflow-hidden bg-gradient-to-br ${action.gradient}
                rounded-xl p-5 sm:p-6 text-white group hover:scale-105 focus:scale-105 transition-all duration-300
                border border-white/10 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white/50
                text-left
              `}
            >
              <div className="relative z-10">
                <Icon className="w-7 h-7 sm:w-8 sm:h-8 mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">{action.title}</h3>
                <p className="text-sm text-white/90 mb-3 sm:mb-4">{action.description}</p>
                <div className="flex items-center space-x-2 text-sm text-white/80 group-hover:text-white">
                  <span>Get started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>

      {/* Recent Scenarios */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
        <div className="p-5 sm:p-6 border-b border-gray-700">
          <h2 className="text-lg sm:text-xl font-bold flex items-center space-x-2">
            <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            <span>Recent Scenarios</span>
          </h2>
        </div>
        <div className="p-3 sm:p-4 md:p-6"> {/* Reduced padding on smaller screens */}
          <div className="space-y-3 sm:space-y-4">
            {recentScenarios.map((scenario, index) => (
              <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className={`flex-shrink-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                    scenario.status === 'running' ? 'bg-green-400 animate-pulse' : // Added pulse for running
                    scenario.status === 'paused' ? 'bg-yellow-400' :
                    'bg-gray-400'
                  }`} />
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base">{scenario.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-400">{scenario.agents} agents • {scenario.lastUpdate}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-semibold">{scenario.performance}%</p>
                    <p className="text-xs text-gray-400">Perf.</p> {/* Shortened label */}
                  </div>
                  <button className="text-blue-400 hover:text-blue-300 focus:outline-none">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Phase 3 Features Preview */}
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-5 sm:p-6 border border-blue-500/30 shadow-lg">
        <div className="flex items-center space-x-3 mb-3 sm:mb-4">
          <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
          <h2 className="text-lg sm:text-xl font-bold">Phase 3 Visual Revolution</h2>
          <span className="bg-yellow-400 text-black px-2 py-0.5 sm:py-1 rounded-full text-xs font-bold">
            ACTIVE
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-sm">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Visual Scenario Editor</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div> {/* Keep as is, or animate if in progress */}
            <span>3D Timeline Visualization</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div> {/* Keep as is */}
            <span>Advanced Analytics</span>
          </div>
        </div>
      </div>
    </div>
  );
}
