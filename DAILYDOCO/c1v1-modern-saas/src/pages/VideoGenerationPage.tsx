import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PlayIcon, 
  StopIcon, 
  GearIcon,
  MagicWandIcon,
  LockClosedIcon,
  SpeakerLoudIcon,
  ImageIcon,
  CheckIcon
} from '@radix-ui/react-icons';
import * as Switch from '@radix-ui/react-switch';
import { useToastContext } from '@/components/ToastProvider';
import { cn } from '@/utils/cn';

const voiceStyles = [
  { id: 'professional', name: 'Professional', description: 'Clear and authoritative' },
  { id: 'casual', name: 'Casual', description: 'Friendly and conversational' },
  { id: 'technical', name: 'Technical', description: 'Precise and detailed' },
];

const qualityOptions = [
  { id: 'standard', name: 'Standard (720p)', description: 'Good quality, smaller files' },
  { id: 'high', name: 'High (1080p)', description: 'Great quality, balanced size' },
  { id: '4k', name: '4K (2160p)', description: 'Best quality, larger files' },
];

export default function VideoGenerationPage() {
  const toast = useToastContext();
  const [isRecording, setIsRecording] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [voiceStyle, setVoiceStyle] = useState('professional');
  const [quality, setQuality] = useState('high');
  const [blurSensitive, setBlurSensitive] = useState(true);
  const [autoNarrate, setAutoNarrate] = useState(true);
  const [includeClicks, setIncludeClicks] = useState(true);

  const handleStartRecording = () => {
    if (!title.trim()) {
      toast.error('Title Required', 'Please enter a title for your video');
      return;
    }

    setIsRecording(true);
    toast.success('Recording Started', 'Your screen is now being captured');
    
    // Simulate recording
    setTimeout(() => {
      setIsRecording(false);
      toast.success('Recording Complete', 'Your video is being processed');
    }, 5000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    toast.info('Recording Stopped', 'Processing your video...');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Generate Video Documentation
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Create professional documentation videos with AI-powered narration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recording Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
          >
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
              {isRecording ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                      <div className="w-8 h-8 bg-white rounded-full"></div>
                    </div>
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Recording in progress...
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Your screen is being captured
                    </p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Ready to record
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Configure your settings and click record
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Recording Controls */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="space-y-4 flex-1 mr-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Video Title *
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., API Integration Tutorial"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={isRecording}
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of what you'll be demonstrating..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      disabled={isRecording}
                    />
                  </div>
                </div>
                
                <button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className={cn(
                    'flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center transition-all',
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  )}
                >
                  {isRecording ? (
                    <StopIcon className="w-8 h-8" />
                  ) : (
                    <PlayIcon className="w-8 h-8 ml-1" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Quick Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <MagicWandIcon className="w-5 h-5 text-primary-600" />
              AI Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="auto-narrate" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Auto-generate narration
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    AI will create voice narration based on your actions
                  </p>
                </div>
                <Switch.Root
                  id="auto-narrate"
                  checked={autoNarrate}
                  onCheckedChange={setAutoNarrate}
                  className={cn(
                    'w-11 h-6 rounded-full relative transition-colors',
                    autoNarrate ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                >
                  <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5" />
                </Switch.Root>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="include-clicks" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Show mouse clicks
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Highlight where you click during recording
                  </p>
                </div>
                <Switch.Root
                  id="include-clicks"
                  checked={includeClicks}
                  onCheckedChange={setIncludeClicks}
                  className={cn(
                    'w-11 h-6 rounded-full relative transition-colors',
                    includeClicks ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                >
                  <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5" />
                </Switch.Root>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Voice Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <SpeakerLoudIcon className="w-5 h-5 text-primary-600" />
              Voice Style
            </h3>
            <div className="space-y-2">
              {voiceStyles.map((style) => (
                <label
                  key={style.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                    voiceStyle === style.id
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="voice-style"
                      value={style.id}
                      checked={voiceStyle === style.id}
                      onChange={(e) => setVoiceStyle(e.target.value)}
                      className="sr-only"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {style.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {style.description}
                      </p>
                    </div>
                  </div>
                  {voiceStyle === style.id && (
                    <CheckIcon className="w-5 h-5 text-primary-600" />
                  )}
                </label>
              ))}
            </div>
          </motion.div>

          {/* Quality Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <GearIcon className="w-5 h-5 text-primary-600" />
              Quality
            </h3>
            <div className="space-y-2">
              {qualityOptions.map((option) => (
                <label
                  key={option.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                    quality === option.id
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="quality"
                      value={option.id}
                      checked={quality === option.id}
                      onChange={(e) => setQuality(e.target.value)}
                      className="sr-only"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {option.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  {quality === option.id && (
                    <CheckIcon className="w-5 h-5 text-primary-600" />
                  )}
                </label>
              ))}
            </div>
          </motion.div>

          {/* Privacy Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <LockClosedIcon className="w-5 h-5 text-primary-600" />
              Privacy
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="blur-sensitive" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Blur sensitive content
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Auto-detect and blur passwords, keys
                  </p>
                </div>
                <Switch.Root
                  id="blur-sensitive"
                  checked={blurSensitive}
                  onCheckedChange={setBlurSensitive}
                  className={cn(
                    'w-11 h-6 rounded-full relative transition-colors',
                    blurSensitive ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                >
                  <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 translate-x-0.5" />
                </Switch.Root>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}