@echo off
echo Building CSV Editor...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Error: node_modules directory not found
    echo Please run install.bat first
    pause
    exit /b 1
)

REM Clean dist directory
if exist "dist" (
    echo Cleaning old build files...
    rmdir /s /q dist
)

REM Build application
echo Building Windows executable...
npm run build:win

if %errorlevel% neq 0 (
    echo Error: Build failed
    pause
    exit /b 1
)

echo.
echo Build completed!
echo Executable location: dist directory
echo.
pause 