// IndexedDB utility for offline storage
const DB_NAME = 'MDRRMODashboard';
const DB_VERSION = 1;

const STORES = {
  SHEETS: 'sheets',
  DRIVE_FOLDERS: 'drive_folders',
  METADATA: 'metadata',
};

let dbInstance = null;

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.SHEETS)) {
        db.createObjectStore(STORES.SHEETS, { keyPath: 'name' });
      }

      if (!db.objectStoreNames.contains(STORES.DRIVE_FOLDERS)) {
        db.createObjectStore(STORES.DRIVE_FOLDERS, { keyPath: 'folderId' });
      }

      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
      }
    };
  });
};

// Sheet data operations
export const saveSheetToIndexedDB = async (sheetName, data) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.SHEETS], 'readwrite');
    const store = transaction.objectStore(STORES.SHEETS);
    
    await store.put({
      name: sheetName,
      data: data,
      timestamp: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Error saving sheet to IndexedDB:', error);
    return false;
  }
};

export const getSheetFromIndexedDB = async (sheetName) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.SHEETS], 'readonly');
    const store = transaction.objectStore(STORES.SHEETS);
    
    return new Promise((resolve, reject) => {
      const request = store.get(sheetName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting sheet from IndexedDB:', error);
    return null;
  }
};

// Drive folder operations
export const saveDriveFolderToIndexedDB = async (folderId, data) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.DRIVE_FOLDERS], 'readwrite');
    const store = transaction.objectStore(STORES.DRIVE_FOLDERS);
    
    await store.put({
      folderId: folderId,
      data: data,
      timestamp: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Error saving Drive folder to IndexedDB:', error);
    return false;
  }
};

export const getDriveFolderFromIndexedDB = async (folderId) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.DRIVE_FOLDERS], 'readonly');
    const store = transaction.objectStore(STORES.DRIVE_FOLDERS);
    
    return new Promise((resolve, reject) => {
      const request = store.get(folderId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting Drive folder from IndexedDB:', error);
    return null;
  }
};

// Metadata operations
export const saveMetadataToIndexedDB = async (key, value) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.METADATA], 'readwrite');
    const store = transaction.objectStore(STORES.METADATA);
    
    await store.put({
      key: key,
      value: value,
      timestamp: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Error saving metadata to IndexedDB:', error);
    return false;
  }
};

export const getMetadataFromIndexedDB = async (key) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.METADATA], 'readonly');
    const store = transaction.objectStore(STORES.METADATA);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting metadata from IndexedDB:', error);
    return null;
  }
};

export const clearAllIndexedDB = async () => {
  try {
    const db = await openDB();
    const stores = [STORES.SHEETS, STORES.DRIVE_FOLDERS, STORES.METADATA];
    
    for (const storeName of stores) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await store.clear();
    }

    return true;
  } catch (error) {
    console.error('Error clearing IndexedDB:', error);
    return false;
  }
};
