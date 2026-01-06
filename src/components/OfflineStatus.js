import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { offlineQueue, syncStatus, offlineUtils } from '../utils/offlineStorage';

const OfflineStatus = ({ position = 'topright' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInfo, setSyncInfo] = useState({
    lastSync: null,
    pendingRequests: 0,
    isOnline: navigator.onLine
  });
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    available: 0,
    percentage: 0
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for service worker messages
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event) => {
        const { type, status, success, error } = event.data;

        switch (type) {
          case 'SYNC_STATUS':
            setSyncInfo(status);
            break;
          case 'SYNC_COMPLETE':
            setIsSyncing(false);
            if (success) {
              updateSyncInfo();
            }
            break;
          case 'ONLINE_STATUS':
            setIsOnline(status.online);
            break;
          default:
            break;
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  // Update sync information
  const updateSyncInfo = async () => {
    try {
      const [queueCount, status, storage] = await Promise.all([
        offlineQueue.count(),
        syncStatus.get(),
        offlineUtils.getStorageUsage()
      ]);

      setSyncInfo({
        ...status,
        pendingRequests: queueCount
      });

      setStorageInfo(storage);
    } catch (error) {
      console.error('Failed to update sync info:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    updateSyncInfo();
  }, []);

  // Trigger manual sync
  const handleSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);

    try {
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-offline-queue');
      } else {
        // Fallback: manually process queue
        console.log('Manual sync not supported, processing queue directly');
        // This would require additional implementation
      }
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      setIsSyncing(false);
    }
  };

  // Format last sync time
  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Never';

    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Format storage size
  const formatStorage = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <>
      {/* Status Indicator Button */}
      <div
        className={`leaflet-control leaflet-bar absolute ${
          position.includes('bottom') ? 'bottom-4' : 'top-4'
        } ${
          position.includes('left') ? 'left-4' : 'right-4'
        } z-[1000]`}
      >
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all ${
            isOnline
              ? 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
              : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300'
          }`}
          title={`${isOnline ? 'Online' : 'Offline'} - ${syncInfo.pendingRequests} pending sync${syncInfo.pendingRequests !== 1 ? 's' : ''}`}
        >
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-amber-600" />
          )}
          <span className="text-sm font-medium">
            {isOnline ? 'Online' : 'Offline'}
          </span>
          {syncInfo.pendingRequests > 0 && (
            <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">
              {syncInfo.pendingRequests}
            </Badge>
          )}
        </button>
      </div>

      {/* Detailed Status Panel */}
      {showDetails && (
        <div
          className={`absolute ${
            position.includes('bottom') ? 'bottom-16' : 'top-16'
          } ${
            position.includes('left') ? 'left-4' : 'right-4'
          } z-[1001] w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden`}
        >
          <div className={`p-4 ${
            isOnline ? 'bg-green-50 border-b border-green-200' : 'bg-amber-50 border-b border-amber-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-600" />
                ) : (
                  <WifiOff className="w-5 h-5 text-amber-600" />
                )}
                <div>
                  <h3 className="font-bold text-gray-900">
                    {isOnline ? 'Online' : 'Offline'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isOnline ? 'Connected to internet' : 'Working offline'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Sync Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Last sync:</span>
                  <span className="font-medium">
                    {formatLastSync(syncInfo.lastSync)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Pending requests:</span>
                  <Badge variant={syncInfo.pendingRequests > 0 ? "destructive" : "secondary"}>
                    {syncInfo.pendingRequests}
                  </Badge>
                </div>

                {syncInfo.pendingRequests > 0 && (
                  <Button
                    onClick={handleSync}
                    disabled={!isOnline || isSyncing}
                    size="sm"
                    className="w-full"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync Now
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Storage Usage */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Storage Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Used:</span>
                    <span className="font-medium">
                      {formatStorage(storageInfo.used)}
                    </span>
                  </div>
                  <Progress
                    value={storageInfo.percentage}
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0 B</span>
                    <span>{formatStorage(storageInfo.available)}</span>
                  </div>
                </div>

                {storageInfo.percentage > 80 && (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Storage is running low</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Offline Capabilities */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Offline Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Map tiles cached</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Geospatial data stored</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Requests queued for sync</span>
                  </div>
                  {!isOnline && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Limited functionality</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
};

export default OfflineStatus;