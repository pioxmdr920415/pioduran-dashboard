// Map Tile Caching Utility using IndexedDB
const DB_NAME = 'MapTileCache';
const DB_VERSION = 2;
const STORE_NAME = 'tiles';
const METADATA_STORE = 'metadata';
const TILE_EXPIRY_DAYS = 30; // Tiles expire after 30 days

let dbInstance = null;

// Open or create the IndexedDB database
const openDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open Map Tile Cache DB');
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create tiles store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('z', 'z', { unique: false });
      }

      // Create metadata store for cache statistics
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
      }
    };
  });
};

// Generate a unique key for a tile based on its URL
const getTileKey = (url) => {
  return url;
};

// Parse tile coordinates from URL
const parseTileCoords = (url) => {
  const match = url.match(/\/(\d+)\/(\d+)\/(\d+)\.(png|jpg|jpeg|webp)/);
  if (match) {
    return { z: parseInt(match[1]), x: parseInt(match[2]), y: parseInt(match[3]) };
  }
  return null;
};

// Save a tile to the cache
export const saveTileToCache = async (url, blob) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const coords = parseTileCoords(url);
    
    // Convert blob to array buffer for storage
    const arrayBuffer = await blob.arrayBuffer();
    
    const tileData = {
      url: getTileKey(url),
      data: arrayBuffer,
      contentType: blob.type || 'image/png',
      timestamp: Date.now(),
      z: coords?.z || 0,
      x: coords?.x || 0,
      y: coords?.y || 0,
    };

    return new Promise((resolve, reject) => {
      const request = store.put(tileData);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error saving tile to cache:', error);
    return false;
  }
};

// Get a tile from the cache
export const getTileFromCache = async (url) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(getTileKey(url));
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Check if tile is expired
          const expiryTime = TILE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
          if (Date.now() - result.timestamp > expiryTime) {
            resolve(null); // Tile expired
          } else {
            // Convert array buffer back to blob
            const blob = new Blob([result.data], { type: result.contentType });
            resolve(blob);
          }
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting tile from cache:', error);
    return null;
  }
};

// Check if a tile exists in cache
export const isTileInCache = async (url) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.get(getTileKey(url));
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => resolve(false);
    });
  } catch (error) {
    return false;
  }
};

// Get cache statistics
export const getCacheStats = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.count();
      request.onsuccess = () => {
        resolve({
          tileCount: request.result,
        });
      };
      request.onerror = () => resolve({ tileCount: 0 });
    });
  } catch (error) {
    return { tileCount: 0 };
  }
};

// Get detailed cache info including size estimate
export const getCacheInfo = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const stats = {
        tileCount: 0,
        estimatedSize: 0,
        zoomLevels: {},
        oldestTile: null,
        newestTile: null,
      };

      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          stats.tileCount++;
          stats.estimatedSize += cursor.value.data.byteLength;
          
          // Track zoom level distribution
          const z = cursor.value.z;
          stats.zoomLevels[z] = (stats.zoomLevels[z] || 0) + 1;
          
          // Track oldest/newest
          if (!stats.oldestTile || cursor.value.timestamp < stats.oldestTile) {
            stats.oldestTile = cursor.value.timestamp;
          }
          if (!stats.newestTile || cursor.value.timestamp > stats.newestTile) {
            stats.newestTile = cursor.value.timestamp;
          }
          
          cursor.continue();
        } else {
          resolve(stats);
        }
      };
      request.onerror = () => resolve(stats);
    });
  } catch (error) {
    return { tileCount: 0, estimatedSize: 0, zoomLevels: {} };
  }
};

// Clear all cached tiles
export const clearTileCache = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error clearing tile cache:', error);
    return false;
  }
};

// Clear expired tiles
export const clearExpiredTiles = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const expiryTime = Date.now() - (TILE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    let deletedCount = 0;

    return new Promise((resolve) => {
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.timestamp < expiryTime) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      request.onerror = () => resolve(deletedCount);
    });
  } catch (error) {
    console.error('Error clearing expired tiles:', error);
    return 0;
  }
};

// Prefetch tiles for a given bounds and zoom range
export const prefetchTiles = async (bounds, minZoom, maxZoom, onProgress) => {
  const tilesToFetch = [];
  
  // Calculate tile coordinates for the given bounds at each zoom level
  for (let z = minZoom; z <= maxZoom; z++) {
    const minTile = latLngToTile(bounds.south, bounds.west, z);
    const maxTile = latLngToTile(bounds.north, bounds.east, z);
    
    for (let x = Math.min(minTile.x, maxTile.x); x <= Math.max(minTile.x, maxTile.x); x++) {
      for (let y = Math.min(minTile.y, maxTile.y); y <= Math.max(minTile.y, maxTile.y); y++) {
        const url = `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`;
        tilesToFetch.push({ url, z, x, y });
      }
    }
  }

  let fetched = 0;
  let cached = 0;
  let failed = 0;

  for (const tile of tilesToFetch) {
    try {
      // Check if already cached
      const isCached = await isTileInCache(tile.url);
      if (isCached) {
        cached++;
      } else {
        // Fetch and cache
        const response = await fetch(tile.url);
        if (response.ok) {
          const blob = await response.blob();
          await saveTileToCache(tile.url, blob);
          fetched++;
        } else {
          failed++;
        }
      }
    } catch (error) {
      failed++;
    }

    if (onProgress) {
      onProgress({
        total: tilesToFetch.length,
        fetched,
        cached,
        failed,
        current: fetched + cached + failed,
      });
    }

    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return { fetched, cached, failed, total: tilesToFetch.length };
};

// Convert lat/lng to tile coordinates
const latLngToTile = (lat, lng, zoom) => {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
};

// Convert tile coordinates to lat/lng bounds
export const tileToBounds = (x, y, z) => {
  const n = Math.pow(2, z);
  const lonMin = x / n * 360 - 180;
  const lonMax = (x + 1) / n * 360 - 180;
  const latMinRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n)));
  const latMaxRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)));
  const latMin = latMinRad * 180 / Math.PI;
  const latMax = latMaxRad * 180 / Math.PI;
  return { north: latMax, south: latMin, east: lonMax, west: lonMin };
};

// Format bytes to human readable
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default {
  saveTileToCache,
  getTileFromCache,
  isTileInCache,
  getCacheStats,
  getCacheInfo,
  clearTileCache,
  clearExpiredTiles,
  prefetchTiles,
  formatBytes,
};
