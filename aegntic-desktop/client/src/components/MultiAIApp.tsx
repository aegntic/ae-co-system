import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import ModelSelector from './ModelSelector';
import PromptInput from './PromptInput';
import ResponseView from './ResponseView';
import HistoryPanel from './HistoryPanel';
import SettingsPanel from './SettingsPanel';
import PerformanceDashboard from './PerformanceDashboard';
import './PerformanceDashboard.css';

const { invoke, on, removeAllListeners, path: pathAPI } = window.electronAPI;

interface AIModel {
  id: string;
  name: string;
  isLoggedIn: boolean;
}

interface Response {
  modelId: string;
  modelName: string;
  content: string;
  isComplete?: boolean;
  error?: boolean;
  timestamp: number;
  prompt?: string;
}

interface Conversation {
  id: string;
  prompt: string;
  responses: Record<string, Response>;
  timestamp: number;
  exportedToObsidian: boolean;
}

interface AppSettings {
  theme: 'light' | 'dark';
  responseViewMode: 'tabs' | 'split';
  autoExportToObsidian: boolean;
  obsidianVaultPath: string | null;
}

const MultiAIApp: React.FC = () => {
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [loginModelId, setLoginModelId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showPerformance, setShowPerformance] = useState<boolean>(false);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    responseViewMode: 'tabs',
    autoExportToObsidian: false,
    obsidianVaultPath: null
  });
  const [history, setHistory] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);


  const clearConversation = useCallback(() => {
    setSelectedConversation(null);
    setCurrentPrompt('');
    setResponses({});
  }, [setSelectedConversation, setCurrentPrompt, setResponses]);

  const handleNewConversation = useCallback(() => {
    setSelectedConversation(null);
    setCurrentPrompt('');
    setResponses({});
    setErrorMessage(null);
    if (promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, [setSelectedConversation, setCurrentPrompt, setResponses, setErrorMessage, promptInputRef]);

  const saveConversationToHistory = useCallback(async () => {
    if (!currentPrompt || Object.keys(responses).length === 0) return;
    try {
      await invoke('add-conversation', currentPrompt, responses);
      const result = await invoke('get-conversations');
      if (result.success) {
        setHistory(result.conversations as Conversation[]);
      }
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }, [currentPrompt, responses, setHistory]);

  const checkAllResponsesComplete = useCallback(() => {
    const allComplete = Object.values(responses).every(response => response.isComplete);
    if (allComplete && isLoading) {
      setIsLoading(false);
      if (Object.keys(responses).length > 0) {
        saveConversationToHistory();
      }
    }
  }, [responses, isLoading, saveConversationToHistory, setIsLoading]);

  const updateModelLoginStatus = useCallback((statusMap: Record<string, boolean>) => {
    setAvailableModels((prev: AIModel[]) =>
      prev.map((model: AIModel) => ({
        ...model,
        isLoggedIn: statusMap[model.id] ?? model.isLoggedIn
      }))
    );
  }, [setAvailableModels]);

  const handleExportToObsidian = useCallback(async (conversationId: string | null = null) => {
    try {
      const result = await invoke('export-to-obsidian', conversationId);
      if (result.success) {
        setErrorMessage(null);
        if (conversationId) {
          const historyResult = await invoke('get-conversations');
          if (historyResult.success) {
            setHistory(historyResult.conversations as Conversation[]);
          }
        }
      } else {
        setErrorMessage(`Failed to export: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to export:', error);
      setErrorMessage('Failed to export. See console for details.');
    }
  }, [setErrorMessage, setHistory]);


  useEffect(() => {
    const fetchModels = async () => {
      try {
        const models = await invoke('get-available-models');
        setAvailableModels(models as AIModel[]);
      } catch (error) {
        console.error('Failed to fetch models:', error);
        setErrorMessage('Failed to fetch models. Please restart the application.');
      }
    };

    const loadSettings = async () => {
      try {
        const result = await invoke('get-app-settings');
        if (result.success) {
          setSettings(result.settings as AppSettings);
          document.documentElement.dataset.theme = result.settings.theme;
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    const loadConversationHistory = async () => {
      try {
        const result = await invoke('get-conversations');
        if (result.success) {
          setHistory(result.conversations as Conversation[]);
        }
      } catch (error) {
        console.error('Failed to load conversation history:', error);
      }
    };

    const setupEventListeners = () => {
      on('response-update', (_event: any, newResponses: Record<string, Response>) => {
        setResponses((prev: Record<string, Response>) => ({ ...prev, ...newResponses }));
      });

      on('response-complete', (_event: any, modelId: string, response: Response) => {
        setResponses((prev: Record<string, Response>) => ({
          ...prev,
          [modelId]: {
            ...prev[modelId],
            ...response,
            isComplete: true
          }
        }));
        checkAllResponsesComplete();
      });

      on('response-error', (_event: any, modelId: string, error: any) => {
        console.error(`Error from ${modelId}:`, error);
        setResponses((prev: Record<string, Response>) => {
          const existingResponse = prev[modelId];
          const modelName = existingResponse?.modelName || availableModels.find(m => m.id === modelId)?.name || 'Unknown Model';
          
          const errorResponse: Response = {
            modelId,
            modelName,
            content: `Error: ${error.message}`,
            timestamp: existingResponse?.timestamp || Date.now(),
            isComplete: true,
            error: true
          };

          // Only add prompt if it exists
          if (existingResponse?.prompt) {
            errorResponse.prompt = existingResponse.prompt;
          }
          
          return {
            ...prev,
            [modelId]: errorResponse
          };
        });
        checkAllResponsesComplete();
      });

      on('show-settings', () => setShowSettings(true));
      on('new-conversation', () => {
        clearConversation();
        if (promptInputRef.current) {
          promptInputRef.current.focus();
        }
      });
      on('export-to-obsidian', () => handleExportToObsidian());
    };

    fetchModels();
    loadSettings();
    loadConversationHistory();
    setupEventListeners();

    const loginCheckInterval = setInterval(() => {
      invoke('check-login-status')
        .then((result: any) => {
          if (result.success) {
            updateModelLoginStatus(result.status);
          }
        })
        .catch((err: any) => console.error('Login check failed:', err));
    }, 5 * 60 * 1000);

    return () => {
      removeAllListeners('response-update');
      removeAllListeners('response-complete');
      removeAllListeners('response-error');
      removeAllListeners('show-settings');
      removeAllListeners('new-conversation');
      removeAllListeners('export-to-obsidian');
      clearInterval(loginCheckInterval);
    };
  }, [checkAllResponsesComplete, clearConversation, handleExportToObsidian, updateModelLoginStatus, availableModels, setAvailableModels, setErrorMessage, setSettings, setHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+P for Performance Dashboard
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setShowPerformance(prev => !prev);
      }
      // Ctrl+H for History
      if (event.ctrlKey && event.key === 'h') {
        event.preventDefault();
        setShowHistory(prev => !prev);
      }
      // Ctrl+, for Settings
      if (event.ctrlKey && event.key === ',') {
        event.preventDefault();
        setShowSettings(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);


  const handleModelToggle = (modelId: string) => {
    setSelectedModels((prev: string[]) =>
      prev.includes(modelId)
        ? prev.filter((id: string) => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleSendPrompt = async (prompt: string) => {
    if (!prompt.trim() || selectedModels.length === 0) return;

    const notLoggedInModels = selectedModels.filter(
      (id: string) => !availableModels.find((model: AIModel) => model.id === id)?.isLoggedIn
    );

    if (notLoggedInModels.length > 0) {
      setErrorMessage(`Please log in to: ${notLoggedInModels.map((id: string) =>
        availableModels.find((model: AIModel) => model.id === id)?.name
      ).join(', ')}`);
      return;
    }

    setIsLoading(true);
    setCurrentPrompt(prompt);
    setErrorMessage(null);
    setResponses({});

    try {
      await invoke('send-prompt', prompt, selectedModels);
    } catch (error) {
      console.error('Failed to send prompt:', error);
      setErrorMessage('Failed to send prompt. Please try again.');
      setIsLoading(false);
    }
  };

  const handleStopGeneration = async () => {
    try {
      await invoke('stop-generation');
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to stop generation:', error);
    }
  };

  const handleLoginRequest = async (modelId: string) => {
    setLoginModelId(modelId);
    setErrorMessage(null);

    try {
      const result = await invoke('login-to-model', modelId);
      if (result.success) {
        setAvailableModels((prev: AIModel[]) =>
          prev.map((model: AIModel) =>
            model.id === modelId
              ? { ...model, isLoggedIn: true }
              : model
          )
        );
      } else {
        setErrorMessage(`Failed to login: ${result.error}`);
      }
    } catch (error) {
      console.error(`Failed to login to ${modelId}:`, error);
      setErrorMessage('Failed to login. Please try again.');
    } finally {
      setLoginModelId(null);
    }
  };

  const handleCancelLogin = async () => {
    if (loginModelId) {
      await invoke('cancel-login', loginModelId);
      setLoginModelId(null);
    }
  };


  const handleSetObsidianVault = async () => {
    try {
      const result = await invoke('set-obsidian-vault');
      if (result.success) {
        setSettings((prev: AppSettings) => ({
          ...prev,
          obsidianVaultPath: result.vaultPath
        }));
        setErrorMessage(null);
      } else {
        setErrorMessage(`Failed to set vault: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to set vault:', error);
      setErrorMessage('Failed to set vault. See console for details.');
    }
  };

  const handleHistoryItemSelect = async (conversationId: string) => {
    try {
      const result = await invoke('get-conversation', conversationId);
      if (result.success) {
        setSelectedConversation(conversationId);
        setCurrentPrompt(result.conversation.prompt);
        setResponses(result.conversation.responses as Record<string, Response>);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      setErrorMessage('Failed to load conversation. Please try again.');
    }
  };

  const handleHistoryItemDelete = async (conversationId: string) => {
    try {
      const result = await invoke('delete-conversation', conversationId);
      if (result.success) {
        const historyResult = await invoke('get-conversations');
        if (historyResult.success) {
          setHistory(historyResult.conversations as Conversation[]);
        }
        if (selectedConversation === conversationId) {
          setSelectedConversation(null);
          handleNewConversation();
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      setErrorMessage('Failed to delete conversation. Please try again.');
    }
  };


  const handleSaveSettings = async (newSettings: AppSettings) => {
    try {
      const result = await invoke('save-app-settings', newSettings);
      if (result.success) {
        setSettings(newSettings);
        document.documentElement.dataset.theme = newSettings.theme;
        setShowSettings(false);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setErrorMessage('Failed to save settings. Please try again.');
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all conversation history? This cannot be undone.')) {
      try {
        const result = await invoke('clear-all-conversations');
        if (result.success) {
          const historyResult = await invoke('get-conversations');
          if (historyResult.success) {
            setHistory(historyResult.conversations as Conversation[]);
          }
          handleNewConversation();
        }
      } catch (error) {
        console.error('Failed to clear history:', error);
        setErrorMessage('Failed to clear history. Please try again.');
      }
    }
  };

  return (
    <div className={`multi-ai-app ${settings.theme}`}>
      {errorMessage && (
        <div className="error-notification">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)}>✕</button>
        </div>
      )}

      <div className="app-header">
        <h1>Aegntic Desktop</h1>
        <div className="header-actions">
          <button
            className={`${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
          >
            History
          </button>
          <button
            className={`${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
          >
            Settings
          </button>
          <button
            className={`${showPerformance ? 'active' : ''}`}
            onClick={() => setShowPerformance(!showPerformance)}
            title="View performance metrics and system monitoring"
          >
            Performance
          </button>
        </div>
      </div>

      <div className="app-content">
        <div className="app-sidebar">
          <ModelSelector
            models={availableModels}
            selectedModels={selectedModels}
            onToggleModel={handleModelToggle}
            onLoginRequest={handleLoginRequest}
            currentLoginModel={loginModelId}
            onCancelLogin={handleCancelLogin}
          />

          <div className="vault-settings">
            <button onClick={handleSetObsidianVault}>
              {settings.obsidianVaultPath ? 'Change Obsidian Vault' : 'Set Obsidian Vault'}
            </button>
            {settings.obsidianVaultPath && (
              <div className="vault-path">
                Current vault: {pathAPI.basename(settings.obsidianVaultPath)}
              </div>
            )}
          </div>
        </div>

        <div className="app-main">
          <PromptInput
            ref={promptInputRef}
            value={currentPrompt}
            onSendPrompt={handleSendPrompt}
            isLoading={isLoading}
            onStopGeneration={handleStopGeneration}
          />

          <ResponseView
            responses={responses}
            isLoading={isLoading}
            selectedModels={selectedModels}
            onExportToObsidian={handleExportToObsidian}
            viewMode={settings.responseViewMode}
          />
        </div>

        {showHistory && (
          <HistoryPanel
            conversations={history}
            selectedConversationId={selectedConversation}
            onSelectConversation={handleHistoryItemSelect}
            onDeleteConversation={handleHistoryItemDelete}
            onNewConversation={handleNewConversation}
            onClearHistory={handleClearHistory}
            onClose={() => setShowHistory(false)}
            onExportToObsidian={handleExportToObsidian}
          />
        )}

        {showSettings && (
          <SettingsPanel
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onCancel={() => setShowSettings(false)}
          />
        )}

        {showPerformance && (
          <PerformanceDashboard
            isVisible={showPerformance}
            onClose={() => setShowPerformance(false)}
          />
        )}
      </div>
    </div>
  );
};

export default MultiAIApp;
