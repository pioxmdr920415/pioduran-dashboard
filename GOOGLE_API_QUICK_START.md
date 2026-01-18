# 🚀 Direct Google API - Quick Start Guide

## Status: ✅ FULLY OPERATIONAL

Your dashboard is configured to connect **directly** to Google Sheets and Google Drive from the frontend—**no backend required** for these operations.

---

## 📊 What's Working

### Google Sheets Integration
- **Sheet ID**: `1UtT9t2LZ5NEc-wbGv44mDeDjWLxOLBQHA5yy6jiLc7E`
- **API Key**: Configured ✅
- **Direct Access**: Enabled ✅

**Available Sheets**:
- `supply` - Supply inventory data
- `contact` - Contact directory
- `event` - Calendar events

### Google Drive Integration
- **API Key**: Configured ✅
- **Direct Access**: Enabled ✅
- **Pagination**: Auto-handled ✅

---

## 💻 How to Use

### In Your React Components

#### Fetch Google Sheets Data
```javascript
import { fetchSheetDataDirect } from '../utils/api';

export const MyComponent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch directly from Google Sheets
        const sheetData = await fetchSheetDataDirect('supply');
        setData(sheetData);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div>
      {loading ? 'Loading...' : (
        <ul>
          {data.map((item, idx) => (
            <li key={idx}>{JSON.stringify(item)}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

#### Fetch Google Drive Folder
```javascript
import { fetchDriveFolderDirect } from '../utils/googleAPI';

export const DocumentViewer = () => {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        // Fetch from Google Drive
        const { folders, files } = await fetchDriveFolderDirect('FOLDER_ID_HERE');
        setFiles(files);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    loadFiles();
  }, []);

  return (
    <div>
      {files.map(file => (
        <div key={file.id}>
          <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
            {file.name}
          </a>
        </div>
      ))}
    </div>
  );
};
```

---

## 🎯 Data Format

### Google Sheets Response
```javascript
[
  {
    'Item Name': 'Bandages',
    'Quantity': 100,
    'Status': 'In Stock',
    'Last Updated': '2024-01-18'
  },
  {
    'Item Name': 'Syringes',
    'Quantity': 50,
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
      id: 'folder-id-1',
      name: 'Documents',
      mimeType: 'application/vnd.google-apps.folder',
      webViewLink: 'https://drive.google.com/...',
      thumbnailLink: 'https://...'
    }
  ],
  files: [
    {
      id: 'file-id-1',
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

## ⚡ Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Direct Fetch** | ✅ | No backend round-trip needed |
| **Caching** | ✅ | IndexedDB fallback for offline |
| **Deduplication** | ✅ | Prevents duplicate requests |
| **Pagination** | ✅ | Auto-handles large folders |
| **Error Handling** | ✅ | User-friendly error messages |
| **Fallback** | ✅ | Can revert to backend if needed |

---

## 🧪 Testing

### Test in Browser Console
```javascript
// Test 1: Fetch sheet data
const data = await fetch('https://docs.google.com/spreadsheets/d/1UtT9t2LZ5NEc-wbGv44mDeDjWLxOLBQHA5yy6jiLc7E/gviz/tq?tqx=out:json&sheet=supply').then(r => r.text());
console.log(data);

// Test 2: Verify environment variables
console.log(process.env.REACT_APP_GOOGLE_API_KEY);
console.log(process.env.REACT_APP_GOOGLE_SHEET_ID);

// Test 3: Use the API directly
import('./src/utils/googleAPI.js').then(m => {
  m.fetchSheetDataDirect('supply').then(console.log);
});
```

---

## 🔒 Security Notes

✅ **API Key is read-only** - Cannot modify or delete Google Sheets/Drive data  
✅ **Public-facing key** - Intentionally exposed (standard for browser-based apps)  
✅ **CORS enabled** - Google APIs support cross-origin requests  
✅ **Rate limited** - Google enforces API quotas automatically  

---

## 📝 Common Sheet Names

Use these sheet names when calling `fetchSheetDataDirect()`:

```javascript
// Supply Inventory
await fetchSheetDataDirect('supply');

// Contact Directory
await fetchSheetDataDirect('contact');

// Calendar Events
await fetchSheetDataDirect('event');

// Add more sheet names as needed
await fetchSheetDataDirect('your-sheet-name');
```

---

## ⚠️ Troubleshooting

### "Sheet data is empty"
- Check sheet name spelling
- Ensure sheet has headers in first row
- Verify Google Sheet is shared/public

### "Access denied" error
- API key permissions may be insufficient
- Contact the Google Cloud Console admin
- Regenerate API key with correct scopes

### "Network error"
- Check internet connection
- Verify Google APIs are not blocked by firewall
- Check browser console for CORS errors

### "Data doesn't load"
- Try fallback: `await fetchSheetData('supply')` (uses backend)
- Check if backend is running
- Verify `.env` file has correct values

---

## 🎯 Already Using Direct APIs

These components are **already** using direct Google APIs:

- ✅ **SupplyInventory.js** - Fetches supply data directly
- ✅ **ContactDirectory.js** - Fetches contacts directly
- ✅ **CalendarManagement.js** - Fetches events directly
- ✅ **DocumentManagement.js** - Fetches Drive files directly

---

## 📚 Implementation Files

- **Core Implementation**: [frontend/src/utils/googleAPI.js](frontend/src/utils/googleAPI.js)
- **API Wrapper**: [frontend/src/utils/api.js](frontend/src/utils/api.js)
- **Configuration**: [.env](.env)
- **Documentation**: [GOOGLE_API_SETUP.md](GOOGLE_API_SETUP.md)

---

## 🚀 Next Steps

1. ✅ Everything is ready to use
2. Open any component that uses `fetchSheetDataDirect()`
3. Test in browser by opening DevTools
4. Verify data loads from Google Sheets
5. Monitor Network tab to see direct API calls

---

**All systems go! Your dashboard is connected to Google Sheets and Drive directly.** 🎉
