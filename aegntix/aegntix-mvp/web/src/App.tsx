import { useState, Suspense, lazy } from 'react'; // Added lazy
import { ReactFlowProvider } from 'reactflow';
// import ScenarioEditor from './components/flow/ScenarioEditor'; // Lazy loaded
// import Dashboard from './components/dashboard/Dashboard'; // Lazy loaded
// import Timeline3DViewer from './components/timeline3d/Timeline3DViewer'; // Lazy loaded
import Toolbar from './components/layout/Toolbar';
import { Navigation, Loader, BarChart3, Network, Settings2 } from 'lucide-react'; // Added icons

// Lazy load components
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const ScenarioEditor = lazy(() => import('./components/flow/ScenarioEditor'));
const Timeline3DViewer = lazy(() => import('./components/timeline3d/Timeline3DViewer'));


type View = 'dashboard' | 'editor' | 'timeline' | 'analytics' | 'settings';

// Generic Loading Fallback Component
const LoadingFallback = ({ title, message, IconComponent = Loader }: { title: string, message: string, IconComponent?: React.ElementType }) => (
  <div className="flex items-center justify-center h-full bg-gray-900">
    <div className="text-center p-8 rounded-lg shadow-2xl bg-gray-800">
      <IconComponent className="w-12 h-12 mx-auto mb-4 text-blue-400 animate-spin" />
      <h2 className="text-xl font-bold mb-2 text-white">{title}</h2>
      <p className="text-gray-400">{message}</p>
    </div>
  </div>
);


export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);

  // Mock data for 3D timeline (in production, this would come from the backend)
  // These should ideally be moved to a separate file or fetched
  const mockScenarios = [
    {
      id: 'scenario_1',
      name: 'Startup Pitch Analysis',
      agents: ['agent_1', 'agent_2', 'agent_3'],
      status: 'running'
    }
  ];

  const mockAgents = [
    {
      id: 'agent_1',
      role: 'Project Manager',
      personality: {
        traits: {
          openness: 0.8,
          conscientiousness: 0.9,
          extraversion: 0.7,
          agreeableness: 0.6,
          neuroticism: 0.3
        }
      }
    },
    {
      id: 'agent_2',
      role: 'Developer',
      personality: {
        traits: {
          openness: 0.9,
          conscientiousness: 0.8,
          extraversion: 0.4,
          agreeableness: 0.7,
          neuroticism: 0.4
        }
      }
    },
    {
      id: 'agent_3',
      role: 'Designer',
      personality: {
        traits: {
          openness: 0.95,
          conscientiousness: 0.7,
          extraversion: 0.8,
          agreeableness: 0.9,
          neuroticism: 0.2
        }
      }
    }
  ];

  const mockEvents = [
    {
      id: 'event_1',
      agentId: 'agent_1',
      type: 'action',
      timestamp: 1000,
      impact: 0.8,
      causality: []
    },
    {
      id: 'event_2',
      agentId: 'agent_2',
      type: 'decision',
      timestamp: 2500,
      impact: 0.9,
      causality: ['event_1']
    },
    {
      id: 'event_3',
      agentId: 'agent_3',
      type: 'interaction',
      timestamp: 4000,
      impact: 0.7,
      causality: ['event_1', 'event_2']
    },
    {
      id: 'event_4',
      agentId: 'agent_1',
      type: 'milestone',
      timestamp: 6000,
      impact: 0.95,
      causality: ['event_3']
    }
  ];

  const handleTimelinePlayToggle = () => {
    setIsTimelinePlaying(!isTimelinePlaying);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Suspense fallback={<LoadingFallback title="Loading Dashboard" message="Fetching latest scenarios..." IconComponent={BarChart3} />}><Dashboard onNavigate={setCurrentView} /></Suspense>;
      case 'editor':
        return (
          <ReactFlowProvider>
            <Suspense fallback={<LoadingFallback title="Loading Editor" message="Preparing scenario canvas..." IconComponent={Network}/>}>
              <ScenarioEditor />
            </Suspense>
          </ReactFlowProvider>
        );
      case 'timeline':
        return (
          <Suspense fallback={<LoadingFallback title="Loading 3D Timeline" message="Initializing Three.js environment..." IconComponent={Loader}/>}>
            <Timeline3DViewer
              scenarios={mockScenarios}
              events={mockEvents}
              agents={mockAgents}
              isPlaying={isTimelinePlaying}
              onPlayToggle={handleTimelinePlayToggle}
            />
          </Suspense>
        );
      case 'analytics':
        return (
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center bg-gray-800 p-8 rounded-lg shadow-xl">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-green-400" />
              <h2 className="text-2xl font-bold mb-2">Analytics Dashboard</h2>
              <p className="text-gray-400">Coming in Week 11 - Advanced Analytics & ML Insights</p>
            </div>
          </div>
        );
       case 'settings':
        return (
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center bg-gray-800 p-8 rounded-lg shadow-xl">
              <Settings2 className="w-16 h-16 mx-auto mb-4 text-purple-400" />
              <h2 className="text-2xl font-bold mb-2">Settings Panel</h2>
              <p className="text-gray-400">Future home for platform configurations.</p>
            </div>
          </div>
        );
      default:
        return <Suspense fallback={<LoadingFallback title="Loading" message="Please wait..." />}><Dashboard onNavigate={setCurrentView} /></Suspense>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Toolbar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-grow overflow-auto"> {/* Ensure main takes up remaining space and handles overflow */}
        {renderCurrentView()}
      </main>
    </div>
  );
}
