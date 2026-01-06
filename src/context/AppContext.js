import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { syncAllData } from '../utils/api';
import {
  saveSheetToIndexedDB,
  getSheetFromIndexedDB,
  saveDriveFolderToIndexedDB,
  getDriveFolderFromIndexedDB,
  saveMetadataToIndexedDB,
  getMetadataFromIndexedDB,
} from '../utils/indexedDB';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [toast, setToast] = useState(null);

  // Load last sync time from IndexedDB
  useEffect(() => {
    const loadLastSyncTime = async () => {
      const metadata = await getMetadataFromIndexedDB('lastSyncTime');
      if (metadata) {
        setLastSyncTime(metadata.value);
      }
    };
    loadLastSyncTime();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Connection restored. Syncing data...', 'success');
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('You are offline. Using cached data.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-sync when coming online
  const handleSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await syncAllData();
      const syncTime = new Date().toISOString();
      setLastSyncTime(syncTime);
      await saveMetadataToIndexedDB('lastSyncTime', syncTime);
      showToast('Data synced successfully!', 'success');
      return result;
    } catch (error) {
      console.error('Sync error:', error);
      showToast('Failed to sync data', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  // Show toast notification
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Cache data helpers
  const cacheSheetData = useCallback(async (sheetName, data) => {
    await saveSheetToIndexedDB(sheetName, data);
  }, []);

  const getCachedSheetData = useCallback(async (sheetName) => {
    return await getSheetFromIndexedDB(sheetName);
  }, []);

  const cacheDriveFolderData = useCallback(async (folderId, data) => {
    await saveDriveFolderToIndexedDB(folderId, data);
  }, []);

  const getCachedDriveFolderData = useCallback(async (folderId) => {
    return await getDriveFolderFromIndexedDB(folderId);
  }, []);

  const value = {
    isOnline,
    isSyncing,
    lastSyncTime,
    toast,
    showToast,
    handleSync,
    cacheSheetData,
    getCachedSheetData,
    cacheDriveFolderData,
    getCachedDriveFolderData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
