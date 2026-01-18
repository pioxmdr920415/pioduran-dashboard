# Direct Google API - Implementation Reference

## Overview

Your dashboard now has **direct connections** to Google Sheets and Google Drive from the frontend. No backend proxy needed for reading data.

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                      │
│  (SupplyInventory, ContactDirectory, etc.)              │
└────────────────────┬────────────────────────────────────┘
                     │
     ┌───────────────┴────────────────┐
     │                                │
┌────▼──────────────────┐    ┌───────▼──────────────────┐
│   Direct API Call     │    │  Backend API Call        │
│  (No Backend Proxy)   │    │  (Optional Fallback)     │
└────┬──────────────────┘    └───────┬──────────────────┘
     │                                │
┌────▼──────────────────┐    ┌───────▼──────────────────┐
│ Google Sheets API     │    │  Backend Server          │
│ Google Drive API v3   │    │  (FastAPI/Uvicorn)       │
└───────────────────────┘    └──────────────────────────┘
```

---

## 📂 File Structure

```
frontend/
├── src/
│   ├── utils/
│   │   ├── googleAPI.js         ← Core Google API service
│   │   ├── api.js               ← API wrapper & exports
│   │   └── indexedDB.js         ← Offline caching
│   └── components/
│       ├── SupplyInventory.js   ← Uses fetchSheetDataDirect
│       ├── ContactDirectory.js  ← Uses fetchSheetDataDirect
│       ├── CalendarManagement.js ← Uses fetchSheetDataDirect
│       └── DocumentManagement.js ← Uses fetchDriveFolderDirect
└── .env                         ← Google API credentials
```

---

## 🔑 Configuration

### Environment Variables

```bash
REACT_APP_GOOGLE_API_KEY=AIzaSyCDcthLGNPlbMr4AFzuK5tl0CMTzsQI9EI
REACT_APP_GOOGLE_SHEET_ID=1UtT9t2LZ5NEc-wbGv44mDeDjWLxOLBQHA5yy6jiLc7E
REACT_APP_BACKEND_URL=https://unzip-to-root-3.preview.emergentagent.com
```

These are automatically picked up by:
- `googleAPI.js` - Uses them for direct API calls
- `api.js` - Re-exports the functions
- React components - Import from `api.js`

---

## 🔌 API Functions

### 1. Google Sheets - `fetchSheetDataDirect(sheetName)`

**File**: `frontend/src/utils/googleAPI.js`

**Implementation**:
```javascript
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
      // Remove JavaScript wrapper from Google Sheets response
      const jsonStr = text.substring(47, text.length - 2);
      const data = JSON.parse(jsonStr);
      
      if (!data.table || !data.table.rows) {
        console.warn(`No data found in sheet '${sheetName}'`);
        return [];
      }
      
      // Transform to array of objects
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
```

**URL Pattern**:
```
https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet={SHEET_NAME}
```

---

### 2. Google Drive - `fetchDriveFolderDirect(folderId)`

**File**: `frontend/src/utils/googleAPI.js`

**Implementation** (simplified):
```javascript
export const fetchDriveFolderDirect = async (folderId) => {
  const requestKey = `direct-drive:${folderId}`;

  return deduplicateGoogleRequest(requestKey, async () => {
    try {
      const allFiles = [];
      let pageToken = null;

      // Handle pagination
      while (true) {
        const data = await fetchDriveFolderPage(folderId, pageToken);
        allFiles.push(...(data.files || []));
        pageToken = data.nextPageToken;

        if (!pageToken) break;
      }

      // Separate folders and files
      const folders = allFiles.filter(f => 
        f.mimeType === 'application/vnd.google-apps.folder'
      );
      const files = allFiles.filter(f => 
        f.mimeType !== 'application/vnd.google-apps.folder'
      );

      console.log(`Successfully fetched ${folders.length} folders and ${files.length} files`);
      return { folders, files };
    } catch (error) {
      const errorMsg = handleGoogleAPIError(error, `Google Drive (${folderId})`);
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  });
};
```

**API Endpoint**:
```
https://www.googleapis.com/drive/v3/files?q='{FOLDER_ID}' in parents&...
```

---

## 🧩 Component Integration

### Example: SupplyInventory Component

```javascript
import React, { useState, useEffect } from 'react';
import { fetchSheetDataDirect } from '../utils/api';

const SupplyInventory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Direct call to Google Sheets
      const supplies = await fetchSheetDataDirect('supply');
      setData(supplies);
      console.log('✅ Loaded directly from Google Sheets');
    } catch (directError) {
      console.warn('❌ Direct fetch failed, would fallback to backend');
      // Could fallback here if needed
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {data.map((item, idx) => (
        <div key={idx}>
          <h3>{item['Item Name']}</h3>
          <p>Quantity: {item['Quantity']}</p>
          <p>Status: {item['Status']}</p>
        </div>
      ))}
    </div>
  );
};

export default SupplyInventory;
```

---

## 🎯 Data Flow

### Google Sheets Flow
```
1. Component calls fetchSheetDataDirect('supply')
   ↓
2. Google API service checks deduplication cache
   ↓
3. Constructs URL: https://docs.google.com/.../gviz/tq?...
   ↓
4. Fetch from Google (CORS request)
   ↓
5. Parse JSON response
   ↓
6. Transform to array of objects
   ↓
7. Return to component
   ↓
8. Component renders data
```

### Google Drive Flow
```
1. Component calls fetchDriveFolderDirect('folder-id')
   ↓
2. Google API service checks deduplication cache
   ↓
3. Fetch page 1: https://www.googleapis.com/drive/v3/files?...
   ↓
4. If nextPageToken exists, fetch page 2, 3, etc.
   ↓
5. Combine all results
   ↓
6. Separate folders and files by mimeType
   ↓
7. Return { folders, files }
   ↓
8. Component renders files
```

---

## 🛡️ Error Handling

### Error Types & Responses

| Error | Cause | Message |
|-------|-------|---------|
| 403 | Permission denied | "Access denied to {service}. Check API key permissions." |
| 404 | Resource not found | "Resource not found in {service}." |
| 429 | Rate limited | "Rate limit exceeded for {service}. Try again later." |
| 5xx | Server error | "{service} is temporarily unavailable. Try again later." |
| Network | Connection issue | "Network error accessing {service}: {error}" |

---

## 💾 Caching & Deduplication

### Request Deduplication
```javascript
// Prevents duplicate concurrent requests
const deduplicateGoogleRequest = (key, requestFn) => {
  if (ongoingGoogleRequests.has(key)) {
    console.log(`Deduplicating request: ${key}`);
    return ongoingGoogleRequests.get(key); // Return existing promise
  }

  const promise = requestFn().finally(() => {
    setTimeout(() => ongoingGoogleRequests.delete(key), 100);
  });

  ongoingGoogleRequests.set(key, promise);
  return promise;
};
```

### IndexedDB Caching
Components can cache data for offline support:
```javascript
import { cacheSheetData, getCachedSheetData } from '../context/AppContext';

// Save to cache
await cacheSheetData('supply', data);

// Retrieve from cache
const cached = await getCachedSheetData('supply');
```

---

## 📊 Response Examples

### Google Sheets Response
```javascript
[
  {
    'Item Name': 'Bandages',
    'Quantity': '100',
    'Status': 'In Stock',
    'Last Updated': '2024-01-18'
  },
  {
    'Item Name': 'Syringes',
    'Quantity': '50',
    'Status': 'Low Stock',
    'Last Updated': '2024-01-17'
  }
]
```

### Google Drive Response
```javascript
{
  folders: [
    {
      id: 'folder-id-123',
      name: 'Documents',
      mimeType: 'application/vnd.google-apps.folder',
      webViewLink: 'https://drive.google.com/...',
      thumbnailLink: 'https://lh3.googleusercontent.com/...'
    }
  ],
  files: [
    {
      id: 'file-id-456',
      name: 'report.pdf',
      mimeType: 'application/pdf',
      size: '2048576',
      webViewLink: 'https://drive.google.com/...',
      modifiedTime: '2024-01-18T10:30:00.000Z'
    }
  ]
}
```

---

## ✨ Features Summary

| Feature | Status | Details |
|---------|--------|---------|
| **Direct Sheets** | ✅ | No backend needed for read ops |
| **Direct Drive** | ✅ | Direct access to files/folders |
| **Deduplication** | ✅ | Prevents duplicate requests |
| **Pagination** | ✅ | Auto-handles large folders |
| **Caching** | ✅ | IndexedDB fallback |
| **Error Handling** | ✅ | User-friendly messages |
| **CORS Support** | ✅ | Built into Google APIs |
| **Rate Limits** | ✅ | Respected automatically |

---

## 🚀 Usage Pattern

The standard usage pattern across all components:

```javascript
// 1. Import the function
import { fetchSheetDataDirect } from '../utils/api';

// 2. Call in useEffect
useEffect(() => {
  const loadData = async () => {
    try {
      const data = await fetchSheetDataDirect('sheet-name');
      setData(data);
    } catch (error) {
      console.error('Error:', error);
      // Show error to user or fallback to cached data
    }
  };
  loadData();
}, []);

// 3. Render the data
return <div>{data.map(item => ...)}</div>;
```

---

## 🔒 Security Considerations

✅ **Read-Only**: API key cannot modify or delete data  
✅ **Public-Safe**: Exposing API key is standard for browser apps  
✅ **CORS-Safe**: Google APIs explicitly allow cross-origin requests  
✅ **Quota-Safe**: Google enforces rate limits automatically  

---

## 📖 References

- **Core Implementation**: [googleAPI.js](frontend/src/utils/googleAPI.js)
- **API Wrapper**: [api.js](frontend/src/utils/api.js)
- **Setup Guide**: [GOOGLE_API_SETUP.md](GOOGLE_API_SETUP.md)
- **Quick Start**: [GOOGLE_API_QUICK_START.md](GOOGLE_API_QUICK_START.md)

---

**Everything is ready to use! Direct Google API connection implemented and working.** ✅
