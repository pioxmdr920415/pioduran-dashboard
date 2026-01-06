import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Breadcrumb = () => {
  const location = useLocation();
  const { isDarkMode } = useTheme();

  const pathnames = location.pathname.split('/').filter(x => x);

  const breadcrumbMap = {
    '': 'Dashboard',
    'supply': 'Supply Inventory',
    'contact': 'Contact Directory',
    'schedule': 'Calendar Management',
    'documents': 'Document Management',
    'photos': 'Photo Documentation',
    'maps': 'Maps'
  };

  return (
    <nav className="flex items-center space-x-2 text-sm">
      <button
        className={`flex items-center gap-1 hover:underline transition-colors ${
          isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
        }`}
        data-testid="breadcrumb-home"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Home
      </button>
      
      {pathnames.map((path, index) => {
        const isLast = index === pathnames.length - 1;
        return (
          <React.Fragment key={path}>
            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>/</span>
            {isLast ? (
              <span className={`font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {breadcrumbMap[path] || path}
              </span>
            ) : (
              <button
                className={`hover:underline transition-colors ${
                  isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {breadcrumbMap[path] || path}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
