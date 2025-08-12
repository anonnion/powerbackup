@echo off
REM PowerBackup Windows Setup Script (Batch Version)
REM This script sets up PowerBackup on Windows systems

echo ========================================
echo    PowerBackup Windows Setup Script
echo ========================================
echo.
echo Starting PowerBackup Windows setup...
echo.

REM Check Node.js installation
echo [INFO] Checking Node.js installation...

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo [INFO] Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in PATH
    echo [INFO] Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [SUCCESS] Node.js and npm found
echo.

REM Install dependencies
echo [INFO] Installing dependencies...
echo This may take a few minutes...

npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [SUCCESS] Dependencies installed successfully
echo.

REM Create directories
echo [INFO] Creating directories...

if not exist "backups" mkdir backups
if not exist "logs" mkdir logs
if not exist "src\config" mkdir src\config

echo [SUCCESS] Directories created
echo.

REM Setup configuration
echo [INFO] Setting up configuration...

if exist "src\config\config.json" (
    echo [WARNING] Configuration file already exists: src\config\config.json
    set /p overwrite="Overwrite? (y/N): "
    if /i "%overwrite%"=="y" (
        goto :create_config
    ) else (
        echo [INFO] Skipping configuration setup
        goto :gpg_setup
    )
) else (
    goto :create_config
)

:create_config
echo Creating default configuration...
echo {> src\config\config.json
echo   "backup_directory": "./backups",>> src\config\config.json
echo   "databases": {},>> src\config\config.json
echo   "encryption": {>> src\config\config.json
echo     "enabled": true,>> src\config\config.json
echo     "symmetric_passphrase_file": "./src/config/passphrase",>> src\config\config.json
echo     "keyring_path": "./src/config/keyring.gpg">> src\config\config.json
echo   },>> src\config\config.json
echo   "compression": {>> src\config\config.json
echo     "enabled": true,>> src\config\config.json
echo     "algorithm": "gzip">> src\config\config.json
echo   },>> src\config\config.json
echo   "logging": {>> src\config\config.json
echo     "level": "info",>> src\config\config.json
echo     "file": "./logs/powerbackup.log",>> src\config\config.json
echo     "max_size": "10m",>> src\config\config.json
echo     "max_files": 5>> src\config\config.json
echo   }>> src\config\config.json
echo }>> src\config\config.json

echo [SUCCESS] Configuration saved to: src\config\config.json
echo.

:gpg_setup
REM Setup GPG encryption (optional)
if "%1"=="--skip-gpg" goto :run_tests

echo [INFO] Setting up GPG encryption...

gpg --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] GPG is not installed or not in PATH
    echo [INFO] To enable encryption, install GPG and run this script again
    echo [INFO] Download from: https://www.gpg4win.org/
    goto :run_tests
)

echo [SUCCESS] GPG found

if exist "src\config\passphrase" (
    echo [WARNING] GPG passphrase file already exists. Skipping...
) else (
    echo Creating GPG passphrase file...
    echo YourSecurePassphrase123! > src\config\passphrase
    echo [SUCCESS] GPG passphrase file created
    echo [WARNING] Keep your passphrase secure! It is stored in src\config\passphrase
)
echo.

:run_tests
REM Run tests
if "%1"=="--skip-tests" goto :next_steps

echo [INFO] Running tests...

npm run test:all
if %errorlevel% neq 0 (
    echo [WARNING] Some tests failed. This is normal if databases are not configured.
) else (
    echo [SUCCESS] All tests passed
)
echo.

:next_steps
REM Show next steps
echo.
echo ========================================
echo    Setup Completed Successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Edit src\config\config.json with your database settings
echo 2. Test the installation: powerbackup --help
echo 3. Create your first backup: powerbackup create-now ^<database-name^>
echo 4. Set up automated scheduling: see DEPLOYMENT.md
echo.
echo Documentation:
echo - README.md - Quick start guide
echo - DEPLOYMENT.md - Deployment options
echo.
echo Useful commands:
echo - powerbackup --help - Show all available commands
echo - powerbackup list-dbs - List configured databases
echo - npm run test:all - Run all tests
echo.
echo Windows-specific:
echo - Use Task Scheduler for automated backups
echo - Run as Administrator for system-wide installation
echo.
pause
