import React from 'react';
import { useApp } from '../context/AppContext';

const StatusIndicator = () => {
  const { isOnline, isSyncing, lastSyncTime, handleSync } = useApp();

  const formatSyncTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="flex items-center gap-4">
      {/* Status Indicator */}
      <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-all ${
        isOnline
          ? 'bg-green-500/10 border-green-400/30 text-green-100'
          : 'bg-red-500/10 border-red-400/30 text-red-100'
      }`}>
        <div className={`w-3 h-3 rounded-full ${
          isOnline ? 'bg-green-400 shadow-lg' : 'bg-yellow-300 shadow-lg'
        } animate-pulse`} />
        <span className="text-sm font-medium">
          {isOnline ? '✓ Online' : '⚠ Offline'}
        </span>
        {lastSyncTime && (
          <span className="text-xs opacity-80 hidden sm:inline">
            Last sync: {formatSyncTime(lastSyncTime)}
          </span>
        )}
      </div>

      {/* Sync Button */}
      {isOnline && (
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg hover:scale-105 active:scale-95"
          data-testid="sync-button"
          title="Sync with server"
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
              Sync
            </span>
          )}
        </button>
      )}
    </div>
  );
};

export default StatusIndicator;