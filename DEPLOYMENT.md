# 🚀 PowerBackup Deployment Guide

This guide covers different deployment options for running PowerBackup with automatic hourly backups and pruning.

## 📋 **Deployment Options Overview**

| Method | Platform | Pros | Cons | Best For |
|--------|----------|------|------|----------|
| **PM2** | Cross-platform | Process management, monitoring, auto-restart | Additional dependency | Production, multiple servers |
| **Systemd** | Linux | Built-in, lightweight, reliable | Linux-only | Linux servers, simple setups |
| **Cron** | Linux/Unix | Built-in, lightweight | Unix-only, basic logging | Linux/Unix servers |
| **Windows Task Scheduler** | Windows | Built-in Windows solution | Windows-only | Windows environments |
| **Node.js Scheduler** | Cross-platform | No external dependencies | Requires keeping process running | Development, simple deployments |

## 🎯 **Recommended: PM2 (Production)**

### **Installation & Setup**

```bash
# 1. Install PM2 globally
npm run install:pm2

# 2. Create logs directory
mkdir -p logs

# 3. Start PowerBackup scheduler with PM2
npm run pm2:start

# 4. Check status
npm run pm2:status

# 5. View logs
npm run pm2:logs
```

### **PM2 Management Commands**

```bash
# Start the scheduler
npm run pm2:start

# Stop the scheduler
npm run pm2:stop

# Restart the scheduler
npm run pm2:restart

# View status
npm run pm2:status

# View logs
npm run pm2:logs

# Monitor in real-time
npm run pm2:monit

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
pm2 save
```

### **PM2 Configuration (ecosystem.config.js)**

```javascript
module.exports = {
  apps: [
    {
      name: 'powerbackup-scheduler',
      script: './src/scheduler.js',
      args: './src/config/config.json daemon',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info'
      },
      error_file: './logs/powerbackup-error.log',
      out_file: './logs/powerbackup-out.log',
      log_file: './logs/powerbackup-combined.log',
      time: true
    }
  ]
};
```

## 🐧 **Linux/Unix: Systemd Service**

### **Installation**

```bash
# 1. Create powerbackup user (optional but recommended)
sudo useradd -r -s /bin/false powerbackup

# 2. Set up directories
sudo mkdir -p /opt/powerbackup
sudo chown powerbackup:powerbackup /opt/powerbackup

# 3. Copy PowerBackup to /opt/powerbackup
sudo cp -r . /opt/powerbackup/

# 4. Install systemd service
npm run install:systemd

# 5. Start the service
sudo systemctl start powerbackup

# 6. Enable auto-start on boot
sudo systemctl enable powerbackup
```

### **Systemd Management**

```bash
# Start service
sudo systemctl start powerbackup

# Stop service
sudo systemctl stop powerbackup

# Restart service
sudo systemctl restart powerbackup

# Check status
sudo systemctl status powerbackup

# View logs
sudo journalctl -u powerbackup -f

# Enable auto-start
sudo systemctl enable powerbackup

# Disable auto-start
sudo systemctl disable powerbackup
```

## ⏰ **Linux/Unix: Cron Jobs**

### **Installation**

```bash
# 1. Make the script executable
chmod +x install-cron.sh

# 2. Run the installation script
npm run install:cron
```

### **Manual Cron Setup**

```bash
# Edit crontab
crontab -e

# Add this line for hourly backups
0 * * * * cd /path/to/powerbackup && node src/scheduler.js src/config/config.json once >> logs/cron.log 2>&1

# View current cron jobs
crontab -l

# Remove cron jobs
crontab -r
```

## 🪟 **Windows: Task Scheduler**

### **Installation**

```powershell
# 1. Run PowerShell as Administrator

# 2. Navigate to PowerBackup directory
cd C:\path\to\powerbackup

# 3. Run the installation script
npm run install:windows

# 4. Or run manually
powershell -ExecutionPolicy Bypass -File install-windows-task.ps1
```

### **Manual Windows Task Setup**

1. **Open Task Scheduler** (taskschd.msc)
2. **Create Basic Task**:
   - Name: `PowerBackup-Scheduler`
   - Trigger: Daily, repeat every 1 hour
   - Action: Start a program
   - Program: `node.exe`
   - Arguments: `scheduler.js src/config/config.json once`
   - Start in: `C:\path\to\powerbackup`

## 🔧 **Configuration**

### **Retention Rules**

Configure retention in `src/config/config.json`:

```json
{
  "databases": [
    {
      "name": "myapp",
      "type": "mysql",
      "url": "mysql://user:pass@localhost/myapp",
      "keep": {
        "hourly": 24,    // Keep 24 hourly backups
        "daily": 7,      // Keep 7 daily backups
        "weekly": 4,     // Keep 4 weekly backups
        "monthly": 12,   // Keep 12 monthly backups
        "yearly": 0      // Keep 0 yearly backups
      },
      "test_restore": {
        "enabled": true,
        "hour": 3        // Run test restore at 3 AM
      }
    }
  ]
}
```

### **Environment Variables**

```bash
# Logging level
export LOG_LEVEL="info"  # error, warn, info, success, debug

# Node environment
export NODE_ENV="production"

# Custom config path
export POWERBACKUP_CONFIG="/path/to/config.json"
```

## 📊 **Monitoring & Logs**

### **PM2 Monitoring**

```bash
# Real-time monitoring
npm run pm2:monit

# View logs
npm run pm2:logs

# View status
npm run pm2:status

# View detailed info
pm2 show powerbackup-scheduler
```

### **Systemd Monitoring**

```bash
# View service status
sudo systemctl status powerbackup

# View logs
sudo journalctl -u powerbackup -f

# View recent logs
sudo journalctl -u powerbackup --since "1 hour ago"
```

### **Cron Monitoring**

```bash
# View cron logs
tail -f logs/cron.log

# Check cron job status
crontab -l

# View system cron logs
sudo tail -f /var/log/cron
```

## 🚨 **Troubleshooting**

### **Common Issues**

**1. Permission Denied**
```bash
# Fix file permissions
chmod +x src/scheduler.js
chmod +x install-cron.sh

# Fix directory permissions
chmod 755 backups/
chmod 755 logs/
```

**2. PM2 Process Not Starting**
```bash
# Check PM2 logs
pm2 logs powerbackup-scheduler

# Restart PM2
pm2 kill
pm2 start ecosystem.config.js
```

**3. Systemd Service Failing**
```bash
# Check service status
sudo systemctl status powerbackup

# View detailed logs
sudo journalctl -u powerbackup -n 50

# Test service manually
sudo -u powerbackup node src/scheduler.js src/config/config.json once
```

**4. Cron Job Not Running**
```bash
# Check cron service
sudo systemctl status cron

# Test cron job manually
cd /path/to/powerbackup && node src/scheduler.js src/config/config.json once

# Check cron logs
tail -f logs/cron.log
```

### **Debug Mode**

```bash
# Enable debug logging
export LOG_LEVEL="debug"

# Run scheduler in debug mode
node src/scheduler.js src/config/config.json once
```

## 🔒 **Security Considerations**

### **File Permissions**

```bash
# Secure config file
chmod 600 src/config/config.json
chmod 600 src/config/passphrase

# Secure backup directory
chmod 750 backups/

# Secure logs directory
chmod 750 logs/
```

### **User Permissions**

```bash
# Create dedicated user (Linux)
sudo useradd -r -s /bin/false powerbackup
sudo chown -R powerbackup:powerbackup /opt/powerbackup
```

### **Network Security**

- Use encrypted database connections
- Store database credentials securely
- Use GPG encryption for backups
- Restrict access to backup directories

## 📈 **Performance Optimization**

### **Resource Limits**

```bash
# PM2 memory limit
max_memory_restart: '1G'

# Systemd resource limits
LimitNOFILE=65536
LimitNPROC=4096
```

### **Backup Optimization**

- Use schema-only backups for large databases
- Implement incremental backups
- Compress backups with gzip
- Use parallel processing for multiple databases

## 🔄 **Backup & Restore**

### **Backup Scheduler**

```bash
# Backup scheduler configuration
npm run scheduler:once    # Run once
npm run scheduler:daemon  # Run continuously
```

### **Manual Operations**

```bash
# Manual backup
npm run backup myapp

# Manual test restore
npm run test-restore myapp

# Manual pruning
npm run scheduler:once
```

---

**🌟 Choose the deployment method that best fits your environment and requirements!**
