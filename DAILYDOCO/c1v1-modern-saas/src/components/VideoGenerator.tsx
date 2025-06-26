import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DownloadIcon, 
  PlayIcon, 
  StopIcon,
  CheckIcon,
  VideoIcon,
  FileTextIcon
} from '@radix-ui/react-icons';
import { cn } from '@/utils/cn';

interface VideoGeneratorProps {
  variant?: 'modern' | 'enterprise' | 'futuristic';
  className?: string;
}

export function VideoGenerator({ variant = 'modern', className }: VideoGeneratorProps) {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'ready' | 'recording' | 'processing' | 'complete'>('idle');
  const [progress, setProgress] = useState(0);
  const [generatedContent, setGeneratedContent] = useState<{
    title: string;
    description: string;
    duration: string;
  } | null>(null);
  
  const handleDownload = async () => {
    setStatus('downloading');
    setProgress(0);
    
    // Simulate download progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus('ready');
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };
  
  const handleStart = async () => {
    setStatus('recording');
    
    // Simulate recording for 5 seconds
    setTimeout(() => {
      setStatus('processing');
      
      // Simulate AI processing
      setTimeout(() => {
        setGeneratedContent({
          title: "Implementing Real-time WebSocket Integration in React Dashboard",
          description: "This documentation covers the step-by-step process of integrating WebSocket connections for real-time data updates in a React-based dashboard. Topics include connection management, automatic reconnection, state synchronization, and error handling strategies.",
          duration: "5:32"
        });
        setStatus('complete');
      }, 2000);
    }, 5000);
  };
  
  const handleStop = () => {
    setStatus('processing');
    
    setTimeout(() => {
      setGeneratedContent({
        title: "Quick Feature Implementation Overview",
        description: "A brief demonstration of the feature implementation process, covering the main components and integration points.",
        duration: "2:15"
      });
      setStatus('complete');
    }, 1500);
  };
  
  const handleReset = () => {
    setStatus('ready');
    setGeneratedContent(null);
  };
  
  const getButtonStyle = () => {
    const base = "inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105";
    
    switch (variant) {
      case 'enterprise':
        return cn(base, "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700");
      case 'futuristic':
        return cn(base, "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 glow-effect");
      default:
        return cn(base, "bg-blue-500 text-white hover:bg-blue-600");
    }
  };
  
  const getCardStyle = () => {
    switch (variant) {
      case 'enterprise':
        return "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg";
      case 'futuristic':
        return "glass-card border border-white/10 rounded-2xl backdrop-blur-xl";
      default:
        return "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm";
    }
  };
  
  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(getCardStyle(), "p-8 text-center")}
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <VideoIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Start Video Documentation</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Download our AI engine to automatically generate professional documentation videos with smart titles and descriptions
            </p>
            <button
              onClick={handleDownload}
              className={getButtonStyle()}
            >
              <DownloadIcon className="w-5 h-5" />
              Download & Start
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
              No internet required • Fully secure • Local processing
            </p>
          </motion.div>
        )}
        
        {status === 'downloading' && (
          <motion.div
            key="downloading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(getCardStyle(), "p-8")}
          >
            <h3 className="text-xl font-bold mb-4">Downloading AI Engine...</h3>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{progress}% complete</p>
          </motion.div>
        )}
        
        {status === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(getCardStyle(), "p-8 text-center")}
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Ready to Record</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Click start to begin recording. Our AI will analyze your workflow and generate documentation automatically.
            </p>
            <button
              onClick={handleStart}
              className={getButtonStyle()}
            >
              <PlayIcon className="w-5 h-5" />
              Start Recording
            </button>
          </motion.div>
        )}
        
        {status === 'recording' && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(getCardStyle(), "p-8 text-center")}
          >
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-red-600 flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2">Recording in Progress</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              AI is analyzing your actions and screen content...
            </p>
            <button
              onClick={handleStop}
              className={cn(getButtonStyle(), "bg-red-500 hover:bg-red-600")}
            >
              <StopIcon className="w-5 h-5" />
              Stop Recording
            </button>
          </motion.div>
        )}
        
        {status === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(getCardStyle(), "p-8 text-center")}
          >
            <div className="w-16 h-16 mx-auto mb-6">
              <motion.div
                className="w-full h-full rounded-full border-4 border-blue-500 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <h3 className="text-2xl font-bold mb-2">Processing Video</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Generating title, description, and optimizing video...
            </p>
          </motion.div>
        )}
        
        {status === 'complete' && generatedContent && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(getCardStyle(), "p-8")}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <CheckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Video Documentation Complete!</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your video has been processed and is ready for use.
                </p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <VideoIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">Generated Title</span>
                </div>
                <p className="font-semibold">{generatedContent.title}</p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileTextIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">Generated Description</span>
                </div>
                <p className="text-sm">{generatedContent.description}</p>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-sm font-medium text-gray-500">Duration</span>
                <span className="font-semibold">{generatedContent.duration}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className={cn(getButtonStyle(), "flex-1")}
              >
                Record Another
              </button>
              <button
                className={cn(
                  "flex-1 px-6 py-3 rounded-lg font-medium transition-all",
                  "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
                  "hover:bg-gray-300 dark:hover:bg-gray-600"
                )}
              >
                Save & Export
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}