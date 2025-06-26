import { 
  LayoutDashboard, 
  GitBranch, 
  Clock, 
  BarChart3, 
  Settings,
  Zap
} from 'lucide-react';

type View = 'dashboard' | 'editor' | 'timeline' | 'analytics';

interface ToolbarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export default function Toolbar({ currentView, onViewChange }: ToolbarProps) {
  const navItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'editor' as View, label: 'Visual Editor', icon: GitBranch },
    { id: 'timeline' as View, label: '3D Timeline', icon: Clock },
    { id: 'analytics' as View, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Zap className="w-8 h-8 text-blue-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AegntiX
          </h1>
          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
            Phase 3 - Visual Revolution
          </span>
        </div>
      </div>

      <nav className="flex items-center space-x-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg transition-all
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-sm text-gray-400">Connected</span>
        </div>
        <button className="text-gray-400 hover:text-white">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}