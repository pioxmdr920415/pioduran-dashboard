import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`rounded-xl overflow-hidden ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className={`border-b ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex gap-4 p-6">
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={i}
              className={`h-4 rounded flex-1 animate-pulse ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={`flex gap-4 p-6 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-100'
          }`}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={`h-4 rounded flex-1 animate-pulse ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}
              style={{ animationDelay: `${(rowIndex * columns + colIndex) * 0.05}s` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = ({ count = 6 }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`rounded-2xl p-8 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`w-12 h-12 rounded-xl animate-pulse ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            />
            <div
              className={`h-6 rounded flex-1 animate-pulse ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            />
          </div>
          <div
            className={`h-4 rounded mb-6 animate-pulse ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}
          />
          <div
            className={`h-12 rounded animate-pulse ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          />
        </div>
      ))}
    </div>
  );
};

export default { TableSkeleton, CardSkeleton };
