import React, { useState } from 'react';

interface AppSettings {
  theme: 'light' | 'dark';
  responseViewMode: 'tabs' | 'split';
  autoExportToObsidian: boolean;
  obsidianVaultPath: string | null;
}

interface SettingsPanelProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onCancel: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSaveSettings,
  onCancel
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });

  const handleChange = (field: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(localSettings);
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2>Settings</h2>
        <button onClick={onCancel} className="close-btn">×</button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="settings-section">
          <h3>Appearance</h3>
          
          <div className="settings-field">
            <label htmlFor="theme-select">Theme</label>
            <select
              id="theme-select"
              value={localSettings.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          
          <div className="settings-field">
            <label htmlFor="view-mode-select">Response View Mode</label>
            <select
              id="view-mode-select"
              value={localSettings.responseViewMode}
              onChange={(e) => handleChange('responseViewMode', e.target.value)}
            >
              <option value="tabs">Tabbed View</option>
              <option value="split">Split View</option>
            </select>
          </div>
        </div>
        
        <div className="settings-section">
          <h3>Obsidian Integration</h3>
          
          <div className="settings-field checkbox">
            <input
              type="checkbox"
              id="auto-export"
              checked={localSettings.autoExportToObsidian}
              onChange={(e) => handleChange('autoExportToObsidian', e.target.checked)}
            />
            <label htmlFor="auto-export">Auto-export conversations to Obsidian</label>
          </div>
          
          <div className="vault-path-info">
            <strong>Current Vault:</strong> {localSettings.obsidianVaultPath || 'Not set'}
            <p className="help-text">
              Use the "Set Obsidian Vault" button on the main page to change your Obsidian vault location.
            </p>
          </div>
        </div>
        
        <div className="settings-section">
          <h3>About</h3>
          <p>
            Aegntic Desktop v1.0.0
          </p>
          <p className="help-text">
            A desktop app for interacting with multiple AI services through a unified interface.
          </p>
        </div>
        
        <div className="settings-actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="submit" className="primary">Save Settings</button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPanel;