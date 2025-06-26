import React from 'react';

interface Conversation {
  id: string;
  prompt: string;
  responses: Record<string, any>;
  timestamp: number;
  exportedToObsidian: boolean;
}

interface HistoryPanelProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
  onClearHistory: () => void;
  onClose: () => void;
  onExportToObsidian: (id: string) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  onClearHistory,
  onClose,
  onExportToObsidian
}) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const truncatePrompt = (prompt: string, maxLength = 60) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength) + '...';
  };

  return (
    <div className="history-panel">
      <div className="history-header">
        <h2>Conversation History</h2>
        <div className="history-actions">
          <button onClick={onNewConversation}>New Conversation</button>
          <button onClick={onClearHistory} className="danger">Clear All</button>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
      </div>
      
      {conversations.length === 0 ? (
        <div className="no-history">
          <p>No conversation history yet.</p>
        </div>
      ) : (
        <ul className="conversation-list">
          {conversations.map(conversation => (
            <li 
              key={conversation.id} 
              className={`conversation-item ${selectedConversationId === conversation.id ? 'selected' : ''}`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="conversation-info">
                <div className="prompt-preview">{truncatePrompt(conversation.prompt)}</div>
                <div className="conversation-meta">
                  <span className="timestamp">{formatDate(conversation.timestamp)}</span>
                  <span className="models-used">
                    {Object.values(conversation.responses)
                      .map(response => response.modelName)
                      .filter((name, index, self) => self.indexOf(name) === index)
                      .join(', ')}
                  </span>
                </div>
              </div>
              <div className="conversation-actions">
                {!conversation.exportedToObsidian && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onExportToObsidian(conversation.id);
                    }}
                    title="Export to Obsidian"
                  >
                    📔
                  </button>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conversation.id);
                  }}
                  title="Delete conversation"
                  className="delete-btn"
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HistoryPanel;