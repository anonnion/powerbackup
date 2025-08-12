# 🔋💾 PowerBackup Deployment Guide

This guide walks you through different ways to run PowerBackup with automatic hourly backups and pruning. Choose the method that best fits your setup.

## 📋 Deployment Methods at a Glance

| Method                     | Platform       | Pros                                         | Cons                      | Best For                        |
| -------------------------- | -------------- | -------------------------------------------- | ------------------------- | ------------------------------- |
| **PM2**                    | Cross-platform | Process management, monitoring, auto-restart | Extra dependency          | Production, multi-server setups |
| **Systemd**                | Linux          | Built-in, lightweight, reliable              | Linux-only                | Linux servers                   |
| **Cron**                   | Linux/Unix     | Built-in, lightweight                        | Basic logging, Unix-only  | Simple Linux/Unix setups        |
| **Windows Task Scheduler** | Windows        | Built-in                                     | Windows-only              | Windows servers                 |
| **Node.js Scheduler**      | Cross-platform | No extra dependencies                        | Process must stay running | Development, quick testing      |

## 🎯 Recommended: PM2 for Production

```bash
# Install PM2 globally
npm run install:pm2

# Create logs directory
mkdir -p logs

# Start scheduler
npm run pm2:start

# View logs
npm run pm2:logs
```

**Pro Tip:** Run `pm2 startup` and `pm2 save` to make PowerBackup start on boot.

---

## 🐧 Linux/Unix: Systemd

```bash
# Create a dedicated user
sudo useradd -r -s /bin/false powerbackup

# Set up directories
sudo mkdir -p /opt/powerbackup
sudo chown powerbackup:powerbackup /opt/powerbackup

# Copy files
sudo cp -r . /opt/powerbackup/

# Install and start service
npm run install:systemd
sudo systemctl start powerbackup
sudo systemctl enable powerbackup
```

---

## ⏰ Linux/Unix: Cron Jobs

```bash
# Make install script executable
chmod +x install-cron.sh

# Install cron job
npm run install:cron
```

Or manually add to `crontab -e`:

```bash
0 * * * * cd /path/to/powerbackup && node src/scheduler.js src/config/config.json once >> logs/cron.log 2>&1
```

---

## 🪟 Windows: Task Scheduler

```powershell
# Run PowerShell as Administrator
cd C:\path\to\powerbackup
npm run install:windows
```

Or create a basic task in Task Scheduler to run every hour with:

```
Program: node.exe
Arguments: scheduler.js src/config/config.json once
Start in: C:\path\to\powerbackup
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
npm run backup myapp

# Test restore
npm run test-restore myapp

# Prune old backups
npm run scheduler:once
```
