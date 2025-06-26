import { useState, Suspense } from 'react';
import { ReactFlowProvider } from 'reactflow';
import ScenarioEditor from './components/flow/ScenarioEditor';
import Dashboard from './components/dashboard/Dashboard';
import Timeline3DViewer from './components/timeline3d/Timeline3DViewer';
import Toolbar from './components/layout/Toolbar';
import { Navigation, Loader } from 'lucide-react';

type View = 'dashboard' | 'editor' | 'timeline' | 'analytics';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);

  // Mock data for 3D timeline (in production, this would come from the backend)
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
        return <Dashboard onNavigate={setCurrentView} />;
      case 'editor':
        return (
          <ReactFlowProvider>
            <ScenarioEditor />
          </ReactFlowProvider>
        );
      case 'timeline':
        return (
          <Suspense fallback={
            <div className="flex items-center justify-center h-full bg-gray-900">
              <div className="text-center">
                <Loader className="w-12 h-12 mx-auto mb-4 text-blue-400 animate-spin" />
                <h2 className="text-xl font-bold mb-2 text-white">Loading 3D Timeline</h2>
                <p className="text-gray-400">Initializing Three.js environment...</p>
              </div>
            </div>
          }>
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
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Navigation className="w-16 h-16 mx-auto mb-4 text-green-400" />
              <h2 className="text-2xl font-bold mb-2">Analytics Dashboard</h2>
              <p className="text-gray-400">Coming in Week 11 - Advanced Analytics</p>
            </div>
          </div>
        );
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Toolbar currentView={currentView} onViewChange={setCurrentView} />
      <main className="h-[calc(100vh-64px)]">
        {renderCurrentView()}
      </main>
    </div>
  );
}