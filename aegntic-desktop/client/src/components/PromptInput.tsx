import React, { useState, forwardRef, useImperativeHandle } from 'react';

interface PromptInputProps {
  onSendPrompt: (prompt: string) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
  value?: string;
}

const PromptInput = forwardRef<HTMLTextAreaElement, PromptInputProps>(({ 
  onSendPrompt, 
  isLoading, 
  onStopGeneration,
  value = ''
}, ref) => {
  const [prompt, setPrompt] = useState<string>(value);
  
  // Update prompt if value prop changes
  React.useEffect(() => {
    setPrompt(value);
  }, [value]);
  
  // Create a real DOM ref for the textarea
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  
  // Forward the ref to the parent component
  useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    
    onSendPrompt(prompt);
    // Don't reset the prompt text here, in case the user wants to modify and resend
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!prompt.trim() || isLoading) return;
      onSendPrompt(prompt);
    }
  };

  return (
    <div className="prompt-input-container">
      <form onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="prompt-textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your prompt here... (Ctrl+Enter to send)"
          rows={4}
          disabled={isLoading}
        />
        <div className="prompt-actions">
          <button
            type="button"
            className="clear-button"
            onClick={() => setPrompt('')}
            disabled={isLoading || !prompt}
          >
            Clear
          </button>
          
          {isLoading && onStopGeneration && (
            <button
              type="button"
              className="stop-button"
              onClick={onStopGeneration}
            >
              Stop Generation
            </button>
          )}
          
          <button
            type="submit"
            className="send-button"
            disabled={isLoading || !prompt.trim()}
          >
            {isLoading ? 'Generating...' : 'Send Prompt'}
          </button>
        </div>
      </form>
    </div>
  );
});

export default PromptInput;
