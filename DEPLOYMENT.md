# 🔋💾 PowerBackup Deployment Guide

This guide walks you through deploying PowerBackup globally and setting up automatic hourly backups with pruning. PowerBackup is designed for Linux environments but works cross-platform.

## 📋 Deployment Methods at a Glance

| Method                     | Platform       | Pros                                         | Cons                      | Best For                        |
| -------------------------- | -------------- | -------------------------------------------- | ------------------------- | ------------------------------- |
| **PM2**                    | Cross-platform | Process management, monitoring, auto-restart | Extra dependency          | Production, multi-server setups |
| **Systemd**                | Linux          | Built-in, lightweight, reliable              | Linux-only                | Linux servers                   |
| **Cron**                   | Linux/Unix     | Built-in, lightweight                        | Basic logging, Unix-only  | Simple Linux/Unix setups        |
| **Windows Task Scheduler** | Windows        | Built-in                                     | Windows-only              | Windows servers                 |
| **Node.js Scheduler**      | Cross-platform | No extra dependencies                        | Process must stay running | Development, quick testing      |

## 🎯 Recommended: Global Installation with PM2

```bash
# Install PowerBackup globally
npm install -g powerbackup

# Initialize PowerBackup
powerbackup init

# Configure database binary paths (will auto-detect common installations)
powerbackup set-binary-path

# Or manually set binary paths if auto-detection fails
powerbackup set-binary-path --mysql /usr/bin --postgres /usr/lib/postgresql/15/bin

# Add your databases
powerbackup add-db

# Install PM2 globally
npm install -g pm2

# Start scheduler with PM2
pm2 start powerbackup -- scheduler:daemon

# Save PM2 configuration
pm2 save
pm2 startup

# View logs
pm2 logs powerbackup
```

**Pro Tip:** This setup provides process management, monitoring, and auto-restart capabilities.

---

## 🐧 Linux/Unix: Systemd Service

```bash
# Install PowerBackup globally
sudo npm install -g powerbackup

# Create a dedicated user
sudo useradd -r -s /bin/false powerbackup

# Set up directories
sudo mkdir -p /opt/powerbackup
sudo chown powerbackup:powerbackup /opt/powerbackup

# Initialize PowerBackup as the service user
sudo -u powerbackup powerbackup init

# Install systemd service
sudo cp powerbackup.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable powerbackup
sudo systemctl start powerbackup

# Check status
sudo systemctl status powerbackup
```

---

## ⏰ Linux/Unix: Cron Jobs

```bash
# Install PowerBackup globally
sudo npm install -g powerbackup

# Initialize PowerBackup
powerbackup init

# Add your databases
powerbackup add-db

# Add to crontab (run every hour)
crontab -e
```

Add this line to your crontab:

```bash
0 * * * * powerbackup scheduler:once >> ~/powerbackup.log 2>&1
```

Or use the provided script:

```bash
chmod +x install-cron.sh
./install-cron.sh
```

---

## 🪟 Windows: Task Scheduler

### Automated Setup

```powershell
# Run PowerShell as Administrator
npm run install:windows
```

### Manual Setup

```powershell
# Install PowerBackup globally
npm install -g powerbackup

# Initialize PowerBackup
powerbackup init

# Add your databases
powerbackup add-db

# Create a scheduled task manually
schtasks /create /tn "PowerBackup" /tr "powerbackup scheduler:once" /sc hourly /ru "SYSTEM"

# Or create a PowerShell script for manual execution
New-Item -Path "C:\Scripts\powerbackup-run.ps1" -ItemType File -Force
Add-Content -Path "C:\Scripts\powerbackup-run.ps1" -Value "powerbackup scheduler:once"
```

### Using the Setup Script

```powershell
# Run the Windows setup script (PowerShell)
.\setup.ps1

# With options
.\setup.ps1 -SkipTests -SkipGPG
```

```cmd
# Run the Windows setup script (Batch)
.\setup.bat

# With options
.\setup.bat --skip-tests --skip-gpg
```

---

## 🔧 Configuration

Retention settings in `src/config/config.json`:

```json
"keep": {
  "hourly": 24,
  "daily": 7,
  "weekly": 4,
  "monthly": 12,
  "yearly": 0
}
```

Environment variables:

```bash
export LOG_LEVEL="info" # error, warn, info, success, debug
export NODE_ENV="production"
export POWERBACKUP_CONFIG="/path/to/config.json"
```

---

## 📊 Monitoring

**PM2:**

```bash
npm run pm2:monit
npm run pm2:logs
```

**Systemd:**

```bash
sudo systemctl status powerbackup
sudo journalctl -u powerbackup -f
```

**Cron:**

```bash
tail -f logs/cron.log
```

---

## 🚨 Troubleshooting

**Permissions:**

```bash
chmod +x src/scheduler.js install-cron.sh
chmod 755 backups/ logs/
```

**PM2 not starting:**

```bash
pm2 logs powerbackup-scheduler
pm2 restart ecosystem.config.js
```

**Systemd issues:**

```bash
sudo systemctl status powerbackup
sudo journalctl -u powerbackup -n 50
```

**Cron not running:**

```bash
sudo systemctl status cron
tail -f logs/cron.log
```

---

## 🔒 Security

* Use `chmod 600` for config and passphrase files
* Restrict backup/log directory access
* Use GPG encryption and secure DB credentials

---

## 📈 Performance Tips

* Limit memory in PM2 with `max_memory_restart`
* Use gzip compression
* Use schema-only or incremental backups for large DBs

---

## 🔄 Manual Backup & Restore

```bash
# Run backup once
powerbackup create-now myapp

# Test restore
powerbackup test-restore myapp

# Prune old backups
powerbackup scheduler:once
```
