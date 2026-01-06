// Offline Data Storage Utilities
// Provides comprehensive offline data management for the PWA

const DB_NAME = 'MDRRMODashboard';
const DB_VERSION = 2;

// Database stores
const STORES = {
  OFFLINE_QUEUE: 'offlineQueue',
  SYNC_STATUS: 'syncStatus',
  GEOSPATIAL_DATA: 'geospatialData',
  USER_PREFERENCES: 'userPreferences',
  MAP_STATE: 'mapState'
};

// Initialize IndexedDB
export const initOfflineStorage = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open offline storage database');
      reject(new Error('Failed to initialize offline storage'));
    };

    request.onsuccess = (event) => {
      console.log('Offline storage initialized');
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores if they don't exist
      Object.values(STORES).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, {
            keyPath: storeName === STORES.OFFLINE_QUEUE ? 'id' : 'key',
            autoIncrement: storeName === STORES.OFFLINE_QUEUE
          });

          // Create indexes
          if (storeName === STORES.OFFLINE_QUEUE) {
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('type', 'type', { unique: false });
          } else if (storeName === STORES.GEOSPATIAL_DATA) {
            store.createIndex('type', 'type', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        }
      });
    };
  });
};

// Generic database operation
const dbOperation = (storeName, operation, data = null) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      let dbRequest;

      switch (operation) {
        case 'get':
          dbRequest = store.get(data);
          break;
        case 'put':
          dbRequest = store.put(data);
          break;
        case 'delete':
          dbRequest = store.delete(data);
          break;
        case 'clear':
          dbRequest = store.clear();
          break;
        case 'getAll':
          dbRequest = store.getAll();
          break;
        case 'count':
          dbRequest = store.count();
          break;
        default:
          reject(new Error(`Unknown operation: ${operation}`));
          return;
      }

      dbRequest.onsuccess = () => resolve(dbRequest.result);
      dbRequest.onerror = () => reject(dbRequest.error);

      transaction.oncomplete = () => db.close();
    };
  });
};

// Offline Queue Management
export const offlineQueue = {
  // Add request to offline queue
  add: async (requestData) => {
    const queueItem = {
      ...requestData,
      timestamp: Date.now(),
      type: 'api-request',
      retryCount: 0
    };

    try {
      await dbOperation(STORES.OFFLINE_QUEUE, 'put', queueItem);
      console.log('Request added to offline queue');
      return true;
    } catch (error) {
      console.error('Failed to add to offline queue:', error);
      return false;
    }
  },

  // Get all queued requests
  getAll: async () => {
    try {
      return await dbOperation(STORES.OFFLINE_QUEUE, 'getAll');
    } catch (error) {
      console.error('Failed to get offline queue:', error);
      return [];
    }
  },

  // Remove request from queue
  remove: async (id) => {
    try {
      await dbOperation(STORES.OFFLINE_QUEUE, 'delete', id);
      return true;
    } catch (error) {
      console.error('Failed to remove from offline queue:', error);
      return false;
    }
  },

  // Clear all queued requests
  clear: async () => {
    try {
      await dbOperation(STORES.OFFLINE_QUEUE, 'clear');
      return true;
    } catch (error) {
      console.error('Failed to clear offline queue:', error);
      return false;
    }
  },

  // Get queue count
  count: async () => {
    try {
      return await dbOperation(STORES.OFFLINE_QUEUE, 'count');
    } catch (error) {
      console.error('Failed to get queue count:', error);
      return 0;
    }
  }
};

// Sync Status Management
export const syncStatus = {
  // Update sync status
  update: async (status) => {
    try {
      await dbOperation(STORES.SYNC_STATUS, 'put', {
        key: 'status',
        ...status,
        lastUpdated: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Failed to update sync status:', error);
      return false;
    }
  },

  // Get sync status
  get: async () => {
    try {
      const status = await dbOperation(STORES.SYNC_STATUS, 'get', 'status');
      return status || {
        lastSync: null,
        isOnline: navigator.onLine,
        pendingRequests: 0
      };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return { lastSync: null, isOnline: navigator.onLine, pendingRequests: 0 };
    }
  }
};

// Geospatial Data Storage
export const geospatialStorage = {
  // Save geospatial data
  save: async (data) => {
    const dataItem = {
      ...data,
      key: data.id || `geo-${Date.now()}`,
      timestamp: Date.now(),
      synced: false
    };

    try {
      await dbOperation(STORES.GEOSPATIAL_DATA, 'put', dataItem);
      return true;
    } catch (error) {
      console.error('Failed to save geospatial data:', error);
      return false;
    }
  },

  // Get geospatial data by type
  getByType: async (type) => {
    try {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = () => reject(request.error);
      });

      const transaction = db.transaction([STORES.GEOSPATIAL_DATA], 'readonly');
      const store = transaction.objectStore(STORES.GEOSPATIAL_DATA);
      const index = store.index('type');

      return new Promise((resolve) => {
        const results = [];
        index.openCursor(IDBKeyRange.only(type)).onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
      });
    } catch (error) {
      console.error('Failed to get geospatial data:', error);
      return [];
    }
  },

  // Get all geospatial data
  getAll: async () => {
    try {
      return await dbOperation(STORES.GEOSPATIAL_DATA, 'getAll');
    } catch (error) {
      console.error('Failed to get all geospatial data:', error);
      return [];
    }
  },

  // Mark data as synced
  markSynced: async (id) => {
    try {
      const data = await dbOperation(STORES.GEOSPATIAL_DATA, 'get', id);
      if (data) {
        data.synced = true;
        await dbOperation(STORES.GEOSPATIAL_DATA, 'put', data);
      }
      return true;
    } catch (error) {
      console.error('Failed to mark data as synced:', error);
      return false;
    }
  }
};

// User Preferences Storage
export const userPreferences = {
  // Save user preference
  set: async (key, value) => {
    try {
      await dbOperation(STORES.USER_PREFERENCES, 'put', {
        key,
        value,
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Failed to save user preference:', error);
      return false;
    }
  },

  // Get user preference
  get: async (key, defaultValue = null) => {
    try {
      const pref = await dbOperation(STORES.USER_PREFERENCES, 'get', key);
      return pref ? pref.value : defaultValue;
    } catch (error) {
      console.error('Failed to get user preference:', error);
      return defaultValue;
    }
  },

  // Get all preferences
  getAll: async () => {
    try {
      const prefs = await dbOperation(STORES.USER_PREFERENCES, 'getAll');
      return prefs.reduce((acc, pref) => {
        acc[pref.key] = pref.value;
        return acc;
      }, {});
    } catch (error) {
      console.error('Failed to get all preferences:', error);
      return {};
    }
  }
};

// Map State Storage
export const mapState = {
  // Save map state
  save: async (state) => {
    try {
      await dbOperation(STORES.MAP_STATE, 'put', {
        key: 'currentState',
        ...state,
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Failed to save map state:', error);
      return false;
    }
  },

  // Get map state
  get: async () => {
    try {
      const state = await dbOperation(STORES.MAP_STATE, 'get', 'currentState');
      return state || {
        center: [13.0485, 123.4567],
        zoom: 12,
        layers: []
      };
    } catch (error) {
      console.error('Failed to get map state:', error);
      return { center: [13.0485, 123.4567], zoom: 12, layers: [] };
    }
  }
};

// Utility functions
export const offlineUtils = {
  // Check if we're online
  isOnline: () => navigator.onLine,

  // Get storage usage
  getStorageUsage: async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          available: estimate.quota || 0,
          percentage: estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0
        };
      }
      return { used: 0, available: 0, percentage: 0 };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  },

  // Clear all offline data
  clearAll: async () => {
    try {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = () => reject(request.error);
      });

      const storeNames = Array.from(db.objectStoreNames);
      const transaction = db.transaction(storeNames, 'readwrite');

      await Promise.all(
        storeNames.map(storeName => {
          return new Promise((resolve) => {
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
          });
        })
      );

      console.log('All offline data cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      return false;
    }
  }
};

// Initialize storage on module load
if (typeof window !== 'undefined') {
  initOfflineStorage().catch(console.error);
}

export default {
  initOfflineStorage,
  offlineQueue,
  syncStatus,
  geospatialStorage,
  userPreferences,
  mapState,
  offlineUtils
};