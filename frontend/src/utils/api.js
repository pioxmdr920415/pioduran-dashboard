import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance with enhanced configuration
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request deduplication cache
const ongoingRequests = new Map();

// Enhanced error handling
const handleApiError = (error, context) => {
  if (error.response) {
    const { status, data } = error.response;
    const message = data?.detail || data?.message || error.message;

    switch (status) {
      case 403:
        console.error(`${context}: Access denied - ${message}`);
        break;
      case 404:
        console.error(`${context}: Resource not found - ${message}`);
        break;
      case 429:
        console.error(`${context}: Rate limited - ${message}`);
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        console.error(`${context}: Server error - ${message}`);
        break;
      default:
        console.error(`${context}: API error (${status}) - ${message}`);
    }

    return { status, message };
  } else if (error.request) {
    console.error(`${context}: Network error - No response received`);
    return { status: 0, message: 'Network error - please check your connection' };
  } else {
    console.error(`${context}: Request error - ${error.message}`);
    return { status: -1, message: error.message };
  }
};

// Request deduplication wrapper
const deduplicateRequest = (key, requestFn) => {
  if (ongoingRequests.has(key)) {
    console.log(`Deduplicating request: ${key}`);
    return ongoingRequests.get(key);
  }

  const promise = requestFn().finally(() => {
    // Clean up after request completes
    setTimeout(() => ongoingRequests.delete(key), 100);
  });

  ongoingRequests.set(key, promise);
  return promise;
};

// Online/Offline detection
export const isOnline = () => {
  return navigator.onLine;
};

// Google Sheets API
export const fetchSheetData = async (sheetName) => {
  const requestKey = `sheet:${sheetName}`;

  return deduplicateRequest(requestKey, async () => {
    try {
      const response = await apiClient.get(`/sheets/${sheetName}`);
      return response.data;
    } catch (error) {
      const errorInfo = handleApiError(error, `Google Sheets (${sheetName})`);

      // Try cached data if online fetch fails and we're online
      if (isOnline() && errorInfo.status !== 404) {
        console.log(`Attempting to fetch cached data for sheet ${sheetName}`);
        try {
          return await fetchCachedSheetData(sheetName);
        } catch (cacheError) {
          console.error(`Cache fallback also failed for sheet ${sheetName}:`, cacheError);
        }
      }

      throw new Error(errorInfo.message);
    }
  });
};

export const fetchCachedSheetData = async (sheetName) => {
  try {
    const response = await apiClient.get(`/cache/sheets/${sheetName}`);
    return response.data;
  } catch (error) {
    const errorInfo = handleApiError(error, `Cached Google Sheets (${sheetName})`);
    throw new Error(errorInfo.message);
  }
};

// Google Drive API
export const fetchDriveFolder = async (folderId) => {
  const requestKey = `drive:${folderId}`;

  return deduplicateRequest(requestKey, async () => {
    try {
      const response = await apiClient.get(`/drive/folder/${folderId}`);
      return response.data;
    } catch (error) {
      const errorInfo = handleApiError(error, `Google Drive (${folderId})`);

      // Try cached data if online fetch fails and we're online
      if (isOnline() && errorInfo.status !== 404) {
        console.log(`Attempting to fetch cached data for Drive folder ${folderId}`);
        try {
          return await fetchCachedDriveFolder(folderId);
        } catch (cacheError) {
          console.error(`Cache fallback also failed for Drive folder ${folderId}:`, cacheError);
        }
      }

      throw new Error(errorInfo.message);
    }
  });
};

export const fetchCachedDriveFolder = async (folderId) => {
  try {
    const response = await apiClient.get(`/cache/drive/folder/${folderId}`);
    return response.data;
  } catch (error) {
    const errorInfo = handleApiError(error, `Cached Google Drive (${folderId})`);
    throw new Error(errorInfo.message);
  }
};

// Sync API
export const syncAllData = async () => {
  try {
    const response = await apiClient.post('/sync/all');
    return response.data;
  } catch (error) {
    const errorInfo = handleApiError(error, 'Data Sync');
    throw new Error(errorInfo.message);
  }
};

export const getCacheStatus = async () => {
  try {
    const response = await apiClient.get('/cache/status');
    return response.data;
  } catch (error) {
    const errorInfo = handleApiError(error, 'Cache Status');
    throw new Error(errorInfo.message);
  }
};

export const getApiMetrics = async () => {
  try {
    const response = await apiClient.get('/metrics');
    return response.data;
  } catch (error) {
    const errorInfo = handleApiError(error, 'API Metrics');
    throw new Error(errorInfo.message);
  }
};

// Bulk Operations API
export const bulkUpdate = async (sheetType, updates, description = null) => {
  try {
    const response = await apiClient.post('/bulk/update', {
      sheet_type: sheetType,
      updates,
      description
    });
    return response.data;
  } catch (error) {
    const errorInfo = handleApiError(error, `Bulk Update (${sheetType})`);
    throw new Error(errorInfo.message);
  }
};

export const bulkDelete = async (sheetType, rowIndices, description = null) => {
  try {
    const response = await apiClient.post('/bulk/delete', {
      sheet_type: sheetType,
      row_indices: rowIndices,
      description
    });
    return response.data;
  } catch (error) {
    const errorInfo = handleApiError(error, `Bulk Delete (${sheetType})`);
    throw new Error(errorInfo.message);
  }
};

export const bulkImport = async (sheetType, data, updateExisting = false, description = null) => {
  try {
    const response = await apiClient.post('/bulk/import', {
      sheet_type: sheetType,
      data,
      update_existing: updateExisting,
      description
    });
    return response.data;
  } catch (error) {
    const errorInfo = handleApiError(error, `Bulk Import (${sheetType})`);
    throw new Error(errorInfo.message);
  }
};

export const getBulkOperationStatus = async (operationId) => {
  try {
    const response = await apiClient.get(`/bulk/status/${operationId}`);
    return response.data;
  } catch (error) {
    const errorInfo = handleApiError(error, `Bulk Status (${operationId})`);
    throw new Error(errorInfo.message);
  }
};

// Export API
export const exportData = async (sheetType, format, columns = null) => {
  try {
    const params = new URLSearchParams();
    if (columns) {
      params.append('columns', columns);
    }

    const response = await apiClient.get(`/export/${sheetType}/${format}?${params.toString()}`, {
      responseType: 'blob'  // Important for file downloads
    });

    return response.data;
  } catch (error) {
    const errorInfo = handleApiError(error, `Export (${sheetType} - ${format})`);
    throw new Error(errorInfo.message);
  }
};

// Helper function to download blob as file
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default apiClient;
