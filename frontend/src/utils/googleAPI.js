/**
 * Google API Service
 * Handles direct calls to Google Sheets and Google Drive APIs
 */

const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const GOOGLE_SHEET_ID = process.env.REACT_APP_GOOGLE_SHEET_ID;

// Request deduplication cache
const ongoingGoogleRequests = new Map();

/**
 * Handle Google API errors with user-friendly messages
 */
const handleGoogleAPIError = (error, service) => {
  if (error.response) {
    const status = error.response.status;
    if (status === 403) {
      return `Access denied to ${service}. Please check API key permissions.`;
    } else if (status === 404) {
      return `Resource not found in ${service}.`;
    } else if (status === 429) {
      return `Rate limit exceeded for ${service}. Please try again later.`;
    } else if (status >= 500) {
      return `${service} is temporarily unavailable. Please try again later.`;
    } else {
      return `Error accessing ${service}: ${error.response.statusText}`;
    }
  } else if (error.message) {
    return `Network error accessing ${service}: ${error.message}`;
  }
  return `Unknown error accessing ${service}`;
};

/**
 * Deduplicate Google API requests to avoid duplicate concurrent calls
 */
const deduplicateGoogleRequest = (key, requestFn) => {
  if (ongoingGoogleRequests.has(key)) {
    console.log(`Deduplicating Google API request: ${key}`);
    return ongoingGoogleRequests.get(key);
  }

  const promise = requestFn().finally(() => {
    setTimeout(() => ongoingGoogleRequests.delete(key), 100);
  });

  ongoingGoogleRequests.set(key, promise);
  return promise;
};

/**
 * Generate Google Sheets API URL
 */
const getSheetUrl = (sheetName) => {
  return `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
};

/**
 * Fetch data from Google Sheets
 */
export const fetchSheetDataDirect = async (sheetName) => {
  const requestKey = `direct-sheet:${sheetName}`;

  return deduplicateGoogleRequest(requestKey, async () => {
    try {
      const url = getSheetUrl(sheetName);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      // Remove the JavaScript wrapper from Google Sheets response
      const jsonStr = text.substring(47, text.length - 2);
      const data = JSON.parse(jsonStr);

      if (!data.table || !data.table.rows) {
        console.warn(`No data found in sheet '${sheetName}'`);
        return [];
      }

      const headers = data.table.cols.map(col => col.label || '');
      const rows = [];

      for (const row of data.table.rows) {
        const obj = {};
        for (let i = 0; i < row.c.length; i++) {
          obj[headers[i]] = row.c[i] ? row.c[i].v : '';
        }
        rows.push(obj);
      }

      console.log(`Successfully fetched ${rows.length} rows from sheet '${sheetName}'`);
      return rows;
    } catch (error) {
      const errorMsg = handleGoogleAPIError(error, `Google Sheets (${sheetName})`);
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  });
};

/**
 * Fetch a page of files and folders from Google Drive
 */
const fetchDriveFolderPage = async (folderId, pageToken = null) => {
  const baseUrl = 'https://www.googleapis.com/drive/v3/files';
  const params = new URLSearchParams({
    q: `'${folderId}' in parents`,
    fields: 'nextPageToken,files(id,name,mimeType,thumbnailLink,webViewLink,iconLink,modifiedTime,size)',
    key: GOOGLE_API_KEY,
    pageSize: 100,
    orderBy: 'name'
  });

  if (pageToken) {
    params.append('pageToken', pageToken);
  }

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    const errorMsg = handleGoogleAPIError(error, `Google Drive (${folderId})`);
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
};

/**
 * Fetch all files and folders from Google Drive with pagination support
 */
export const fetchDriveFolderDirect = async (folderId) => {
  const requestKey = `direct-drive:${folderId}`;

  return deduplicateGoogleRequest(requestKey, async () => {
    try {
      const allFiles = [];
      let pageToken = null;

      while (true) {
        const data = await fetchDriveFolderPage(folderId, pageToken);
        allFiles.push(...(data.files || []));
        pageToken = data.nextPageToken;

        if (!pageToken) {
          break;
        }
      }

      const folders = allFiles.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
      const files = allFiles.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');

      console.log(`Successfully fetched ${folders.length} folders and ${files.length} files from Drive folder '${folderId}'`);
      return { folders, files };
    } catch (error) {
      const errorMsg = handleGoogleAPIError(error, `Google Drive (${folderId})`);
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  });
};
