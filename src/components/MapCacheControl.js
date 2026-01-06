import React, { useState, useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { 
  getCacheInfo, 
  clearTileCache, 
  clearExpiredTiles, 
  prefetchTiles, 
  formatBytes 
} from '../utils/mapTileCache';
import { 
  Download, 
  Trash2, 
  HardDrive, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  X, 
  CheckCircle,
  AlertCircle,
  MapPin
} from 'lucide-react';

const MapCacheControl = ({ position = 'bottomleft' }) => {
  const map = useMap();
  const [isOpen, setIsOpen] = useState(false);
  const [cacheInfo, setCacheInfo] = useState({ tileCount: 0, estimatedSize: 0, zoomLevels: {} });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [prefetchProgress, setPrefetchProgress] = useState(null);
  const [message, setMessage] = useState(null);
  const [sessionStats, setSessionStats] = useState({ hits: 0, misses: 0 });

  // Monitor online status
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

  // Load cache info
  const loadCacheInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const info = await getCacheInfo();
      setCacheInfo(info);
    } catch (error) {
      console.error('Error loading cache info:', error);
    }
    setIsLoading(false);
  }, []);

  // Load cache info when panel opens
  useEffect(() => {
    if (isOpen) {
      loadCacheInfo();
    }
  }, [isOpen, loadCacheInfo]);

  // Show message temporarily
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // Clear all cached tiles
  const handleClearCache = async () => {
    if (!window.confirm('Are you sure you want to clear all cached map tiles? This cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      await clearTileCache();
      showMessage('Cache cleared successfully');
      await loadCacheInfo();
    } catch (error) {
      showMessage('Failed to clear cache', 'error');
    }
    setIsLoading(false);
  };

  // Clear expired tiles
  const handleClearExpired = async () => {
    setIsLoading(true);
    try {
      const deleted = await clearExpiredTiles();
      showMessage(`Removed ${deleted} expired tiles`);
      await loadCacheInfo();
    } catch (error) {
      showMessage('Failed to clear expired tiles', 'error');
    }
    setIsLoading(false);
  };

  // Prefetch tiles for current view
  const handlePrefetchCurrentView = async () => {
    if (!map) return;

    const bounds = map.getBounds();
    const currentZoom = map.getZoom();
    const minZoom = Math.max(currentZoom - 1, 1);
    const maxZoom = Math.min(currentZoom + 2, 18);

    setIsPrefetching(true);
    setPrefetchProgress({ total: 0, current: 0, fetched: 0, cached: 0, failed: 0 });

    try {
      const result = await prefetchTiles(
        {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
        minZoom,
        maxZoom,
        (progress) => setPrefetchProgress(progress)
      );

      showMessage(`Downloaded ${result.fetched} new tiles (${result.cached} already cached)`);
      await loadCacheInfo();
    } catch (error) {
      showMessage('Failed to prefetch tiles', 'error');
    }

    setIsPrefetching(false);
    setPrefetchProgress(null);
  };

  // Prefetch tiles for Pio Duran area
  const handlePrefetchPioDuran = async () => {
    // Pio Duran, Albay bounds (approximate)
    const bounds = {
      north: 13.10,
      south: 12.98,
      east: 123.55,
      west: 123.40,
    };

    setIsPrefetching(true);
    setPrefetchProgress({ total: 0, current: 0, fetched: 0, cached: 0, failed: 0 });

    try {
      const result = await prefetchTiles(
        bounds,
        10, // min zoom
        16, // max zoom
        (progress) => setPrefetchProgress(progress)
      );

      showMessage(`Downloaded ${result.fetched} new tiles for Pio Duran area`);
      await loadCacheInfo();
    } catch (error) {
      showMessage('Failed to prefetch tiles', 'error');
    }

    setIsPrefetching(false);
    setPrefetchProgress(null);
  };

  // Update session stats
  const updateSessionStats = useCallback((type) => {
    setSessionStats(prev => ({
      ...prev,
      [type]: prev[type] + 1
    }));
  }, []);

  // Expose update function globally for CachedTileLayer
  useEffect(() => {
    window.updateMapCacheStats = updateSessionStats;
    return () => {
      delete window.updateMapCacheStats;
    };
  }, [updateSessionStats]);

  return (
    <>
      {/* Toggle Button */}
      <div 
        className={`leaflet-control leaflet-bar absolute ${
          position.includes('bottom') ? 'bottom-4' : 'top-4'
        } ${
          position.includes('left') ? 'left-4' : 'right-4'
        } z-[1000]`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all ${
            isOnline 
              ? 'bg-white hover:bg-gray-50 text-gray-700' 
              : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
          }`}
          title="Map Cache Settings"
          data-testid="map-cache-toggle"
        >
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-amber-600" />
          )}
          <HardDrive className="w-4 h-4" />
          <span className="text-sm font-medium">{cacheInfo.tileCount} tiles</span>
        </button>
      </div>

      {/* Panel */}
      {isOpen && (
        <div 
          className={`absolute ${
            position.includes('bottom') ? 'bottom-16' : 'top-16'
          } ${
            position.includes('left') ? 'left-4' : 'right-4'
          } z-[1001] w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden`}
          data-testid="map-cache-panel"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                <h3 className="font-bold">Offline Map Cache</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                data-testid="close-cache-panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-white/90">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>Online - Tiles will be cached</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>Offline - Using cached tiles</span>
                </>
              )}
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`px-4 py-2 flex items-center gap-2 text-sm ${
              message.type === 'error' 
                ? 'bg-red-50 text-red-700' 
                : 'bg-green-50 text-green-700'
            }`}>
              {message.type === 'error' ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {message.text}
            </div>
          )}

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Cache Stats */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Cache Statistics</span>
                <button
                  onClick={loadCacheInfo}
                  disabled={isLoading}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Refresh stats"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-2 border border-gray-200">
                  <div className="text-2xl font-bold text-teal-600">{cacheInfo.tileCount}</div>
                  <div className="text-xs text-gray-500">Cached Tiles</div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-gray-200">
                  <div className="text-2xl font-bold text-cyan-600">{formatBytes(cacheInfo.estimatedSize)}</div>
                  <div className="text-xs text-gray-500">Cache Size</div>
                </div>
              </div>

              {/* Session Stats */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1">This Session</div>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600">
                    <span className="font-medium">{sessionStats.hits}</span> cache hits
                  </span>
                  <span className="text-amber-600">
                    <span className="font-medium">{sessionStats.misses}</span> downloads
                  </span>
                </div>
              </div>

              {/* Zoom Level Distribution */}
              {Object.keys(cacheInfo.zoomLevels).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">Tiles by Zoom Level</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(cacheInfo.zoomLevels)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([zoom, count]) => (
                        <span 
                          key={zoom}
                          className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs"
                        >
                          z{zoom}: {count}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Prefetch Progress */}
            {isPrefetching && prefetchProgress && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">Downloading tiles...</span>
                  <span className="text-sm text-blue-600">
                    {prefetchProgress.current} / {prefetchProgress.total}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${prefetchProgress.total ? (prefetchProgress.current / prefetchProgress.total) * 100 : 0}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-blue-600 mt-1">
                  <span>New: {prefetchProgress.fetched}</span>
                  <span>Cached: {prefetchProgress.cached}</span>
                  <span>Failed: {prefetchProgress.failed}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handlePrefetchCurrentView}
                disabled={isPrefetching || !isOnline}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 text-white rounded-lg transition-colors text-sm font-medium"
                data-testid="prefetch-current-view"
              >
                <Download className="w-4 h-4" />
                Download Current View
              </button>

              <button
                onClick={handlePrefetchPioDuran}
                disabled={isPrefetching || !isOnline}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 text-white rounded-lg transition-colors text-sm font-medium"
                data-testid="prefetch-pio-duran"
              >
                <MapPin className="w-4 h-4" />
                Download Pio Duran Area
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleClearExpired}
                  disabled={isLoading || isPrefetching}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg transition-colors text-sm font-medium"
                  data-testid="clear-expired-tiles"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear Expired
                </button>

                <button
                  onClick={handleClearCache}
                  disabled={isLoading || isPrefetching}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm font-medium"
                  data-testid="clear-all-cache"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
              <p className="mb-1">
                <strong>Tip:</strong> Download tiles while online to use the map offline.
              </p>
              <p>
                Tiles are automatically cached as you browse and expire after 30 days.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MapCacheControl;
