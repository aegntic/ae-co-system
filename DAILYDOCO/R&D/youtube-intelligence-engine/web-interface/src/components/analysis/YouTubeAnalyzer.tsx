import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  XMarkIcon,
  PlayIcon,
  LinkIcon,
  CogIcon,
  SparklesIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  StarIcon,
  ChartBarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { Dialog } from '@headlessui/react'
import { api, type YouTubeAnalysisRequest } from '@/lib/api'

interface YouTubeAnalyzerProps {
  onClose: () => void
}

interface FormData {
  url: string
  includeTranscript: boolean
  includeMetadata: boolean
  generateSuggestions: boolean
}

const YouTubeAnalyzer: React.FC<YouTubeAnalyzerProps> = ({ onClose }) => {
  const [analysisStep, setAnalysisStep] = useState<string>('')
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)
  const queryClient = useQueryClient()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      includeTranscript: true,
      includeMetadata: true,
      generateSuggestions: true
    }
  })

  const analyzeMutation = useMutation({
    mutationFn: async (data: YouTubeAnalysisRequest) => {
      // Real-time progress tracking for actual analysis
      setAnalysisStep('Extracting video metadata...')
      setAnalysisProgress(10)
      
      // Start the actual analysis
      const analysisPromise = api.analyzeYouTubeUrl(data)
      
      // Update progress more realistically during actual processing
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev < 20) {
            setAnalysisStep('Downloading transcript...')
            return prev + 2
          } else if (prev < 40) {
            setAnalysisStep('Processing with AI models...')
            return prev + 1
          } else if (prev < 85) {
            setAnalysisStep('Generating intelligent insights...')
            return prev + 0.5
          } else {
            setAnalysisStep('Finalizing analysis...')
            return Math.min(prev + 0.2, 95) // Cap at 95% until complete
          }
        })
      }, 1000)
      
      try {
        const result = await analysisPromise
        clearInterval(progressInterval)
        setAnalysisProgress(100)
        setAnalysisStep('Analysis complete!')
        return result
      } catch (error) {
        clearInterval(progressInterval)
        throw error
      }
    },
    onSuccess: (data) => {
      console.log('Analysis result:', data) // Debug log
      toast.success(`Analysis completed! Generated ${data.selectable_actions?.length || 0} action suggestions.`)
      queryClient.invalidateQueries({ queryKey: ['recent-analyses'] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-graph-stats'] })
      setAnalysisResult(data)
      setShowResults(true)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Analysis failed. Please try again.')
      setAnalysisStep('')
      setAnalysisProgress(0)
    }
  })

  const onSubmit = (data: FormData) => {
    const request: YouTubeAnalysisRequest = {
      url: data.url,
      options: {
        include_transcript: data.includeTranscript,
        include_metadata: data.includeMetadata,
        generate_suggestions: data.generateSuggestions
      }
    }
    analyzeMutation.mutate(request)
  }

  const validateYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/
    return youtubeRegex.test(url) || 'Please enter a valid YouTube URL'
  }

  const watchedUrl = watch('url')
  const isValidUrl = watchedUrl && validateYouTubeUrl(watchedUrl) === true

  return (
    <AnimatePresence>
      <Dialog
        open={true}
        onClose={analyzeMutation.isPending ? () => {} : onClose}
        className="relative z-50"
      >
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <motion.div
            className="neural-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neural-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-aegntic-500 to-aegntic-600 rounded-lg flex items-center justify-center">
                  <PlayIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neural-100">
                    YouTube Intelligence Analyzer
                  </h2>
                  <p className="text-sm text-neural-400">
                    Transform video content into actionable insights
                  </p>
                </div>
              </div>
              {!analyzeMutation.isPending && (
                <button
                  onClick={onClose}
                  className="text-neural-400 hover:text-neural-200 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Analysis Progress */}
            {analyzeMutation.isPending && (
              <motion.div
                className="p-6 border-b border-neural-700"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-8 h-8 bg-aegntic-600 rounded-full flex items-center justify-center animate-spin">
                    <SparklesIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neural-200">
                      {analysisStep || 'Preparing analysis...'}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex-1 bg-neural-700 rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-aegntic-500 to-aegntic-400 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${analysisProgress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <span className="text-xs text-neural-400 font-mono">
                        {analysisProgress}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Results View */}
            {showResults && analysisResult ? (
              <div className="p-6">
                {/* Results Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-400" />
                    <div>
                      <h3 className="text-lg font-bold text-neural-100">Analysis Complete</h3>
                      <p className="text-sm text-neural-400">
                        Analysis ID: {analysisResult.analysis_id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowResults(false)}
                    className="flex items-center space-x-2 text-neural-400 hover:text-neural-200 transition-colors"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span className="text-sm">Back</span>
                  </button>
                </div>

                {/* Overall Rating */}
                {analysisResult.ratings?.overall_rating && (
                  <div className="bg-neural-800/30 rounded-lg p-4 border border-neural-700 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-neural-200 mb-1">Overall Rating</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-aegntic-400">
                            {analysisResult.ratings.overall_rating.score}/10
                          </span>
                          <span className="text-sm text-neural-400">
                            ({analysisResult.ratings.overall_rating.grade})
                          </span>
                        </div>
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.round(analysisResult.ratings.overall_rating.score / 2)
                                ? 'text-yellow-400'
                                : 'text-neural-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Selectable Actions */}
                {analysisResult.selectable_actions && analysisResult.selectable_actions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-neural-100 mb-4 flex items-center space-x-2">
                      <SparklesIcon className="w-5 h-5 text-aegntic-400" />
                      <span>Actionable Insights ({analysisResult.selectable_actions.length})</span>
                    </h4>
                    <div className="space-y-3">
                      {analysisResult.selectable_actions.slice(0, 5).map((action: any, index: number) => (
                        <div
                          key={index}
                          className="bg-neural-800/50 rounded-lg p-4 border border-neural-700 hover:border-aegntic-600 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-neural-100">{action.title}</h5>
                            <div className="flex items-center space-x-2">
                              {action.feasibility_score && (
                                <span className="text-xs bg-aegntic-600 text-white px-2 py-1 rounded">
                                  {Math.round(action.feasibility_score * 100)}% feasible
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-neural-400 mb-3">{action.description}</p>
                          {action.context_rating && (
                            <div className="flex items-center space-x-2">
                              <ChartBarIcon className="w-4 h-4 text-neural-500" />
                              <span className="text-xs text-neural-500">
                                Context Rating: {action.context_rating}/10
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technical Concepts */}
                {(analysisResult.technical_concepts || analysisResult.actionable_insights?.technical_concepts) && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-neural-100 mb-4">Technical Concepts</h4>
                    <div className="flex flex-wrap gap-2">
                      {(analysisResult.technical_concepts || analysisResult.actionable_insights?.technical_concepts || []).slice(0, 10).map((concept: any, index: number) => (
                        <span
                          key={index}
                          className="text-xs bg-neural-700 text-neural-300 px-3 py-1 rounded-full border border-neural-600"
                        >
                          {typeof concept === 'string' ? concept : concept.name || concept.concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enhancement Suggestions */}
                {analysisResult.enhancement_suggestions && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-neural-100 mb-4">Enhancement Suggestions</h4>
                    {analysisResult.enhancement_suggestions.quick_wins && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-neural-200 mb-2">Quick Wins</h5>
                        <ul className="space-y-1">
                          {analysisResult.enhancement_suggestions.quick_wins.slice(0, 3).map((suggestion: any, index: number) => (
                            <li key={index} className="text-sm text-neural-400 flex items-start space-x-2">
                              <span className="text-aegntic-400 mt-1">•</span>
                              <span>{typeof suggestion === 'string' ? suggestion : suggestion.title || suggestion.description || JSON.stringify(suggestion)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-neural-700">
                  <button
                    onClick={() => setShowResults(false)}
                    className="neural-button-secondary"
                  >
                    Analyze Another
                  </button>
                  <button
                    onClick={onClose}
                    className="neural-button"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                {/* URL Input */}
                <div>
                <label className="block text-sm font-medium text-neural-200 mb-2">
                  YouTube URL
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neural-400" />
                  <input
                    {...register('url', {
                      required: 'YouTube URL is required',
                      validate: validateYouTubeUrl
                    })}
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="neural-input w-full pl-10"
                    disabled={analyzeMutation.isPending}
                  />
                  {isValidUrl && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
                {errors.url && (
                  <p className="text-red-400 text-sm mt-1">{errors.url.message}</p>
                )}
              </div>

              {/* Analysis Options */}
              <div>
                <label className="block text-sm font-medium text-neural-200 mb-3">
                  Analysis Options
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      {...register('includeTranscript')}
                      type="checkbox"
                      className="w-4 h-4 rounded border-neural-600 bg-neural-700 text-aegntic-500 focus:ring-aegntic-500"
                      disabled={analyzeMutation.isPending}
                    />
                    <div className="flex items-center space-x-2">
                      <DocumentTextIcon className="w-4 h-4 text-neural-400" />
                      <span className="text-sm text-neural-200">Include transcript analysis</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      {...register('includeMetadata')}
                      type="checkbox"
                      className="w-4 h-4 rounded border-neural-600 bg-neural-700 text-aegntic-500 focus:ring-aegntic-500"
                      disabled={analyzeMutation.isPending}
                    />
                    <div className="flex items-center space-x-2">
                      <CogIcon className="w-4 h-4 text-neural-400" />
                      <span className="text-sm text-neural-200">Extract detailed metadata</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      {...register('generateSuggestions')}
                      type="checkbox"
                      className="w-4 h-4 rounded border-neural-600 bg-neural-700 text-aegntic-500 focus:ring-aegntic-500"
                      disabled={analyzeMutation.isPending}
                    />
                    <div className="flex items-center space-x-2">
                      <SparklesIcon className="w-4 h-4 text-neural-400" />
                      <span className="text-sm text-neural-200">Generate enhancement suggestions</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* AI Models Info */}
              <div className="bg-neural-800/30 rounded-lg p-4 border border-neural-700">
                <div className="flex items-center space-x-2 mb-2">
                  <SparklesIcon className="w-4 h-4 text-aegntic-400" />
                  <span className="text-sm font-medium text-neural-200">AI Analysis Pipeline</span>
                </div>
                <p className="text-xs text-neural-400 mb-2">
                  Using OpenRouter premium models for maximum accuracy:
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-neural-700 text-neural-300 px-2 py-1 rounded">
                    DeepSeek R1.1
                  </span>
                  <span className="text-xs bg-neural-700 text-neural-300 px-2 py-1 rounded">
                    Llama 3.1 70B
                  </span>
                  <span className="text-xs bg-neural-700 text-neural-300 px-2 py-1 rounded">
                    Mistral 7B
                  </span>
                </div>
              </div>

              {/* Estimated Processing Time */}
              {isValidUrl && (
                <motion.div
                  className="flex items-center space-x-2 text-sm text-neural-400"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ClockIcon className="w-4 h-4" />
                  <span>Estimated processing time: 60-90 seconds</span>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-4 border-t border-neural-700">
                {!analyzeMutation.isPending && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="neural-button-secondary"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!isValidUrl || analyzeMutation.isPending}
                  className="neural-button flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-4 h-4" />
                      <span>Start Analysis</span>
                    </>
                  )}
                </button>
              </div>
            </form>
            )}
          </motion.div>
        </div>
      </Dialog>
    </AnimatePresence>
  )
}

export default YouTubeAnalyzer