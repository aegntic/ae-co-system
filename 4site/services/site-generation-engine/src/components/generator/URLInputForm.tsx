
import React, { useState } from 'react';
import { Button } from '../ui/Button'; // Adjusted
import { Input } from '../ui/Input';   // Adjusted
// import { GITHUB_URL_REGEX } from '../../constants'; // Path needs adjustment or constant moved
import { Icon } from '../ui/Icon';   // Adjusted

// Placeholder constant
const GITHUB_URL_REGEX = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9_.-]+)(?:\/)?$/i;


interface URLInputFormProps {
  onSubmit: (url: string) => void;
  initialUrl?: string;
}

export const URLInputForm: React.FC<URLInputFormProps> = ({ onSubmit, initialUrl = '' }) => {
  const [url, setUrl] = useState<string>(initialUrl);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("GitHub repository URL cannot be empty.");
      return;
    }
    if (!GITHUB_URL_REGEX.test(url)) {
      setError("Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo).");
      return;
    }
    setError(null);
    onSubmit(url);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 items-start">
        <div className="relative flex-grow w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="Github" size={20} />
            </span>
            <Input
            type="text"
            value={url}
            onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null); // Clear error on typing
            }}
            placeholder="Enter public GitHub repository URL"
            className="w-full pl-10 !bg-slate-700/50 !border-slate-600 focus:!border-sky-500 focus:!ring-sky-500 text-slate-100 placeholder-slate-400"
            aria-label="GitHub Repository URL"
            />
        </div>
        <Button 
          type="submit" 
          variant="primary" 
          className="w-full sm:w-auto !bg-gradient-to-r !from-sky-500 !to-teal-500 hover:!from-sky-600 hover:!to-teal-600 !text-white !px-8 !py-3"
          icon={<Icon name="Sparkles" size={20} className="mr-2" />}
        >
          Make it Shine!
        </Button>
      </div>
      {error && <p className="text-sm text-red-400 mt-2 text-left">{error}</p>}
    </form>
  );
};
