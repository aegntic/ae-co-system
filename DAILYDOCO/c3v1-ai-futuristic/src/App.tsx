import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ToastProvider';
import Layout from './components/Layout';
import ParticleBackground from './components/ParticleBackground';

// Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AIStudioPage from './pages/AIStudioPage';
import NeuralInsightsPage from './pages/NeuralInsightsPage';
import AutomationPage from './pages/AutomationPage';
import { VideoGeneratorPage } from './pages/VideoGeneratorPage';

function App() {
  return (
    <ToastProvider>
      <ParticleBackground />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/video-generator" element={<VideoGeneratorPage />} />
            <Route path="/ai-studio" element={<AIStudioPage />} />
            <Route path="/neural-insights" element={<NeuralInsightsPage />} />
            <Route path="/automation" element={<AutomationPage />} />
          </Route>
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;