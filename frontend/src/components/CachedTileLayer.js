import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { saveTileToCache, getTileFromCache } from '../utils/mapTileCache';

// Custom TileLayer with caching support
const CachedTileLayer = ({ 
  url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  subdomains = ['a', 'b', 'c'],
  maxZoom = 19,
  minZoom = 1,
  onCacheHit,
  onCacheMiss,
  onTileLoad,
  onTileError,
  enableCaching = true,
}) => {
  const map = useMap();
  const tileLayerRef = useRef(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const cacheStatsRef = useRef({ hits: 0, misses: 0, errors: 0 });

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

  // Custom tile loading function
  const loadTile = useCallback(async (coords, done) => {
    const { x, y, z } = coords;
    const subdomainIndex = (x + y) % subdomains.length;
    const subdomain = subdomains[subdomainIndex];
    const tileUrl = url
      .replace('{s}', subdomain)
      .replace('{z}', z)
      .replace('{x}', x)
      .replace('{y}', y);

    const tile = document.createElement('img');
    tile.crossOrigin = 'anonymous';
    tile.alt = '';

    try {
      if (enableCaching) {
        // Try to get from cache first
        const cachedBlob = await getTileFromCache(tileUrl);
        
        if (cachedBlob) {
          // Cache hit
          cacheStatsRef.current.hits++;
          onCacheHit?.();
          
          const objectUrl = URL.createObjectURL(cachedBlob);
          tile.onload = () => {
            URL.revokeObjectURL(objectUrl);
            done(null, tile);
            onTileLoad?.({ cached: true, url: tileUrl });
          };
          tile.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            // If cached tile fails, try fetching fresh
            fetchAndCacheTile(tile, tileUrl, done);
          };
          tile.src = objectUrl;
          return tile;
        }
      }

      // Cache miss or caching disabled - fetch from network
      cacheStatsRef.current.misses++;
      onCacheMiss?.();
      await fetchAndCacheTile(tile, tileUrl, done);
      
    } catch (error) {
      cacheStatsRef.current.errors++;
      onTileError?.(error);
      done(error, tile);
    }

    return tile;
  }, [url, subdomains, enableCaching, onCacheHit, onCacheMiss, onTileLoad, onTileError]);

  // Fetch tile from network and cache it
  const fetchAndCacheTile = async (tile, tileUrl, done) => {
    try {
      const response = await fetch(tileUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      
      // Cache the tile in background
      if (enableCaching) {
        saveTileToCache(tileUrl, blob).catch(err => 
          console.warn('Failed to cache tile:', err)
        );
      }

      const objectUrl = URL.createObjectURL(blob);
      tile.onload = () => {
        URL.revokeObjectURL(objectUrl);
        done(null, tile);
        onTileLoad?.({ cached: false, url: tileUrl });
      };
      tile.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        done(err, tile);
      };
      tile.src = objectUrl;
      
    } catch (error) {
      // If offline and fetch fails, try showing a placeholder
      if (!navigator.onLine) {
        tile.src = createOfflinePlaceholder();
        done(null, tile);
      } else {
        done(error, tile);
      }
    }
  };

  // Create offline placeholder tile
  const createOfflinePlaceholder = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Light gray background
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, 256, 256);
    
    // Grid pattern
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    for (let i = 0; i < 256; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
    
    // Offline icon
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Offline', 128, 128);
    
    return canvas.toDataURL();
  };

  // Create and add the tile layer
  useEffect(() => {
    if (!map) return;

    // Create custom TileLayer class with caching
    const CachedTileLayerClass = L.TileLayer.extend({
      createTile: function(coords, done) {
        return loadTile(coords, done);
      }
    });

    // Remove existing tile layer if any
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // Create and add new tile layer
    const tileLayer = new CachedTileLayerClass(url, {
      attribution,
      maxZoom,
      minZoom,
      subdomains,
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    return () => {
      if (tileLayerRef.current && map) {
        map.removeLayer(tileLayerRef.current);
      }
    };
  }, [map, url, attribution, maxZoom, minZoom, subdomains, loadTile]);

  // Get cache stats
  const getCacheStats = useCallback(() => {
    return { ...cacheStatsRef.current };
  }, []);

  return null;
};

export default CachedTileLayer;
export { CachedTileLayer };
