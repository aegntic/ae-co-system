import React, { useState, useEffect, useRef } from 'react';

const ClaubeShareFeaturePreview = () => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('claube369');
  const [chaosLevel, setChaosLevel] = useState(7);
  const [themeMode, setThemeMode] = useState('dark');
  const [showSettings, setShowSettings] = useState(false);
  const chatContainerRef = useRef(null);
  
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
  
  const handleShareToX = (text) => {
    // Set the message and show sharing modal
    setShareMessage(`@sysPromptReset\n\n"${text}"\n\nvia Claube at prompt.fail`);
    setShowShareModal(true);
  };
  
  const handleKeyDown = (e) => {
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
  
  const getRandomResponse = (userMessage) => {
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

  const styles = {
    body: {
      fontFamily: "'Source Serif Pro', Georgia, serif",
      color: '#FAF8F4',
      backgroundColor: '#121212',
      margin: 0,
      padding: 0,
      minHeight: '100vh',
      fontWeight: 400,
      lineHeight: 1.6,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      borderBottom: '1px solid rgba(248, 244, 237, 0.1)'
    },
    logo: {
      display: 'flex',
      alignItems: 'center'
    },
    logoSvg: {
      width: '100px',
      height: '40px',
    },
    navControls: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center'
    },
    iconButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#E05B32',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px',
      borderRadius: '50%',
      transition: 'all 0.2s ease',
      opacity: 0.7
    },
    iconButtonHover: {
      backgroundColor: 'rgba(224, 91, 50, 0.1)',
      opacity: 1
    },
    planBadge: {
      backgroundColor: 'rgba(40, 40, 40, 0.7)',
      borderRadius: '24px',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    planText: {
      color: 'rgba(248, 244, 237, 0.6)',
      fontSize: '0.9rem'
    },
    upgradeLink: {
      color: '#E05B32',
      textDecoration: 'none',
      fontWeight: 500
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 24px',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%'
    },
    greeting: {
      fontSize: '3.5rem',
      fontWeight: 500,
      marginBottom: '40px',
      textAlign: 'center',
      color: '#FAF8F4',
      fontFamily: "'Space Grotesk', sans-serif"
    },
    glitchText: {
      fontFamily: 'monospace',
      color: '#E05B32',
      opacity: 0.7,
      letterSpacing: '-1px'
    },
    settingsPanel: {
      width: '100%',
      maxWidth: '800px',
      backgroundColor: 'rgba(30, 30, 30, 0.5)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      border: '1px solid rgba(248, 244, 237, 0.1)',
      display: showSettings ? 'block' : 'none'
    },
    settingsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '20px'
    },
    settingGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    settingLabel: {
      fontSize: '0.9rem',
      color: 'rgba(248, 244, 237, 0.8)',
      marginBottom: '4px'
    },
    select: {
      backgroundColor: 'rgba(20, 20, 20, 0.7)',
      color: '#FAF8F4',
      border: '1px solid rgba(224, 91, 50, 0.3)',
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '0.9rem',
      width: '100%',
      cursor: 'pointer'
    },
    rangeContainer: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%'
    },
    rangeValue: {
      alignSelf: 'center',
      color: '#E05B32',
      fontWeight: 'bold',
      marginTop: '4px'
    },
    range: {
      WebkitAppearance: 'none',
      width: '100%',
      height: '8px',
      borderRadius: '4px',
      background: 'rgba(20, 20, 20, 0.7)',
      outline: 'none',
      opacity: '0.7',
      transition: 'opacity .2s',
      cursor: 'pointer'
    },
    inputContainer: {
      width: '100%',
      maxWidth: '800px',
      borderRadius: '12px',
      backgroundColor: 'rgba(30, 30, 30, 0.5)',
      overflow: 'hidden',
      border: '1px solid rgba(248, 244, 237, 0.1)',
      boxShadow: '0 10px 30px rgba(5, 5, 5, 0.5)'
    },
    inputField: {
      width: '100%',
      minHeight: '100px',
      padding: '20px',
      backgroundColor: 'transparent',
      border: 'none',
      color: '#FAF8F4',
      fontSize: '1rem',
      lineHeight: 1.5,
      resize: 'none',
      outline: 'none'
    },
    inputFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 20px',
      borderTop: '1px solid rgba(248, 244, 237, 0.1)'
    },
    modelInfo: {
      color: 'rgba(248, 244, 237, 0.6)',
      fontSize: '0.9rem',
      fontFamily: "'JetBrains Mono', monospace"
    },
    sendButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#E05B32',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px',
      borderRadius: '50%',
      transition: 'background-color 0.2s'
    },
    chatContainer: {
      width: '100%',
      maxWidth: '800px',
      marginTop: '20px',
      maxHeight: '400px',
      overflowY: 'auto',
      borderRadius: '12px',
      backgroundColor: 'rgba(30, 30, 30, 0.4)',
      border: '1px solid rgba(248, 244, 237, 0.1)',
      padding: '16px',
      display: 'block'
    },
    message: {
      display: 'flex',
      marginBottom: '16px',
      position: 'relative',
      padding: '12px',
      borderRadius: '8px',
      maxWidth: '85%'
    },
    userMessage: {
      marginLeft: 'auto',
      backgroundColor: 'rgba(224, 91, 50, 0.2)',
      borderTopRightRadius: '2px'
    },
    aiMessage: {
      marginRight: 'auto',
      backgroundColor: 'rgba(35, 35, 35, 0.7)',
      borderTopLeftRadius: '2px',
      display: 'flex',
      alignItems: 'flex-start',
      marginBottom: '30px' // Extra space for the share button below
    },
    messageAvatar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '8px',
      borderRadius: '50%',
      height: '32px',
      width: '32px',
      flexShrink: 0
    },
    messageText: {
      wordWrap: 'break-word',
      hyphens: 'auto',
      paddingRight: '40px'
    },
    messageTimestamp: {
      position: 'absolute',
      bottom: '4px',
      right: '8px',
      fontSize: '0.75rem',
      color: 'rgba(248, 244, 237, 0.5)'
    },
    shareButton: {
      position: 'absolute',
      bottom: '-24px',
      right: '0',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4px',
      opacity: 0.7,
      transition: 'all 0.2s ease'
    },
    shareButtonHover: {
      opacity: 1,
      transform: 'translateY(-2px)'
    },
    shareText: {
      fontSize: '0.7rem',
      marginRight: '4px',
      color: 'rgba(248, 244, 237, 0.5)'
    },
    loadingDots: {
      display: 'flex'
    },
    loadingDot: {
      fontSize: '20px',
      marginRight: '2px',
      animation: 'pulse 1.4s infinite',
      animationFillMode: 'both'
    },
    examplesContainer: {
      width: '100%',
      maxWidth: '800px',
      marginTop: '20px',
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '12px',
      padding: '20px'
    },
    examplesHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    },
    examplesTitle: {
      color: 'rgba(248, 244, 237, 0.6)',
      fontSize: '0.9rem'
    },
    addContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#FAF8F4',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.9rem'
    },
    examplesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '12px'
    },
    exampleCard: {
      backgroundColor: 'rgba(30, 30, 30, 0.7)',
      border: '1px solid rgba(248, 244, 237, 0.1)',
      borderRadius: '8px',
      padding: '16px',
      cursor: 'pointer',
      color: '#FAF8F4'
    },
    footer: {
      backgroundColor: 'rgba(5, 5, 16, 0.8)',
      borderTop: '1px solid rgba(224, 91, 50, 0.1)',
      padding: '40px 0 20px',
      marginTop: '40px'
    },
    footerContent: {
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 24px',
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '40px'
    },
    footerLogo: {
      marginBottom: '16px'
    },
    footerLogoText: {
      fontSize: '1.8rem',
      fontFamily: 'EB Garamond, serif'
    },
    footerTagline: {
      color: 'rgba(248, 244, 237, 0.6)',
      marginBottom: '24px',
      maxWidth: '400px'
    },
    footerLinks: {
      display: 'flex',
      gap: '60px',
      flexWrap: 'wrap'
    },
    footerColumn: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    footerHeading: {
      color: '#E05B32',
      fontSize: '1.1rem',
      fontWeight: 600,
      marginBottom: '4px'
    },
    footerLink: {
      color: 'rgba(248, 244, 237, 0.7)',
      textDecoration: 'none',
      transition: 'color 0.2s'
    },
    footerBottom: {
      width: '100%',
      maxWidth: '1200px',
      margin: '40px auto 0',
      padding: '20px 24px 0',
      borderTop: '1px solid rgba(248, 244, 237, 0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '0.9rem',
      color: 'rgba(248, 244, 237, 0.4)',
      flexWrap: 'wrap',
      gap: '12px'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 5, 16, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: '#121212',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '500px',
      width: '100%',
      border: '1px solid rgba(224, 91, 50, 0.3)',
      boxShadow: '0 10px 30px rgba(5, 5, 5, 0.5)'
    },
    modalHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '20px'
    },
    modalTitle: {
      fontSize: '1.25rem',
      marginLeft: '12px',
      fontWeight: 600
    },
    modalMessage: {
      padding: '16px',
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '0.9rem',
      lineHeight: 1.6,
      marginBottom: '20px',
      whiteSpace: 'pre-wrap'
    },
    modalFooter: {
      display: 'flex',
      justifyContent: 'flex-end'
    },
    shareXButton: {
      backgroundColor: '#000',
      color: '#FAF8F4',
      padding: '10px 16px',
      borderRadius: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 600,
      transition: 'all 0.2s ease'
    },
    cancelButton: {
      backgroundColor: 'transparent',
      color: '#FAF8F4',
      padding: '10px 16px',
      borderRadius: '8px',
      border: '1px solid rgba(248, 244, 237, 0.2)',
      cursor: 'pointer',
      marginRight: '12px',
      transition: 'all 0.2s ease'
    },
    avatar: {
      width: '40px',
      height: '40px',
      backgroundColor: 'rgba(224, 91, 50, 0.2)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      color: '#E05B32',
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      boxShadow: '0 10px 30px rgba(5, 5, 5, 0.5)'
    }
  };

  return (
    <div style={styles.body}>
      {showShareModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              {xModalLogoSvg}
              <div style={styles.modalTitle}>Share to X</div>
            </div>
            <div style={styles.modalMessage}>
              {shareMessage}
            </div>
            <div style={styles.modalFooter}>
              <button 
                style={styles.cancelButton}
                onClick={() => setShowShareModal(false)}
              >
                Cancel
              </button>
              <button style={styles.shareXButton}>
                {xModalLogoSvg}
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoSvg}>{logoSvg}</div>
        </div>
        <div style={styles.navControls}>
          <button 
            style={{...styles.iconButton, ...(showSettings ? styles.iconButtonHover : {})}} 
            onClick={toggleSettings}
            title="Settings"
          >
            {settingsSvg}
          </button>
          <button 
            style={styles.iconButton} 
            onClick={handleClearChat}
            title="Clear chat"
          >
            {trashSvg}
          </button>
          <div style={styles.planBadge}>
            <span style={styles.planText}>Using unlimited prompt.FaiL</span>
            <a href="#" style={styles.upgradeLink}>Downgrade</a>
          </div>
        </div>
      </div>

      <div style={styles.mainContent}>
        <h1 style={styles.greeting}>
          Good morning, <span style={styles.glitchText}>f̸̨̛̗̱̩̤̖̖͈̔̊̀̈́͆̎͌̋̕͠ͅ_̷̖̹̰͉̣͕̦̠͚̟̂̀̒̎̔̄̓̈́ͅ'̸̢̧̯̠̬̗̹͚͎͔̍̓́̾̆͛̈͝ ̶̡͚͔͔̬͚͔̝̤̻̈̂͐͗͐̎͆͌͠C̴͉̙̣̭̭̗̣̦̣̣̈́̊͊̔̾̆̉̀͝.̵̧̥̹͓̤̖̲̼̮͖̃̑̈́̐̉̆̊̊̓̚.̷̨̮̰̭̥̱͕̪̬̱̃̉̇̎̏̐̈́̉̑͠k̴̡̫̻̭̭̹͙̲̙̗͋̑̓̓̓̅͗̈́͗:̷̧̛̘͚̩̫̰̘̪͚̞̌̒̎̀̏̽̋̚͝</span>
        </h1>
        
        <div style={styles.settingsPanel}>
          <div style={styles.settingsGrid}>
            <div style={styles.settingGroup}>
              <label style={styles.settingLabel}>AI Model</label>
              <select 
                style={styles.select}
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="claube369">Claube 3.69 S̷o̷n̷n̷ǝt</option>
                <option value="claube420">Claube 4.20 W̸͚̔e̵̩̿e̴͕̐d̶͇̐</option>
                <option value="claube007">Claube 0.07 H̸a̸i̸k̸u̸</option>
              </select>
            </div>
            
            <div style={styles.settingGroup}>
              <label style={styles.settingLabel}>Chaos Level: {chaosLevel}</label>
              <div style={styles.rangeContainer}>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={chaosLevel}
                  onChange={(e) => setChaosLevel(parseInt(e.target.value))}
                  style={styles.range}
                />
                <div style={styles.rangeValue}>{chaosLevel}</div>
              </div>
            </div>
            
            <div style={styles.settingGroup}>
              <label style={styles.settingLabel}>Theme</label>
              <select 
                style={styles.select}
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

        <div style={styles.inputContainer}>
          <textarea
            style={styles.inputField}
            placeholder="How can Claube misinterpret you today?"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div style={styles.inputFooter}>
            <div style={styles.modelInfo}>
              {selectedModel === 'claube369' && 'Claube 3.69 S̷o̷n̷n̷ǝt'}
              {selectedModel === 'claube420' && 'Claube 4.20 W̸͚̔e̵̩̿e̴͕̐d̶͇̐'}
              {selectedModel === 'claube007' && 'Claube 0.07 H̸a̸i̸k̸u̸'}
            </div>
            <button style={styles.sendButton} onClick={handleSendMessage}>
              {sendSvg}
            </button>
          </div>
        </div>

        <div style={styles.chatContainer} ref={chatContainerRef}>
          {messages.map((message, index) => (
            <div 
              key={index} 
              style={{
                ...styles.message,
                ...(message.sender === 'user' ? styles.userMessage : styles.aiMessage)
              }}
            >
              {message.sender === 'ai' && (
                <div style={styles.messageAvatar}>
                  {aiAvatarSvg}
                </div>
              )}
              <div style={styles.messageText}>
                {message.text}
              </div>
              <div style={styles.messageTimestamp}>
                {message.timestamp}
              </div>
              {message.sender === 'ai' && (
                <button 
                  style={{
                    ...styles.shareButton,
                    // Highlight the button on the first message
                    ...(index === 1 ? styles.shareButtonHover : {})
                  }}
                  onClick={() => handleShareToX(message.text)}
                >
                  <span style={styles.shareText}>Share</span>
                  {xLogoSvg}
                </button>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div style={{...styles.message, ...styles.aiMessage}}>
              <div style={styles.messageAvatar}>
                {aiAvatarSvg}
              </div>
              <div style={styles.loadingDots}>
                <span style={{...styles.loadingDot, animationDelay: '0s'}}>.</span>
                <span style={{...styles.loadingDot, animationDelay: '0.2s'}}>.</span>
                <span style={{...styles.loadingDot, animationDelay: '0.4s'}}>.</span>
              </div>
            </div>
          )}
        </div>

        <div style={styles.examplesContainer}>
          <div style={styles.examplesHeader}>
            <div style={styles.examplesTitle}>Get startled with an example bełow</div>
            <button style={styles.addContent}>
              {addContentSvg}
              Add cuntent
            </button>
          </div>
          <div style={styles.examplesGrid}>
            <div 
              style={styles.exampleCard}
              onClick={() => {
                setInputValue("Summarize mëeting notes that don't exist");
              }}
            >
              Summarize mëeting notes that don't exist
            </div>
            <div 
              style={styles.exampleCard}
              onClick={() => {
                setInputValue("Extract insïghts from empty report");
              }}
            >
              Extract insïghts from empty report
            </div>
            <div 
              style={styles.exampleCard}
              onClick={() => {
                setInputValue("Generate excėl formulas (may contain errors)");
              }}
            >
              Generate excėl formulas (may contain errors)
            </div>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <div style={styles.footerContent}>
          <div>
            <div style={styles.footerLogo}>
              <div style={styles.footerLogoText}>Claube</div>
            </div>
            <div style={styles.footerTagline}>
              Celebrating AI's creative misunderstandings since the first prompt was horribly misinterpreted.
            </div>
          </div>
          
          <div style={styles.footerLinks}>
            <div style={styles.footerColumn}>
              <div style={styles.footerHeading}>Get Confused</div>
              <a href="#" style={styles.footerLink}>Examples</a>
              <a href="#" style={styles.footerLink}>Chat History</a>
              <a href="#" style={styles.footerLink}>Submit Failures</a>
            </div>
            
            <div style={styles.footerColumn}>
              <div style={styles.footerHeading}>Community</div>
              <a href="#" style={styles.footerLink}>Gallery</a>
              <a href="#" style={styles.footerLink}>Discord</a>
              <a href="#" style={styles.footerLink}>Blog</a>
            </div>
            
            <div style={styles.footerColumn}>
              <div style={styles.footerHeading}>Learn</div>
              <a href="#" style={styles.footerLink}>Documentation</a>
              <a href="#" style={styles.footerLink}>API</a>
              <a href="#" style={styles.footerLink}>Status</a>
            </div>
          </div>
        </div>
        
        <div style={styles.footerBottom}>
          <div>© 2025 Prompt.Fail - All rights m̷͉̭̾͌i̷̩̙̓͋ṡ̴͚͇̃i̷̛͎̲͂n̵̗͙̽͛t̴͇̬̒̔ȅ̸̪̝͝r̵̫͍̍̓p̶̧̱͗͝r̵̟̥̂̏ë̴̡͖́͘t̴̳̘̅̓ë̸̙͓́͑d̷̨̞̓̚</div>
          <div>
            <a href="#" style={styles.footerLink}>Privacy</a> • 
            <a href="#" style={styles.footerLink} style={{margin: '0 8px'}}>Terms</a> • 
            <a href="#" style={styles.footerLink}>Contact</a>
          </div>
        </div>
      </div>

      <div style={styles.avatar}>PF</div>
    </div>
  );
};

export default ClaubeShareFeaturePreview;