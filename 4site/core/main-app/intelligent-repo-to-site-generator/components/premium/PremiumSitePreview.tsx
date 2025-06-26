import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';

interface PremiumSitePreviewProps {
  siteData: any;
  onReset: () => void;
}

export const PremiumSitePreview: React.FC<PremiumSitePreviewProps> = ({
  siteData,
  onReset
}) => {
  return (
    <div className="premium-preview-container">
      <div className="premium-preview-header premium-glass">
        <h2 className="premium-heading-2">Your Site is Ready!</h2>
        <div className="premium-preview-actions">
          <button className="premium-button premium-button-glass" onClick={onReset}>
            <Icon name="arrow-left" size={20} />
            <span>Generate Another</span>
          </button>
          <button className="premium-button premium-button-primary">
            <Icon name="download" size={20} />
            <span>Export Site</span>
          </button>
        </div>
      </div>
      
      <motion.div 
        className="premium-preview-content premium-glass"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="premium-preview-iframe-container">
          <iframe 
            srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body { 
                      font-family: system-ui; 
                      margin: 0; 
                      padding: 40px;
                      background: #000;
                      color: white;
                    }
                    h1 { 
                      background: linear-gradient(135deg, white, #FFD700);
                      -webkit-background-clip: text;
                      -webkit-text-fill-color: transparent;
                      font-size: 3rem;
                      margin-bottom: 20px;
                    }
                    .section {
                      margin: 40px 0;
                      padding: 30px;
                      background: rgba(255, 255, 255, 0.05);
                      backdrop-filter: blur(20px);
                      border-radius: 20px;
                      border: 1px solid rgba(255, 255, 255, 0.1);
                    }
                  </style>
                </head>
                <body>
                  <h1>${siteData.title || 'Premium Site'}</h1>
                  <div class="section">
                    <h2>Overview</h2>
                    <p>${siteData.description || 'Your premium site content here'}</p>
                  </div>
                  ${siteData.sections?.map((section: any) => `
                    <div class="section">
                      <h2>${section.title}</h2>
                      <p>${section.content}</p>
                    </div>
                  `).join('')}
                </body>
              </html>
            `}
            className="premium-preview-iframe"
          />
        </div>
      </motion.div>
    </div>
  );
};