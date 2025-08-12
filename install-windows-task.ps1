# PowerBackup Windows Task Scheduler Setup
# Run this script as Administrator

param(
    [string]$PowerBackupPath = "C:\PowerBackup",
    [string]$Username = $env:USERNAME,
    [string]$Password = ""
)

Write-Host "🚀 Setting up PowerBackup Windows Task Scheduler..." -ForegroundColor Green

# Create the task action
$Action = New-ScheduledTaskAction -Execute "node.exe" -Argument "scheduler.js src/config/config.json once" -WorkingDirectory $PowerBackupPath

# Create the trigger (every hour)
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 365)

# Create task settings
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

# Create the task
$Task = New-ScheduledTask -Action $Action -Trigger $Trigger -Settings $Settings -Description "PowerBackup Hourly Backup and Pruning"

# Register the task
if ($Password) {
    Register-ScheduledTask -TaskName "PowerBackup-Scheduler" -InputObject $Task -User $Username -Password $Password
} else {
    Register-ScheduledTask -TaskName "PowerBackup-Scheduler" -InputObject $Task -User $Username
}

Write-Host "✅ PowerBackup Windows Task Scheduler installed successfully!" -ForegroundColor Green
Write-Host "📋 Task Name: PowerBackup-Scheduler" -ForegroundColor Cyan
Write-Host "⏰ Schedule: Every hour" -ForegroundColor Cyan
Write-Host "🔧 To manage: Open Task Scheduler > Task Scheduler Library > PowerBackup-Scheduler" -ForegroundColor Yellow
