@echo off
REM zkFlow.pro - Chrome Web Store Deployment Helper for Windows

echo ======================================================
echo zkFlow.pro - Chrome Web Store Deployment Helper
echo ======================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js is installed
echo.

REM Install dependencies if needed
if not exist "node_modules\puppeteer" (
    echo Installing Puppeteer for automation...
    call npm install puppeteer
)

REM Check if extension is built
if not exist "extension\zkflow-pro.zip" (
    echo Building extension...
    cd extension
    call npm run build
    call npm run package
    cd ..
)

REM Check if screenshots exist
if not exist "store-assets\screenshot-1-hero.png" (
    echo Generating screenshots...
    cd store-assets
    call node capture-screenshots.js
    cd ..
)

echo.
echo All files are ready!
echo.
echo Choose your deployment method:
echo.
echo 1) Automated Upload (Recommended)
echo    - Opens Chrome and fills everything automatically
echo    - You just need to review and click submit
echo.
echo 2) Manual Upload with Helper
echo    - Opens all necessary files and folders
echo    - You copy and paste the information
echo.
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Starting automated upload...
    echo.
    node chrome-store-uploader.js
) else if "%choice%"=="2" (
    echo.
    echo Opening files for manual upload...
    echo.
    
    REM Open Chrome Web Store Developer Dashboard
    start https://chrome.google.com/webstore/devconsole
    
    REM Open folders
    explorer extension
    explorer store-assets
    
    REM Open listing document
    start CHROME_STORE_LISTING.md
    
    echo.
    echo Opened all necessary files and folders
    echo.
    echo Manual upload steps:
    echo 1. Log in to Chrome Web Store Developer Dashboard
    echo 2. Click 'New Item'
    echo 3. Upload: extension\zkflow-pro.zip
    echo 4. Copy text from CHROME_STORE_LISTING.md
    echo 5. Upload screenshots from store-assets\ folder
    echo 6. Set pricing: $4.99/month for Pro
    echo 7. Submit for review!
) else (
    echo Invalid choice. Please run the script again.
    pause
    exit /b 1
)

echo.
echo Good luck with your launch!
pause