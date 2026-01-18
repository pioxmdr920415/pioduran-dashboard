# Install & Build Scripts - Quick Reference

## 📍 Location
Both scripts are in the **root folder**: `/workspaces/pioduran-dashboard/`

## 🚀 Quick Start

### Linux/macOS
```bash
cd /workspaces/pioduran-dashboard
bash install-and-build.sh
```

### Windows
```cmd
cd C:\path\to\pioduran-dashboard
install-and-build.bat
```

---

## 📋 What the Scripts Do

The scripts automate the entire setup process:

1. ✅ **Install Frontend Dependencies** (`yarn install`)
2. ✅ **Install Backend Dependencies** (`pip install -r requirements.txt`)
3. ✅ **Build Frontend Application** (`yarn build`)

---

## ⏱️ Execution Time

| Step | Time |
|------|------|
| Frontend install | 30-60 seconds |
| Backend install | 1-2 minutes |
| Frontend build | 30-60 seconds |
| **Total (first run)** | **3-4 minutes** |
| **Total (cached)** | **1-2 minutes** |

---

## ✅ Expected Output

```
✅ All tasks completed successfully!

Next steps:

  1. Start Frontend:
     cd frontend && yarn start
     → http://localhost:3000

  2. Start Backend (in another terminal):
     cd backend && uvicorn server:app --reload
     → http://localhost:8001

Production Build:
  Frontend is ready at: frontend/build/
  Serve with: npx serve -s frontend/build
```

---

## 📁 Files Included

| File | Purpose | Platform |
|------|---------|----------|
| `install-and-build.sh` | Main install & build script | Linux/macOS |
| `install-and-build.bat` | Install & build script | Windows |
| `INSTALL_BUILD_GUIDE.md` | Complete documentation | All |

---

## 🎯 After Building

### Option 1: Development Mode
```bash
# Terminal 1
cd frontend && yarn start

# Terminal 2
cd backend && uvicorn server:app --reload
```

### Option 2: Production Mode
```bash
# Frontend (already built)
npx serve -s frontend/build

# Backend
cd backend && uvicorn server:app
```

### Option 3: Auto-Start Both
```bash
bash start.sh
```

---

## 🔍 Verification

After the script completes, verify everything:

```bash
# Check frontend build
ls frontend/build/index.html

# Check backend imports
cd backend && python -c "from server import app; print('✓ Backend OK')"
```

---

## 🐛 Troubleshooting

### Script Won't Run
```bash
# Make executable (Linux/macOS)
chmod +x install-and-build.sh
```

### Port Already in Use
```bash
# Kill existing processes
lsof -ti:3000 | xargs kill -9    # Frontend
lsof -ti:8001 | xargs kill -9    # Backend
```

### Out of Disk Space
```bash
# Clean and rebuild
cd frontend && rm -rf node_modules build
yarn install && yarn build
```

### Dependency Installation Failed
```bash
# Clear cache and retry
yarn cache clean
pip cache purge
bash install-and-build.sh
```

---

## 📚 More Information

For detailed information, see: `INSTALL_BUILD_GUIDE.md`

---

## 🎉 Ready to Go!

Once the script completes successfully:
- ✅ Frontend is built and ready
- ✅ Backend is configured and ready
- ✅ All dependencies are installed
- ✅ Application is ready to run

**Start developing! 🚀**
