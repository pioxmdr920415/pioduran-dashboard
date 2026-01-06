# 📜 MDRRMO Dashboard - Script Guide

This guide documents all available npm/yarn scripts for managing the MDRRMO Dashboard application.

## 🚀 Quick Start

### Initial Setup (First Time)
```bash
# Install all dependencies (frontend + backend)
yarn install
```

This will:
- Install frontend dependencies via `yarn` in the `frontend/` directory
- Install backend dependencies via `pip` in the `backend/` directory

## 📦 Installation Scripts

### `yarn install`
Installs dependencies for both frontend and backend.
- Runs `yarn install:frontend` and `yarn install:backend`

### `yarn install:frontend`
Installs only frontend dependencies (React, Node packages).

### `yarn install:backend`
Installs only backend dependencies (Python packages from requirements.txt).

## 🏗️ Build Scripts

### `yarn build`
Builds the frontend for production.
- Creates optimized production build in `frontend/build/`
- Minifies and bundles all assets

### `yarn build:frontend`
Alias for `yarn build` - builds frontend only.

## 🎯 Service Management Scripts

### `yarn restart`
Restarts all services (backend, frontend, MongoDB) via supervisor.
```bash
yarn restart
```

### `yarn restart:frontend`
Restarts only the frontend service.

### `yarn restart:backend`
Restarts only the backend service.

### `yarn status`
Shows the status of all running services.
```bash
yarn status
# Output:
# backend      RUNNING   pid 970, uptime 0:07:48
# frontend     RUNNING   pid 972, uptime 0:07:48
# mongodb      RUNNING   pid 973, uptime 0:07:48
```

## 📝 Log Viewing Scripts

### `yarn logs:frontend`
View frontend logs in real-time (follows log file).
```bash
yarn logs:frontend
```

### `yarn logs:backend`
View backend logs in real-time (follows log file).
```bash
yarn logs:backend
```

### `yarn logs:backend-error`
View backend error logs in real-time.
```bash
yarn logs:backend-error
```

**Tip:** Press `Ctrl+C` to exit log viewing.

## 🧪 Testing Scripts

### `yarn test`
Runs frontend tests (React Testing Library + Jest).

### `yarn test:frontend`
Alias for `yarn test`.

## 🔄 Data Synchronization Scripts

### `yarn sync`
Triggers a full sync of all Google Sheets and Drive folders.
```bash
yarn sync
```
This will:
- Sync Supply Inventory sheet
- Sync Calendar Events sheet
- Sync Contact Directory sheet
- Sync all Google Drive folders (Documents, Photos, Maps, etc.)
- Cache data in MongoDB for offline access

### `yarn health`
Check backend API health status.
```bash
yarn health
# Output: {"status":"healthy","timestamp":"2026-01-06T04:53:09.540547+00:00"}
```

## 🎮 Development Scripts

### `yarn start`
Displays a message to use supervisor for starting services.
**Note:** Services are auto-started by supervisor. Use `yarn restart` to restart them.

### `yarn start:frontend` (Manual Start)
Manually starts the frontend development server (not recommended - use supervisor).
```bash
yarn start:frontend
```

### `yarn start:backend` (Manual Start)
Manually starts the backend server (not recommended - use supervisor).
```bash
yarn start:backend
```

## 📚 Common Workflows

### After Making Backend Changes
```bash
yarn restart:backend
yarn logs:backend  # Watch logs to verify changes
```

### After Making Frontend Changes
Frontend has hot-reload enabled, so changes appear automatically.
If you need to force restart:
```bash
yarn restart:frontend
```

### After Pulling New Code
```bash
yarn install      # Install any new dependencies
yarn restart      # Restart all services
```

### Debugging Issues
```bash
yarn status                  # Check if services are running
yarn logs:backend           # Check backend logs
yarn logs:frontend          # Check frontend logs
yarn health                 # Verify API is responding
```

### Full Application Rebuild
```bash
yarn install               # Reinstall all dependencies
yarn build                # Build frontend for production
yarn restart              # Restart all services
yarn sync                 # Sync data from Google
```

## 🔍 Service URLs

- **Frontend**: http://localhost:3000 or https://your-preview-url.emergentagent.com
- **Backend API**: http://localhost:8001/api/
- **MongoDB**: mongodb://localhost:27017

## 📊 API Endpoints

Quick test commands:

```bash
# Check backend health
curl http://localhost:8001/api/health

# Sync all data
curl -X POST http://localhost:8001/api/sync/all

# Get supply inventory
curl http://localhost:8001/api/sheets/supply

# Get cache status
curl http://localhost:8001/api/cache/status

# Get Google Drive folder
curl http://localhost:8001/api/drive/folder/15_xiFeXu_vdIe2CYrjGaRCAho2OqhGvo
```

## ⚙️ Advanced: Direct Supervisor Commands

If you prefer using supervisor directly:

```bash
# View status
sudo supervisorctl status

# Restart all
sudo supervisorctl restart all

# Restart specific service
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# Stop/Start services
sudo supervisorctl stop backend
sudo supervisorctl start backend

# View logs
tail -f /var/log/supervisor/backend.out.log
tail -f /var/log/supervisor/frontend.out.log
```

## 🛠️ Troubleshooting

### Services Won't Start
```bash
yarn status                           # Check current status
sudo supervisorctl restart all        # Force restart
yarn logs:backend-error              # Check for errors
```

### Frontend Not Loading
```bash
yarn restart:frontend
curl http://localhost:3000           # Test if serving
```

### Backend API Not Responding
```bash
yarn restart:backend
yarn health                          # Test health endpoint
yarn logs:backend-error             # Check for errors
```

### Dependencies Out of Sync
```bash
cd /app/frontend && yarn install
cd /app/backend && pip install -r requirements.txt
yarn restart
```

## 📄 Environment Variables

### Backend (.env in /app/backend/)
- `MONGO_URL`: MongoDB connection string
- `DB_NAME`: Database name
- `GOOGLE_API_KEY`: Google Drive/Sheets API key
- `GOOGLE_SHEET_ID`: Main spreadsheet ID
- `CORS_ORIGINS`: Allowed CORS origins

### Frontend (.env in /app/frontend/)
- `REACT_APP_BACKEND_URL`: Backend API URL
- `WDS_SOCKET_PORT`: WebSocket port for hot reload
- `ENABLE_HEALTH_CHECK`: Health check plugin toggle

## 🎯 Summary

**Most Common Commands:**
```bash
yarn install          # Install dependencies
yarn build           # Build for production
yarn restart         # Restart all services
yarn status          # Check service status
yarn logs:backend    # View backend logs
yarn sync            # Sync Google data
yarn health          # Check API health
```

---

**For more information, see:**
- Main README: `/app/README.md`
- Backend Code: `/app/backend/server.py`
- Frontend Code: `/app/frontend/src/App.js`
