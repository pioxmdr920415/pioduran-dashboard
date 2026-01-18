# ⚡ Quick Start Guide

## 🎯 In 30 Seconds

### Start Frontend (Development)
```bash
cd /workspaces/pioduran-dashboard/frontend
yarn start
```
➜ Opens http://localhost:3000

### Start Backend (Development)  
```bash
cd /workspaces/pioduran-dashboard/backend
uvicorn server:app --reload
```
➜ API at http://localhost:8001

---

## 📦 What's Ready

| Item | Status |
|------|--------|
| Frontend Build | ✅ Complete in `frontend/build/` |
| Backend Code | ✅ Ready to run |
| Dependencies | ✅ All installed |
| Environment Variables | ✅ Configured |
| Google Integration | ✅ Working |

---

## 🚀 Three Ways to Run

### 1️⃣ Separate Windows/Tabs
```bash
# Terminal 1 - Frontend
cd frontend && yarn start

# Terminal 2 - Backend  
cd backend && uvicorn server:app --reload
```

### 2️⃣ Single Script (if you have `lsof`)
```bash
bash start.sh
```

### 3️⃣ Production
```bash
# Frontend - serve build folder
npx serve -s frontend/build

# Backend
cd backend && uvicorn server:app --workers 4
```

---

## ✅ Verify Everything Works

```bash
# Frontend build exists
ls frontend/build/index.html

# Backend imports successfully
cd backend && python -c "from server import app; print('OK')"

# All components present
ls frontend/src/components/{EditRecordModal,AddRecordModal,DeleteConfirmDialog,ContactDirectory}.*
```

---

## 🔗 API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Health check |
| `POST /api/sheets/{type}` | Create record |
| `PUT /api/sheets/{type}/{id}` | Update record |
| `DELETE /api/sheets/{type}/{id}` | Delete record |
| `POST /api/bulk/import` | Import data |
| `POST /api/bulk/export` | Export data |

**Docs**: http://localhost:8001/docs (when backend running)

---

## 🎨 Frontend Features

- Dashboard with maps
- Supply inventory management
- Calendar/events
- Document management
- Photo gallery with 360° viewer
- Geospatial analysis
- Bulk operations
- Export/import
- Dark mode
- Offline support (PWA)

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | `lsof -ti:3000 \| xargs kill -9` |
| Port 8001 in use | `lsof -ti:8001 \| xargs kill -9` |
| Module not found | `cd frontend && yarn install` |
| Backend import fails | Check Python version (3.11+) |
| Build too old | `cd frontend && yarn build` |

---

## 📖 Full Docs

- **BUILD_SUMMARY.md** - Complete build details
- **DEPLOYMENT_READY.md** - Deployment checklist
- **frontend/README.md** - Frontend setup
- **backend/server.py** - Backend documentation

---

## 🎉 You're All Set!

**Frontend**: http://localhost:3000  
**Backend API**: http://localhost:8001  
**API Docs**: http://localhost:8001/docs  

Happy coding! 🚀
