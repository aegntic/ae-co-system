import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Zap, 
  HardDrive, 
  Globe, 
  Monitor,
  ChevronUp,
  ChevronDown,
  X
} from 'lucide-react';
import { useServiceWorker } from '../../utils/serviceWorker';
import { useComponentPerformance } from '../../hooks/usePerformance';

interface PerformanceData {
  fps: number;
  memoryUsed: number;
  memoryLimit: number;
  bundleSize: number;
  loadTime: number;
  cacheHitRate: number;
  renderTime: number;
}

interface PerformanceMonitorProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible = false,
  onToggle
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    fps: 60,
    memoryUsed: 0,
    memoryLimit: 0,
    bundleSize: 0,
    loadTime: 0,
    cacheHitRate: 0,
    renderTime: 0
  });

  const { status: swStatus, cacheSize } = useServiceWorker();
  const metrics = useComponentPerformance('PerformanceMonitor');

  useEffect(() => {
    if (!isVisible) return;

    const updatePerformanceData = () => {
      // FPS calculation
      let fps = 60;
      const now = performance.now();
      const frameTimes: number[] = [];
      
      const measureFrame = () => {
        const frameTime = performance.now() - now;
        frameTimes.push(frameTime);
        
        if (frameTimes.length > 60) {
          frameTimes.shift();
        }
        
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        fps = Math.round(1000 / avgFrameTime);
        
        if (isVisible) {
          requestAnimationFrame(measureFrame);
        }
      };
      
      requestAnimationFrame(measureFrame);

      // Memory usage
      let memoryUsed = 0;
      let memoryLimit = 0;
      
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        memoryUsed = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
        memoryLimit = Math.round(memory.jsHeapSizeLimit / 1024 / 1024); // MB
      }

      // Navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation ? Math.round(navigation.loadEventEnd - navigation.navigationStart) : 0;

      // Bundle size estimation
      const bundleSize = Math.round(cacheSize / 1024); // KB

      // Cache hit rate (simplified)
      const cacheHitRate = swStatus.activated ? 85 : 0;

      setPerformanceData({
        fps,
        memoryUsed,
        memoryLimit,
        bundleSize,
        loadTime,
        cacheHitRate,
        renderTime: Math.round(metrics.renderTime)
      });
    };

    updatePerformanceData();
    const interval = setInterval(updatePerformanceData, 1000);

    return () => clearInterval(interval);
  }, [isVisible, cacheSize, swStatus.activated, metrics.renderTime]);

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-400';
    if (value <= thresholds.warning) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMemoryPercentage = () => {
    if (performanceData.memoryLimit === 0) return 0;
    return (performanceData.memoryUsed / performanceData.memoryLimit) * 100;
  };

  if (!isVisible) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className="fixed bottom-20 right-6 w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40"
        title="Show Performance Monitor"
      >
        <Activity className="w-6 h-6 text-white" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed bottom-6 right-6 z-40"
    >
      <div className="backdrop-blur-xl bg-black/80 rounded-2xl border border-white/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Performance</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-white/60 hover:text-white transition-colors"
            >
              {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={onToggle}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-4 space-y-4"
            >
              {/* FPS and Render Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-white/60">FPS</span>
                  </div>
                  <div className={`text-lg font-bold ${getPerformanceColor(60 - performanceData.fps, { good: 5, warning: 15 })}`}>
                    {performanceData.fps}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-white/60">Render</span>
                  </div>
                  <div className={`text-lg font-bold ${getPerformanceColor(performanceData.renderTime, { good: 16, warning: 50 })}`}>
                    {performanceData.renderTime}ms
                  </div>
                </div>
              </div>

              {/* Memory Usage */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-white/60">Memory</span>
                  <span className="text-xs text-white/40 ml-auto">
                    {performanceData.memoryUsed}MB / {performanceData.memoryLimit}MB
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full ${
                      getMemoryPercentage() > 80 ? 'bg-red-400' :
                      getMemoryPercentage() > 60 ? 'bg-yellow-400' : 'bg-green-400'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${getMemoryPercentage()}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Bundle and Cache */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-white/60">Bundle</span>
                  </div>
                  <div className={`text-sm font-semibold ${getPerformanceColor(performanceData.bundleSize, { good: 500, warning: 1000 })}`}>
                    {performanceData.bundleSize}KB
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-white/60">Cache</span>
                  </div>
                  <div className={`text-sm font-semibold ${
                    performanceData.cacheHitRate > 80 ? 'text-green-400' :
                    performanceData.cacheHitRate > 60 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {performanceData.cacheHitRate}%
                  </div>
                </div>
              </div>

              {/* Service Worker Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Service Worker</span>
                <div className={`flex items-center gap-1 ${
                  swStatus.activated ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    swStatus.activated ? 'bg-green-400' : 'bg-yellow-400'
                  }`} />
                  <span className="text-xs">
                    {swStatus.activated ? 'Active' : 'Loading'}
                  </span>
                </div>
              </div>

              {/* Load Time */}
              {performanceData.loadTime > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">Load Time</span>
                  <span className={`text-xs font-semibold ${getPerformanceColor(performanceData.loadTime, { good: 2000, warning: 5000 })}`}>
                    {performanceData.loadTime}ms
                  </span>
                </div>
              )}

              {/* Performance Tips */}
              {(performanceData.fps < 50 || performanceData.renderTime > 50 || getMemoryPercentage() > 80) && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
                  <p className="text-xs text-yellow-300 font-medium mb-1">Performance Issues Detected</p>
                  <div className="text-xs text-yellow-200 space-y-1">
                    {performanceData.fps < 50 && <div>• Low FPS detected - consider reducing animations</div>}
                    {performanceData.renderTime > 50 && <div>• Slow renders - check for expensive operations</div>}
                    {getMemoryPercentage() > 80 && <div>• High memory usage - consider clearing caches</div>}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/**
 * Performance monitoring hook for easy integration
 */
export const usePerformanceMonitor = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggle = () => setIsVisible(!isVisible);
  const show = () => setIsVisible(true);
  const hide = () => setIsVisible(false);

  return {
    isVisible,
    toggle,
    show,
    hide,
    PerformanceMonitor: (props: Omit<PerformanceMonitorProps, 'isVisible' | 'onToggle'>) => (
      <PerformanceMonitor 
        {...props} 
        isVisible={isVisible} 
        onToggle={toggle} 
      />
    )
  };
};

export default PerformanceMonitor;