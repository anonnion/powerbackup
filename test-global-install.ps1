# 🚀 PowerBackup Global Installation Test Script (Windows)

Write-Host "🧪 Testing PowerBackup Global Installation..." -ForegroundColor Cyan

# Test 1: Check if powerbackup command exists
Write-Host "📋 Test 1: Checking if powerbackup command is available..." -ForegroundColor Yellow
try {
    $null = Get-Command powerbackup -ErrorAction Stop
    Write-Host "✅ powerbackup command found" -ForegroundColor Green
} catch {
    Write-Host "❌ powerbackup command not found" -ForegroundColor Red
    Write-Host "💡 Try running: npm install -g powerbackup" -ForegroundColor Yellow
    exit 1
}

# Test 2: Test help command
Write-Host "📋 Test 2: Testing help command..." -ForegroundColor Yellow
try {
    $null = powerbackup --help 2>$null
    Write-Host "✅ Help command works" -ForegroundColor Green
} catch {
    Write-Host "❌ Help command failed" -ForegroundColor Red
    exit 1
}

# Test 3: Test init command (without actually running it)
Write-Host "📋 Test 3: Testing init command structure..." -ForegroundColor Yellow
try {
    $null = powerbackup init --help 2>$null
    Write-Host "✅ Init command structure works" -ForegroundColor Green
} catch {
    Write-Host "❌ Init command structure failed" -ForegroundColor Red
    exit 1
}

# Test 4: Test list-dbs command
Write-Host "📋 Test 4: Testing list-dbs command..." -ForegroundColor Yellow
try {
    $null = powerbackup list-dbs 2>$null
    Write-Host "✅ List-dbs command works" -ForegroundColor Green
} catch {
    Write-Host "❌ List-dbs command failed" -ForegroundColor Red
    exit 1
}

# Test 5: Test version
Write-Host "📋 Test 5: Testing version command..." -ForegroundColor Yellow
$versionOutput = powerbackup --version 2>$null
if ($versionOutput -match '2.2.0') {
    Write-Host "✅ Version command works and version is 2.2.0" -ForegroundColor Green
} else {
    Write-Host "❌ Version command failed or version mismatch" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 All tests passed! PowerBackup is ready for global use." -ForegroundColor Green
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Yellow
Write-Host "   powerbackup init          # Initialize configuration" -ForegroundColor Cyan
Write-Host "   powerbackup add-db        # Add your first database" -ForegroundColor Cyan
Write-Host "   powerbackup create-now <db> # Create your first backup" -ForegroundColor Cyan

