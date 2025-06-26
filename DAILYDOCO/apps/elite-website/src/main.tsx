import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

// Performance monitoring in development
if (import.meta.env.DEV) {
  console.log('🚀 DailyDoco Pro Elite Website - Development Mode')
  console.log('🎯 Bun + Vite + React + TailwindCSS v4 + Framer Motion')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)