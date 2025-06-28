@echo off
echo Starting CSV Editor...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Error: node_modules directory not found
    echo Please run install.bat first
    pause
    exit /b 1
)

REM Start application
npm start 