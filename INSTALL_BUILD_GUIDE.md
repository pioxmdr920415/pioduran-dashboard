# Install & Build Scripts

Quick scripts to install dependencies and build the MDRRMO Pio Duran Dashboard application.

## 📋 Available Scripts

### Linux/macOS
```bash
bash install-and-build.sh
```

### Windows
```cmd
install-and-build.bat
```

---

## 🚀 What These Scripts Do

1. **Installs Frontend Dependencies**
   - Runs `yarn install` in the `frontend` directory
   - Installs all React and Node.js dependencies

2. **Installs Backend Dependencies**
   - Runs `pip install -r requirements.txt` in the `backend` directory
   - Installs all Python and FastAPI dependencies

3. **Builds Frontend Application**
   - Runs `yarn build` in the `frontend` directory
   - Creates optimized production build in `frontend/build/`
   - Generates minified JavaScript and CSS

---

## ✨ Usage

### Option 1: From Terminal (Linux/macOS)
```bash
cd /path/to/pioduran-dashboard
bash install-and-build.sh
```

### Option 2: From Command Prompt (Windows)
```cmd
cd C:\path\to\pioduran-dashboard
install-and-build.bat
```

### Option 3: Manual Commands
If you prefer to run commands manually:

```bash
# Frontend
cd frontend
yarn install
yarn build

# Backend
cd backend
pip install -r requirements.txt
```

---

## 📊 Expected Output

### Successful Run
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

### Build Artifacts
- `frontend/build/` - Production-ready build folder
- `frontend/node_modules/` - Frontend dependencies
- `backend/` - Backend with Python packages installed

---

## ⚙️ System Requirements

### Required
- **Node.js** 20.0.0 or higher
- **Yarn** 1.22.0 or higher
- **Python** 3.11.0 or higher
- **pip** (Python package manager)

### Verify Installation
```bash
# Check versions
node --version      # Should be v20+
yarn --version      # Should be 1.22+
python --version    # Should be 3.11+
```

---

## 🔧 Troubleshooting

### Issue: "Command not found: yarn"
**Solution**: Install Yarn globally
```bash
npm install -g yarn
```

### Issue: "Command not found: python"
**Solution**: Install Python 3.11+ from python.org

### Issue: Port already in use
**Solution**: Kill the process on that port
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9    # Frontend port
lsof -ti:8001 | xargs kill -9    # Backend port

# Windows
netstat -ano | findstr :3000     # Find process
taskkill /PID <PID> /F          # Kill process
```

### Issue: Build fails with disk space error
**Solution**: Clear cache and rebuild
```bash
cd frontend
rm -rf node_modules build
yarn install
yarn build
```

### Issue: Permission denied on Linux/macOS
**Solution**: Make script executable
```bash
chmod +x install-and-build.sh
```

---

## 📝 Next Steps After Building

### 1. Start Development Servers

**Terminal 1 - Frontend**
```bash
cd frontend
yarn start
```

**Terminal 2 - Backend**
```bash
cd backend
uvicorn server:app --reload
```

### 2. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs

### 3. Test Features
- Create records in Supply Inventory
- Upload and view photos
- Explore maps and geospatial data
- Manage documents via Google Drive integration

---

## 📦 What Gets Installed

### Frontend Dependencies (~400 packages)
- React 18 & React Router
- Tailwind CSS
- Radix UI Components
- Leaflet for maps
- Axios for HTTP
- PhotoSwipe for galleries
- And many more...

### Backend Dependencies (~50 packages)
- FastAPI web framework
- Uvicorn ASGI server
- Motor for async MongoDB
- Pandas for data processing
- ReportLab for PDF generation
- boto3 for AWS integration
- And more...

---

## 💾 Disk Space Requirements

- **Node modules**: ~500 MB
- **Frontend build**: ~50 MB
- **Python packages**: ~200 MB
- **Total**: ~750 MB

Ensure you have at least 1 GB free disk space.

---

## ⏱️ Estimated Time

- **First run**: 3-5 minutes (initial downloads)
- **Subsequent runs**: 1-2 minutes (cached dependencies)
- **Build time**: 30-60 seconds

---

## 🛠️ Advanced Usage

### Skip Backend Installation
If you only want to build frontend:
```bash
cd frontend
yarn install
yarn build
```

### Skip Frontend Build
If you only want to install dependencies:
```bash
# Frontend
cd frontend && yarn install

# Backend
cd backend && pip install -r requirements.txt
```

### Build with Custom Flags
```bash
cd frontend
yarn build --profile          # Profile the build
yarn build --verbose          # Verbose output
```

---

## 📚 Related Scripts

Also available in the project:
- `yarn start` - Start frontend development
- `yarn build` - Build frontend production
- `bash start.sh` - Start both services together
- `npm run install` - Install all dependencies

---

## ❓ FAQ

**Q: Can I use npm instead of yarn?**  
A: Yes, replace `yarn` with `npm`:
- `yarn install` → `npm install`
- `yarn build` → `npm run build`

**Q: Do I need MongoDB running?**  
A: For development, yes. For production, configure your MongoDB URL in `.env`

**Q: Can I interrupt the script?**  
A: Yes, press `Ctrl+C` anytime. You may need to clean up manually.

**Q: Will this overwrite my changes?**  
A: No, it only installs dependencies and builds. Your source code is safe.

---

## ✅ Verification

After running the script, verify everything is ready:

```bash
# Check frontend build
ls frontend/build/index.html    # Should exist

# Check backend imports
cd backend && python -c "from server import app; print('✓ OK')"

# Check dependencies
yarn list | head -10    # Frontend packages
pip list | head -10     # Backend packages
```

---

## 🎯 Success Indicators

- ✅ `frontend/build/` folder exists
- ✅ No error messages in output
- ✅ `yarn build` completes without warnings (some are ok)
- ✅ Backend imports successfully
- ✅ All logs show green checkmarks

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify system requirements
3. Check disk space and permissions
4. Review error messages carefully
5. See project documentation in main README.md

---

**Happy building! 🚀**
