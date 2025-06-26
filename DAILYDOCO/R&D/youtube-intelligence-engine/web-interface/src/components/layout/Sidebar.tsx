import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HomeIcon,
  MagnifyingGlassIcon,
  ShareIcon,
  DocumentDuplicateIcon,
  CogIcon,
  ChartBarIcon,
  CpuChipIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeSolid,
  MagnifyingGlassIcon as SearchSolid,
  ShareIcon as ShareSolid,
  DocumentDuplicateIcon as DocumentSolid,
  CogIcon as CogSolid,
  ChartBarIcon as ChartSolid,
  CpuChipIcon as CpuSolid,
  BeakerIcon as BeakerSolid
} from '@heroicons/react/24/solid'

interface NavItem {
  name: string
  path: string
  icon: React.ElementType
  iconSolid: React.ElementType
  description: string
  badge?: string
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/',
    icon: HomeIcon,
    iconSolid: HomeSolid,
    description: 'Overview and quick actions'
  },
  {
    name: 'Analysis',
    path: '/analysis',
    icon: MagnifyingGlassIcon,
    iconSolid: SearchSolid,
    description: 'YouTube content analysis'
  },
  {
    name: 'Knowledge Graph',
    path: '/knowledge-graph',
    icon: ShareIcon,
    iconSolid: ShareSolid,
    description: 'Explore connections'
  },
  {
    name: 'Graphitti',
    path: '/graphitti',
    icon: DocumentDuplicateIcon,
    iconSolid: DocumentSolid,
    description: 'Version management',
    badge: 'v2.0'
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: CogIcon,
    iconSolid: CogSolid,
    description: 'Configuration & API keys'
  }
]

const Sidebar: React.FC = () => {
  const location = useLocation()

  return (
    <motion.aside
      className="w-64 bg-neural-900/40 backdrop-blur-sm border-r border-neural-800 flex flex-col"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item, index) => {
          const isActive = location.pathname === item.path
          const IconComponent = isActive ? item.iconSolid : item.icon
          
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-aegntic-600/20 text-aegntic-300 neural-glow'
                      : 'text-neural-400 hover:text-neural-200 hover:bg-neural-800/50'
                  }`
                }
              >
                <IconComponent 
                  className={`w-5 h-5 mr-3 transition-colors ${
                    isActive ? 'text-aegntic-400' : 'text-neural-500 group-hover:text-neural-300'
                  }`} 
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {item.name}
                    </span>
                    {item.badge && (
                      <span className="text-xs bg-aegntic-600/20 text-aegntic-300 px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neural-500 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </NavLink>
            </motion.div>
          )
        })}
      </nav>

      {/* Aegntic.ai Branding */}
      <motion.div
        className="p-4 border-t border-neural-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-aegntic-600/10 to-aegntic-500/10 border border-aegntic-600/20">
          <div className="w-8 h-8 bg-gradient-to-br from-aegntic-500 to-aegntic-600 rounded-lg flex items-center justify-center">
            <CpuChipIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold gradient-text">
              Aegntic.ai
            </p>
            <p className="text-xs text-neural-500">
              Intelligence Platform
            </p>
          </div>
        </div>
        
        {/* Version info */}
        <div className="mt-3 text-center">
          <p className="text-xs text-neural-600">
            YouTube Intelligence v1.0.0
          </p>
          <p className="text-xs text-neural-700">
            Built with Bun + React
          </p>
        </div>
      </motion.div>
    </motion.aside>
  )
}

export default Sidebar