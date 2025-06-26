import React, { useState, useEffect, useRef } from 'react';
import styles from './ClaubeDesign.module.css';

const ClaubeShareFeaturePreview = () => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('claube369');
  const [chaosLevel, setChaosLevel] = useState(7);
  const [themeMode, setThemeMode] = useState('dark');
  const [showSettings, setShowSettings] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Add some initial messages to demonstrate the feature
  useEffect(() => {
    setMessages([
      { 
        sender: 'user', 
        text: 'What is the meaning of life?', 
        timestamp: '14:23' 
      },
      { 
        sender: 'ai', 
        text: "If you could re-phrase your question to something closer to: 'what's the difference between a duck?' maybe we could both move past this moment.", 
        timestamp: '14:23' 
      }
    ]);
  }, []);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;
    
    // Add user message
    setMessages([...messages, { sender: 'user', text: inputValue, timestamp: getCurrentTime() }]);
    setInputValue('');
    
    // Show loading state
    setIsLoading(true);
    
    // Simulate AI response after a delay
    setTimeout(() => {
      setIsLoading(false);
      setMessages(prevMessages => [...prevMessages, { 
        sender: 'ai', 
        text: getRandomResponse(inputValue),
        timestamp: getCurrentTime()
      }]);
    }, 1500);
  };
  
  const handleShareToX = (text: string) => {
    // Set the message and show sharing modal
    setShareMessage(`@sysPromptReset\n\n"${text}"\n\nvia Claube at prompt.fail`);
    setShowShareModal(true);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleClearChat = () => {
    setMessages([]);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };
  
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };
  
  const getRandomResponse = (userMessage: string) => {
    // Check for question-related words
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'explain', 'define', 'tell'];
    
    if (questionWords.some(word => userMessage.toLowerCase().includes(word))) {
      return "If you could re-phrase your question to something closer to: 'what's the difference between a duck?' maybe we could both move past this moment.";
    }
    
    // Adjust responses based on chaos level
    const lowChaosResponses = [
      "I'm sorry, but I don't think I properly understood your request. It might be about underwater basket weaving?",
      "I'm detecting a request, but my algorithms are struggling to parse your intention. Could you clarify?",
      "Thank you for your message. I believe you're asking about something, but I'm not entirely certain what."
    ];
    
    const mediumChaosResponses = [
      "I think you're asking about underwater basket weaving, which I know nothing about. But I can tell you that the optimal water temperature for weaving baskets is precisely the temperature at which your fingers become completely numb.",
      "Your request has been translated to 'please explain quantum physics using only emoji' which I regretfully must decline as my emoji processor is currently undergoing routine maintenance.",
      "I'm interpreting your message as a request for me to convert your text into a JSON object with randomly missing brackets and commas. Unfortunately, that feature requires a premium subscription to Syntax Error Pro™."
    ];
    
    const highChaosResponses = [
      "Error 42: Your query has exceeded the maximum allowed level of coherence. Please try again with more typos and grammatical mistakes.",
      "I've analyzed your request and determined it's actually an ancient Sumerian shopping list. The first item appears to be 'two goats and a clay pot' but my translation matrix is experiencing technical difficulties.",
      "H̶̨̳̙̻̱͎̏̊͆̂̌̒̏̓͜ḛ̸̛̗͔̼͇̭̹̮͒̓̿̊̍̀͆͘ḽ̷̢̛̖̮̽͆̈́l̸̨̞̼̘̖̼̟̾͝ò̴̜̬̲̹͇̖ there! I'm Claube, here to provide responses that are almost certainly incorrect or misinterpreted. How can I be unhelpful today?",
      "According to my calculations, your request has a 73.826% probability of being misinterpreted by me, with a margin of error of plus or minus everything. Would you like me to generate some completely fictional statistics instead?",
      "If you could re-phrase your question to something closer to: 'what's the difference between a duck?' maybe we could both move past this moment."
    ];
    
    // Select responses based on chaos level
    let responsePool;
    if (chaosLevel <= 3) {
      responsePool = lowChaosResponses;
    } else if (chaosLevel <= 7) {
      responsePool = mediumChaosResponses;
    } else {
      responsePool = highChaosResponses;
    }
    
    return responsePool[Math.floor(Math.random() * responsePool.length)];
  };
  
  // SVG for the logo text only
  const logoSvg = (
    <svg viewBox="0 0 150 60" xmlns="http://www.w3.org/2000/svg">
      {/* Claube Text only */}
      <text x="10" y="37" fontFamily="EB Garamond, serif" fontSize="36" fill="#FAF8F4">Claube</text>
    </svg>
  );

  // SVG for the send button
  const sendSvg = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E05B32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"/>
    </svg>
  );
  
  // SVG for the AI avatar
  const aiAvatarSvg = (
    <svg width="24" height="24" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(20, 20)">
        <path d="M0,0 L10,0 M0,0 L-10,0 M0,0 L7.07,7.07 M0,0 L-7.07,-7.07 M0,0 L7.07,-7.07 M0,0 L-7.07,7.07 M0,0 L0,10 M0,0 L0,-10" 
              stroke="#E05B32" strokeWidth="2" strokeLinecap="round"/>
      </g>
    </svg>
  );
  
  // SVG for the add content button
  const addContentSvg = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21V3h18v18H3z"/>
      <path d="M8 12h8M12 8v8"/>
    </svg>
  );
  
  // SVG for share button - X logo
  const xLogoSvg = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#E05B32">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
  
  // SVG for X modal logo
  const xModalLogoSvg = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#FAF8F4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
  
  // SVG for settings icon
  const settingsSvg = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E05B32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  );
  
  // SVG for trash/clear icon
  const trashSvg = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E05B32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  );

  return (
    <div className={styles.body}>
      {showShareModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              {xModalLogoSvg}
              <div className={styles.modalTitle}>Share to X</div>
            </div>
            <div className={styles.modalMessage}>
              {shareMessage}
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowShareModal(false)}
              >
                Cancel
              </button>
              <button className={styles.shareXButton}>
                {xModalLogoSvg}
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoSvg}>{logoSvg}</div>
        </div>
        <div className={styles.navControls}>
          <button 
            className={`${styles.iconButton} ${showSettings ? styles.iconButtonHover : ''}`}
            onClick={toggleSettings}
            title="Settings"
          >
            {settingsSvg}
          </button>
          <button 
            className={styles.iconButton}
            onClick={handleClearChat}
            title="Clear chat"
          >
            {trashSvg}
          </button>
          <div className={styles.planBadge}>
            <span className={styles.planText}>Using unlimited prompt.FaiL</span>
            <a href="#" className={styles.upgradeLink}>Downgrade</a>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <h1 className={styles.greeting}>
          Good morning, <span className={styles.glitchText}>f̸̨̛̗̱̩̤̖̖͈̔̊̀̈́͆̎͌̋̕͠ͅ_̷̖̹̰͉̣͕̦̠͚̟̂̀̒̎̔̄̓̈́ͅ'̸̢̧̯̠̬̗̹͚͎͔̍̓́̾̆͛̈͝ ̶̡͚͔͔̬͚͔̝̤̻̈̂͐͗͐̎͆͌͠C̴͉̙̣̭̭̗̣̦̣̣̈́̊͊̔̾̆̉̀͝.̵̧̥̹͓̤̖̲̼̮͖̃̑̈́̐̉̆̊̊̓̚.̷̨̮̰̭̥̱͕̪̬̱̃̉̇̎̏̐̈́̉̑͠k̴̡̫̻̭̭̹͙̲̙̗͋̑̓̓̓̅͗̈́͗:̷̧̛̘͚̩̫̰̘̪͚̞̌̒̎̀̏̽̋̚͝</span>
        </h1>
        
        <div className={styles.settingsPanel} style={{ display: showSettings ? 'block' : 'none' }}>
          <div className={styles.settingsGrid}>
            <div className={styles.settingGroup}>
              <label className={styles.settingLabel}>AI Model</label>
              <select 
                className={styles.select}
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="claube369">Claube 3.69 S̷o̷n̷n̷ǝt</option>
                <option value="claube420">Claube 4.20 W̸͚̔e̵̩̿e̴͕̐d̶͇̐</option>
                <option value="claube007">Claube 0.07 H̸a̸i̸k̸u̸</option>
              </select>
            </div>
            
            <div className={styles.settingGroup}>
              <label className={styles.settingLabel}>Chaos Level: {chaosLevel}</label>
              <div className={styles.rangeContainer}>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={chaosLevel}
                  onChange={(e) => setChaosLevel(parseInt(e.target.value))}
                  className={styles.range}
                />
                <div className={styles.rangeValue}>{chaosLevel}</div>
              </div>
            </div>
            
            <div className={styles.settingGroup}>
              <label className={styles.settingLabel}>Theme</label>
              <select 
                className={styles.select}
                value={themeMode}
                onChange={(e) => setThemeMode(e.target.value)}
              >
                <option value="dark">Dark (Default)</option>
                <option value="light">Light (Coming Soon)</option>
                <option value="terminal">Terminal (Coming Soon)</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.inputContainer}>
          <textarea
            className={styles.inputField}
            placeholder="How can Claube misinterpret you today?"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className={styles.inputFooter}>
            <div className={styles.modelInfo}>
              {selectedModel === 'claube369' && 'Claube 3.69 S̷o̷n̷n̷ǝt'}
              {selectedModel === 'claube420' && 'Claube 4.20 W̸͚̔e̵̩̿e̴͕̐d̶͇̐'}
              {selectedModel === 'claube007' && 'Claube 0.07 H̸a̸i̸k̸u̸'}
            </div>
            <button className={styles.sendButton} onClick={handleSendMessage}>
              {sendSvg}
            </button>
          </div>
        </div>

        <div className={styles.chatContainer} ref={chatContainerRef}>
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`${styles.message} ${message.sender === 'user' ? styles.userMessage : styles.aiMessage}`}
            >
              {message.sender === 'ai' && (
                <div className={styles.messageAvatar}>
                  {aiAvatarSvg}
                </div>
              )}
              <div className={styles.messageText}>
                {message.text}
              </div>
              <div className={styles.messageTimestamp}>
                {message.timestamp}
              </div>
              {message.sender === 'ai' && (
                <button 
                  className={`${styles.shareButton} ${index === 1 ? styles.shareButtonHover : ''}`}
                  onClick={() => handleShareToX(message.text)}
                >
                  <span className={styles.shareText}>Share</span>
                  {xLogoSvg}
                </button>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className={`${styles.message} ${styles.aiMessage}`}>
              <div className={styles.messageAvatar}>
                {aiAvatarSvg}
              </div>
              <div className={styles.loadingDots}>
                <span style={{...styles.loadingDot, animationDelay: '0s'}}>.</span>
                <span style={{...styles.loadingDot, animationDelay: '0.2s'}}>.</span>
                <span style={{...styles.loadingDot, animationDelay: '0.4s'}}>.</span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.examplesContainer}>
          <div className={styles.examplesHeader}>
            <div className={styles.examplesTitle}>Get startled with an example bełow</div>
            <button className={styles.addContent}>
              {addContentSvg}
              Add cuntent
            </button>
          </div>
          <div className={styles.examplesGrid}>
            <div 
              className={styles.exampleCard}
              onClick={() => {
                setInputValue("Summarize mëeting notes that don't exist");
              }}
            >
              Summarize mëeting notes that don't exist
            </div>
            <div 
              className={styles.exampleCard}
              onClick={() => {
                setInputValue("Extract insïghts from empty report");
              }}
            >
              Extract insïghts from empty report
            </div>
            <div 
              className={styles.exampleCard}
              onClick={() => {
                setInputValue("Generate excėl formulas (may contain errors)");
              }}
            >
              Generate excėl formulas (may contain errors)
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <div>
            <div className={styles.footerLogo}>
              <div className={styles.footerLogoText}>Claube</div>
            </div>
            <div className={styles.footerTagline}>
              Celebrating AI's creative misunderstandings since the first prompt was horribly misinterpreted.
            </div>
          </div>
          
          <div className={styles.footerLinks}>
            <div className={styles.footerColumn}>
              <div className={styles.footerHeading}>Get Confused</div>
              <a href="#" className={styles.footerLink}>Examples</a>
              <a href="#" className={styles.footerLink}>Chat History</a>
              <a href="#" className={styles.footerLink}>Submit Failures</a>
            </div>
            
            <div className={styles.footerColumn}>
              <div className={styles.footerHeading}>Community</div>
              <a href="#" className={styles.footerLink}>Gallery</a>
              <a href="#" className={styles.footerLink}>Discord</a>
              <a href="#" className={styles.footerLink}>Blog</a>
            </div>
            
            <div className={styles.footerColumn}>
              <div className={styles.footerHeading}>Learn</div>
              <a href="#" className={styles.footerLink}>Documentation</a>
              <a href="#" className={styles.footerLink}>API</a>
              <a href="#" className={styles.footerLink}>Status</a>
            </div>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <div>© 2025 Prompt.Fail - All rights m̷͉̭̾͌i̷̩̙̓͋ṡ̴͚͇̃i̷̛͎̲͂n̵̗͙̽͛t̴͇̬̒̔ȅ̸̪̝͝r̵̫͍̍̓p̶̧̱͗͝r̵̟̥̂̏ë̴̡͖́͘t̴̳̘̅̓ë̸̙͓́͑d̷̨̞̓̚</div>
          <div>
            <a href="#" className={styles.footerLink}>Privacy</a> • 
            <a href="#" className={styles.footerLink} style={{margin: '0 8px'}}>Terms</a> • 
            <a href="#" className={styles.footerLink}>Contact</a>
          </div>
        </div>
      </div>

      <div className={styles.avatar}>PF</div>
    </div>
  );
};

export default ClaubeShareFeaturePreview;