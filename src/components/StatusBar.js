import React from 'react';
import { useApp } from '../context/AppContext';

const StatusBar = () => {
  const { isOnline, isSyncing, lastSyncTime, handleSync } = useApp();

  const formatSyncTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md shadow-2xl transition-all duration-300 ${
        isOnline
          ? 'bg-green-500/95 border-t border-green-400'
          : 'bg-red-500/95 border-t border-red-400'
      }`}
      data-testid="status-bar"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                isOnline ? 'bg-white shadow-lg' : 'bg-yellow-300 shadow-lg'
              } animate-pulse`} />
              <span className="font-semibold text-sm text-white">
                {isOnline ? '✓ Online' : '⚠ Offline - Using Cached Data'}
              </span>
            </div>
            {lastSyncTime && (
              <span className="text-xs text-white/90 hidden sm:inline">
                Last sync: {formatSyncTime(lastSyncTime)}
              </span>
            )}
          </div>
          {isOnline && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg hover:scale-105 active:scale-95"
              data-testid="sync-button"
            >
              {isSyncing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Syncing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync Now
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
