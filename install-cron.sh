#!/bin/bash

# PowerBackup Cron Setup Script
# Run this script as the user who will run the backups

set -e

POWERBACKUP_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRON_USER=$(whoami)

echo "🚀 Setting up PowerBackup Cron Jobs..."

# Create logs directory
mkdir -p "$POWERBACKUP_PATH/logs"

# Create the cron job entry
CRON_JOB="0 * * * * cd $POWERBACKUP_PATH && node src/scheduler.js src/config/config.json once >> logs/cron.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "powerbackup"; then
    echo "⚠️  PowerBackup cron job already exists. Removing old entry..."
    crontab -l 2>/dev/null | grep -v "powerbackup" | crontab -
fi

# Add the new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ PowerBackup Cron Jobs installed successfully!"
echo "📋 Cron Job: $CRON_JOB"
echo "⏰ Schedule: Every hour at minute 0"
echo "📁 Logs: $POWERBACKUP_PATH/logs/cron.log"
echo "🔧 To manage: crontab -e"

# Test the scheduler
echo "🧪 Testing scheduler..."
cd "$POWERBACKUP_PATH"
node src/scheduler.js src/config/config.json once

echo "✅ Setup completed successfully!"
