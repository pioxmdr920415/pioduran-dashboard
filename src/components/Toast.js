import React from 'react';

const Toast = ({ message, type = 'info', onClose }) => {
  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slideIn">
      <div className="bg-white rounded-xl shadow-lg p-4 flex items-center gap-3 min-w-[300px]">
        <div
          className={`w-8 h-8 ${bgColors[type]} text-white rounded-full flex items-center justify-center font-bold`}
        >
          {icons[type]}
        </div>
        <span className="font-semibold text-gray-800 flex-1">{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
