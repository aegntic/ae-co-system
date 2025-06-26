import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  CogIcon,
  KeyIcon,
  ShieldCheckIcon,
  ServerIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { api } from '@/lib/api'

interface ApiKeyForm {
  openrouter_key: string
}

const Settings: React.FC = () => {
  const [showApiKey, setShowApiKey] = useState(false)
  const queryClient = useQueryClient()

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: api.getConfig
  })

  const { register, handleSubmit, formState: { errors } } = useForm<ApiKeyForm>()

  const updateKeyMutation = useMutation({
    mutationFn: (data: ApiKeyForm) => api.updateOpenRouterKey(data.openrouter_key),
    onSuccess: () => {
      toast.success('OpenRouter API key updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['config'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update API key')
    }
  })

  const onSubmit = (data: ApiKeyForm) => {
    updateKeyMutation.mutate(data)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Settings</h1>
        <p className="text-neural-400">
          Configure API keys and system settings
        </p>
      </div>

      {/* System Status */}
      <div className="neural-card p-6">
        <h2 className="text-xl font-semibold text-neural-100 mb-4 flex items-center">
          <ServerIcon className="w-5 h-5 mr-2 text-aegntic-400" />
          System Status
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-neural-800/30 rounded-lg p-4 border border-neural-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neural-300">OpenRouter Connection</span>
              <div className={`flex items-center space-x-2 ${
                config?.openrouter_configured ? 'text-green-400' : 'text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  config?.openrouter_configured ? 'bg-green-400' : 'bg-red-400'
                } animate-pulse`} />
                <span className="text-xs">
                  {config?.openrouter_configured ? 'Connected' : 'Not Configured'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-neural-800/30 rounded-lg p-4 border border-neural-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neural-300">API Version</span>
              <span className="text-xs text-neural-400 font-mono">
                {config?.version || '--'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="neural-card p-6">
        <h2 className="text-xl font-semibold text-neural-100 mb-4 flex items-center">
          <KeyIcon className="w-5 h-5 mr-2 text-aegntic-400" />
          API Configuration
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neural-200 mb-2">
              OpenRouter API Key
            </label>
            <div className="relative">
              <input
                {...register('openrouter_key', {
                  required: 'API key is required',
                  pattern: {
                    value: /^sk-or-v1-[a-zA-Z0-9]+$/,
                    message: 'Invalid OpenRouter API key format'
                  }
                })}
                type={showApiKey ? 'text' : 'password'}
                placeholder="sk-or-v1-..."
                className="neural-input w-full pr-20"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-neural-400 hover:text-neural-200"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.openrouter_key && (
              <p className="text-red-400 text-sm mt-1">{errors.openrouter_key.message}</p>
            )}
            <p className="text-xs text-neural-500 mt-2">
              Your API key is stored securely and used only for content analysis.
            </p>
          </div>

          <button
            type="submit"
            disabled={updateKeyMutation.isPending}
            className="neural-button flex items-center space-x-2 disabled:opacity-50"
          >
            {updateKeyMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <ShieldCheckIcon className="w-4 h-4" />
                <span>Update API Key</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* AI Models */}
      <div className="neural-card p-6">
        <h2 className="text-xl font-semibold text-neural-100 mb-4 flex items-center">
          <SparklesIcon className="w-5 h-5 mr-2 text-aegntic-400" />
          AI Models Configuration
        </h2>

        <div className="space-y-4">
          <p className="text-sm text-neural-400">
            Current model configuration for different analysis tasks:
          </p>
          
          {config?.models && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(config.models).map(([task, model]) => (
                <div key={task} className="bg-neural-800/30 rounded-lg p-4 border border-neural-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neural-200 capitalize">
                      {task.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-aegntic-400 font-mono">
                      {model}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="bg-aegntic-600/10 border border-aegntic-600/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-aegntic-300 mb-2">
              Performance Optimized Setup
            </h4>
            <p className="text-xs text-neural-400 mb-2">
              Using DeepSeek R1.1 for 95% cost reduction while maintaining O1-level reasoning quality.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-aegntic-600/20 text-aegntic-300 px-2 py-1 rounded">
                DeepSeek R1.1 - Primary Reasoning
              </span>
              <span className="text-xs bg-aegntic-600/20 text-aegntic-300 px-2 py-1 rounded">
                Llama 3.1 70B - Content Analysis
              </span>
              <span className="text-xs bg-aegntic-600/20 text-aegntic-300 px-2 py-1 rounded">
                Mistral 7B - Quick Tasks
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Settings