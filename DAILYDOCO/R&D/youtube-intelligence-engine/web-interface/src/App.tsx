import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/Dashboard'
import Analysis from './pages/Analysis'
import KnowledgeGraph from './pages/KnowledgeGraph'
import Graphitti from './pages/Graphitti'
import Settings from './pages/Settings'

function App() {
  return (
    <div className="min-h-screen bg-neural-950 text-neural-100">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-neural-950 via-neural-900 to-neural-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(12,154,229,0.1),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(12,154,229,0.05),transparent)]" />
      </div>
      
      {/* Main app container */}
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header />
          
          {/* Page content */}
          <main className="flex-1 p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-7xl mx-auto"
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/analysis" element={<Analysis />} />
                <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
                <Route path="/graphitti" element={<Graphitti />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App