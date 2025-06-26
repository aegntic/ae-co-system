// UltraPlan Main App Component
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import AnalysisPage from './pages/AnalysisPage'
import PlanPage from './pages/PlanPage'
import MarketplacePage from './pages/MarketplacePage'
import PricingPage from './pages/PricingPage'
import LoginPage from './pages/LoginPage'

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        
        {/* Protected routes */}
        <Route
          element={
            isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analysis/:id" element={<AnalysisPage />} />
          <Route path="/plan/:id" element={<PlanPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App