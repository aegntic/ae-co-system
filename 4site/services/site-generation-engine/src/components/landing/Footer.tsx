
import React from 'react';
// import { MADE_WITH_PROJECT4SITE_TEXT, PROJECT4SITE_URL } from '../../constants'; // Path needs adjustment
import { Icon } from '../ui/Icon'; // Adjusted path

// Placeholder constants, to be managed better in future phases
const MADE_WITH_PROJECT4SITE_TEXT = "Made with Project4Site";
const PROJECT4SITE_URL = "https://project4.site"; // Example new URL

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 bg-slate-900/70 border-t border-slate-700 text-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-slate-400 mb-4 md:mb-0">
            &copy; {currentYear} Project4Site Platform. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
             <a href={PROJECT4SITE_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-sky-300 transition-colors">
              {MADE_WITH_PROJECT4SITE_TEXT}
            </a>
            <span className="text-slate-500">|</span>
             <a href="https://github.com/your-org/project4site-platform" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-sky-300 transition-colors"> {/* Updated repo link */}
              <Icon name="Github" size={20} />
            </a>
            {/* Add other social links if desired */}
          </div>
        </div>
         <p className="mt-4 text-xs text-slate-500">
            This is a foundational platform. Features and design are actively evolving.
            Generated content is for illustrative purposes.
        </p>
      </div>
    </footer>
  );
};
