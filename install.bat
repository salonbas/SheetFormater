@echo off
echo Installing CSV Editor dependencies...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js not found. Please install Node.js first.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm not available
    pause
    exit /b 1
)

echo npm version:
npm --version
echo.

REM Install dependencies
echo Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Installation completed!
echo.
echo To run the application:
echo   npm start
echo.
echo Development mode (with DevTools):
echo   npm run dev
echo.
echo To build executable:
echo   npm run build:win
echo.
pause 