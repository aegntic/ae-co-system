import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DeepSiteData } from '../../services/deepAnalysisOrchestrator';

interface ProfessionalDarkTemplateProps {
  siteData: DeepSiteData;
}

export const ProfessionalDarkTemplate: React.FC<ProfessionalDarkTemplateProps> = ({ siteData }) => {
  const [activeNav, setActiveNav] = useState('work');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const stats = [
    { value: `${siteData.analysis.commits || '100+'}`, label: 'Commits' },
    { value: `${siteData.analysis.contributors || '5'}`, label: 'Contributors' },
    { value: `${Math.round((siteData.analysis.codeQuality?.score || 0.95) * 100)}%`, label: 'Code Quality' }
  ];

  const techStack = siteData.analysis.languages?.map(lang => lang.name) || ['JavaScript', 'TypeScript', 'React'];

  return (
    <div className="bg-gray-950 text-white font-inter min-h-screen overflow-x-hidden">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        .grid-bg {
          background-image: 
            linear-gradient(rgba(64, 64, 64, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(64, 64, 64, 0.2) 1px, transparent 1px);
          background-size: 32px 32px;
          background-position: 0 0, 0 0;
        }
        
        .feature-square {
          position: absolute;
          width: 64px;
          height: 64px;
          border: 1px solid rgba(139, 92, 246, 0.3);
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1));
          border-radius: 4px;
          animation: float 6s ease-in-out infinite;
        }
        
        .accent-dot {
          position: absolute;
          width: 4px;
          height: 4px;
          background-color: rgba(52, 211, 153, 0.6);
          border-radius: 50%;
        }
        
        .connect-line-h {
          position: absolute;
          width: 32px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), transparent);
        }
        
        .connect-line-v {
          position: absolute;
          width: 1px;
          height: 32px;
          background: linear-gradient(180deg, transparent, rgba(139, 92, 246, 0.4), transparent);
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .letter-spacing-2 {
          letter-spacing: 0.2em;
        }
      `}</style>

      {/* Enhanced Grid Background */}
      <div className="fixed inset-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 grid-bg"></div>
        
        {/* Enhanced grid elements with parallax */}
        <motion.div 
          className="absolute grid-elements"
          animate={{
            x: (mousePos.x - 0.5) * 20,
            y: (mousePos.y - 0.5) * 20
          }}
          transition={{ type: "spring", stiffness: 50 }}
        >
          <div className="feature-square top-[120px] left-[180px]"></div>
          <div className="feature-square top-[240px] right-[280px]" style={{ animationDelay: '-2s' }}></div>
          <div className="feature-square bottom-[180px] left-[380px]" style={{ animationDelay: '-4s' }}></div>
          
          <div className="accent-dot top-[160px] right-[180px]"></div>
          <div className="accent-dot bottom-[280px] left-[280px]"></div>
          <div className="accent-dot top-[320px] left-[120px]"></div>
          
          <div className="connect-line-h top-[180px] left-[260px]"></div>
          <div className="connect-line-v top-[180px] left-[340px]"></div>
          <div className="connect-line-h bottom-[200px] right-[380px]"></div>
        </motion.div>
      </div>

      {/* Status Bar */}
      <div className="relative z-20 flex items-center justify-between px-6 pt-4 text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
            <span>Open Source Project</span>
          </div>
          <span>{siteData.analysis.stars || '1k+'} Stars</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Last Updated: {new Date(siteData.analysis.lastCommit || Date.now()).toLocaleDateString()}</span>
          <div className="flex items-center space-x-1">
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Mac Dock Style Navigation */}
      <nav className="relative z-10 flex items-center justify-center pt-6 px-6">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gray-900/80 border border-gray-800/50 rounded-2xl px-8 py-4 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex items-center justify-center space-x-8">
            {['About', 'Work', 'Features', 'Documentation'].map((item) => (
              <motion.a
                key={item}
                href="#"
                className="nav-item group flex flex-col items-center space-y-2"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveNav(item.toLowerCase());
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className={`${activeNav === item.toLowerCase() ? 'text-white' : 'text-gray-400'} group-hover:text-white transition-all duration-200 text-sm font-medium`}>
                  {item}
                </span>
                <motion.div 
                  className={`w-1 h-1 rounded-full transition-all duration-200`}
                  animate={{
                    backgroundColor: activeNav === item.toLowerCase() ? '#fff' : 'transparent'
                  }}
                />
              </motion.a>
            ))}
          </div>
        </motion.div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 -mt-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-6xl mx-auto"
        >
          {/* Badge */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center space-x-2 bg-gray-900/50 border border-gray-800/50 rounded-full px-4 py-2 mb-8 backdrop-blur-sm"
          >
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span className="text-gray-300 text-sm font-medium">
              {siteData.analysis.primaryLanguage || 'Multi-Language'} Project
            </span>
          </motion.div>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-8 letter-spacing-2"
          >
            {siteData.repoData.owner} / {siteData.repoData.name}
          </motion.p>

          {/* Main Heading */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl lg:text-7xl font-bold leading-tight mb-8 tracking-tight"
          >
            {siteData.title.split(' ').slice(0, 2).join(' ')}<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-500 to-emerald-400">
              {siteData.title.split(' ').slice(2, 4).join(' ')}
            </span><br/>
            <span className="text-gray-300">{siteData.title.split(' ').slice(4).join(' ')}</span>
          </motion.h1>

          {/* Description */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-300 text-xl font-normal mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            {siteData.repoData.description || 'A powerful open-source project built with modern technologies.'}
          </motion.p>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center space-x-12 mb-12 text-center"
          >
            {stats.map((stat, index) => (
              <React.Fragment key={stat.label}>
                <motion.div 
                  className="stat-item"
                  whileHover={{ y: -2 }}
                >
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
                {index < stats.length - 1 && <div className="w-px h-8 bg-gray-800"></div>}
              </React.Fragment>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center space-x-4"
          >
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="primary-btn group bg-white text-gray-950 px-8 py-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center space-x-2 shadow-lg"
              onClick={() => window.open(siteData.repoUrl, '_blank')}
            >
              <span>View on GitHub</span>
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="secondary-btn group bg-gray-900/80 border border-gray-700 hover:border-gray-600 text-white px-8 py-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center space-x-2 backdrop-blur-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
              <span>Documentation</span>
            </motion.button>
          </motion.div>

          {/* Tech Stack */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 pt-8 border-t border-gray-800"
          >
            <p className="text-gray-500 text-sm mb-6">Technologies Used</p>
            <div className="flex items-center justify-center flex-wrap gap-4">
              {techStack.map((tech) => (
                <motion.div
                  key={tech}
                  whileHover={{ y: -1, borderColor: 'rgba(139, 92, 246, 0.5)', color: 'rgba(139, 92, 246, 1)' }}
                  className="tech-item text-sm font-medium px-4 py-2 border border-gray-700 rounded-lg text-gray-400 transition-all duration-200"
                >
                  {tech}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Made with 4site.pro */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 right-6 z-20"
      >
        <a 
          href="https://4site.pro" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center space-x-2 bg-gray-900/80 border border-gray-800/50 rounded-lg px-4 py-2 backdrop-blur-sm hover:border-gray-700 transition-all duration-200"
        >
          <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-blue-500 rounded flex items-center justify-center text-xs font-bold text-white">
            4
          </div>
          <span className="text-xs text-gray-400">Made with <span className="text-white">4site.pro</span></span>
        </a>
      </motion.div>
    </div>
  );
};