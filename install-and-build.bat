@echo off
REM Install and Build Script for MDRRMO Pio Duran Dashboard
REM Run this script from the pioduran-dashboard root folder
REM Usage: install-and-build.bat

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo     MDRRMO Dashboard - Install ^& Build Script
echo ============================================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo Error: package.json not found!
    echo Please run this script from the pioduran-dashboard root folder
    exit /b 1
)

set FAILED=0

REM Step 1: Install Frontend Dependencies
echo ============================================================
echo Step 1: Installing Frontend Dependencies
echo ============================================================
echo.

if exist "frontend" (
    cd frontend
    
    if exist "package.json" (
        echo Running: yarn install
        call yarn install
        if !errorlevel! equ 0 (
            echo [OK] Frontend dependencies installed
        ) else (
            echo [ERROR] Failed to install frontend dependencies
            set FAILED=1
        )
    ) else (
        echo [ERROR] frontend/package.json not found
        set FAILED=1
    )
    
    cd ..
) else (
    echo [ERROR] frontend directory not found
    set FAILED=1
)

echo.

REM Step 2: Install Backend Dependencies
echo ============================================================
echo Step 2: Installing Backend Dependencies
echo ============================================================
echo.

if exist "backend" (
    cd backend
    
    if exist "requirements.txt" (
        echo Running: pip install -r requirements.txt
        call pip install -r requirements.txt --quiet
        if !errorlevel! equ 0 (
            echo [OK] Backend dependencies installed
        ) else (
            echo [ERROR] Failed to install backend dependencies
            set FAILED=1
        )
    ) else (
        echo [ERROR] backend/requirements.txt not found
        set FAILED=1
    )
    
    cd ..
) else (
    echo [ERROR] backend directory not found
    set FAILED=1
)

echo.

REM Step 3: Build Frontend
echo ============================================================
echo Step 3: Building Frontend Application
echo ============================================================
echo.

if exist "frontend" (
    cd frontend
    
    echo Running: yarn build
    echo (This may take a minute...)
    call yarn build
    if !errorlevel! equ 0 (
        echo [OK] Frontend build completed
        
        if exist "build" (
            echo Build folder created successfully
        )
    ) else (
        echo [ERROR] Frontend build failed
        set FAILED=1
    )
    
    cd ..
) else (
    echo [ERROR] frontend directory not found
    set FAILED=1
)

echo.

REM Summary
echo ============================================================
echo Summary
echo ============================================================
echo.

if !FAILED! equ 0 (
    echo [SUCCESS] All tasks completed successfully!
    echo.
    echo Next steps:
    echo.
    echo   1. Start Frontend:
    echo      cd frontend ^&^& yarn start
    echo      - Opens http://localhost:3000
    echo.
    echo   2. Start Backend (in another terminal):
    echo      cd backend ^&^& uvicorn server:app --reload
    echo      - API at http://localhost:8001
    echo.
    echo Production Build:
    echo   Frontend is ready at: frontend\build\
    echo   Serve with: npx serve -s frontend\build
    echo.
) else (
    echo [ERROR] Some tasks failed. Please check the errors above.
    exit /b 1
)

echo ============================================================
echo.
endlocal
