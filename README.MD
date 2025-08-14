# 🔋💾 PowerBackup v2.2.6

**Backups you’ll actually enjoy running — secure, reliable, and beautiful.**

[![CI/CD Pipeline](https://github.com/anonnion/powerbackup/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/anonnion/powerbackup/actions/workflows/ci.yml)
[![Test Suite](https://github.com/anonnion/powerbackup/workflows/Test%20Suite/badge.svg)](https://github.com/anonnion/powerbackup/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/powerbackup.svg)](https://www.npmjs.com/package/powerbackup)
[![npm downloads](https://img.shields.io/npm/dm/powerbackup.svg)](https://www.npmjs.com/package/powerbackup)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Test Coverage](https://img.shields.io/badge/test%20coverage-97.6%25-brightgreen.svg)](https://github.com/anonnion/powerbackup)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.2.6-orange.svg)](package.json)
 
> **The Beautiful Backup Experience** — PowerBackup isn’t just another backup script.
> It’s a modern, developer-friendly tool for MySQL & PostgreSQL that mixes
> *enterprise-grade reliability* with *emoji-powered, human-readable logging*.

From daily automated backups to one-off table restores, PowerBackup gives you **full control** without drowning you in complexity. And yes — you can test your backups anytime, so you know they’ll work when you actually need them.

---

## ✨ Highlights

### 🎨 Looks Good, Works Great

* Rich emoji logs with timestamps you can read at a glance
* ASCII art banners for extra joy when things start up
* Progress bars and interactive CLI for smooth workflows

### 🔐 Serious About Security

* GPG encryption (passphrase or public key)
* Secure storage with Gzip compression
* Encryption optional but highly recommended

### 🗄 Multi-DB, One Tool

* MySQL and PostgreSQL out of the box
* Easily extensible for other databases

### 🎯 Restore Without Fear

* Test restores in a safe temporary DB
* Full DB or single-table restores
* Schema-only backups for quick snapshots

### 🔄 Smart Backup Management

* Retention rules to prune old backups automatically
* Incremental-friendly
* AWS S3 integration with auto-rotation

---

## 🚀 Quick Start

### Global Installation (Recommended)

```bash
# Install globally
npm install -g powerbackup

# Initialize PowerBackup (automatically detects your OS and runs appropriate setup)
powerbackup init

# Add your first database
powerbackup add-db

# Create your first backup
powerbackup create-now mydatabase

# Test restore safely
powerbackup test-restore mydatabase
```

**💡 Smart Setup:** The `powerbackup init` command automatically detects your operating system and runs the appropriate setup script:
- **Windows**: Runs `setup.bat` for Windows-specific configuration
- **Linux/macOS**: Runs `setup.sh` for Unix-based systems
- **Fallback**: If setup scripts aren't available, runs basic initialization

### Local Development

```bash
git clone https://github.com/anonnion/powerbackup.git
cd powerbackup

# Install dependencies
npm install

# Show beautiful help
npm run help
```

### First Backup

```bash
# List your databases
powerbackup list-dbs

# Make a backup
powerbackup create-now mydatabase

# Safely test-restore it
powerbackup test-restore mydatabase
```

---

## 📋 Command Cheatsheet

| Command                     | What it does                       |
| --------------------------- | ---------------------------------- |
| `powerbackup`               | Show beautiful help with emoji goodness |
| `powerbackup init`          | Initialize PowerBackup configuration |
| `powerbackup set-binary-path` | Configure MySQL/PostgreSQL executable paths |
| `powerbackup list-dbs`      | See configured databases           |
| `powerbackup add-db`        | Add a new DB interactively         |
| `powerbackup create-now <db>` | Backup instantly                   |
| `powerbackup test-restore <db>` | Safe restore to temp DB            |
| `powerbackup restore <db>`  | Actual restore (destructive)       |
| `powerbackup list-tables <db>` | List tables in backup              |
| `powerbackup interactive-restore <db>` | Pick specific tables to restore    |

For all commands, options, and advanced usage, scroll down to [Command Reference](#-command-reference).

---

## 🎨 Features

### User Experience That Doesn’t Suck

* Colorful, emoji-rich logs with timestamps
* ASCII art banners on startup
* Real-time progress indicators
* Interactive CLI prompts that guide you through choices

### Security You Can Trust

* GPG encryption with both symmetric (passphrase) & asymmetric (public key) modes
* Gzip compression to keep backups smaller
* Works seamlessly with secure storage environments

### Multiple Databases, One Workflow

* Full MySQL & PostgreSQL support
* Easy to add more DB types

### Granular Restores

* Restore whole databases or just individual tables
* Schema-only backups
* Interactive selection for precision restores

### Smart Restore Options

* Test restores to verify backups without touching production
* Destructive restores for when you need to overwrite
* Table restores with data integrity checks

### Optimization Built In

* Gzip compression
* Incremental-friendly
* Automatic retention pruning

### Cloud-Ready

* Push backups to AWS S3 directly
* Hourly/daily/weekly/monthly/yearly retention tiers
* Auto-rotate backups to save space

### Fully Tested

* 97%+ coverage with unit & integration tests
* Color-coded, progress-based test output

---

## 📦 Installation & Setup

### Requirements

* Node.js 18+
* MySQL or PostgreSQL connection
* GPG (optional, for encryption)

### Install

#### Global Installation (Recommended)

```bash
# Install globally
npm install -g powerbackup

# Initialize PowerBackup
powerbackup init
```

#### Local Development

```bash
# Clone the repository
git clone https://github.com/anonnion/powerbackup.git
cd powerbackup

# Install dependencies
npm install

# Or install globally for system-wide access
npm install -g .
```

#### Windows-Specific Setup

```powershell
# Option 1: Automated Setup (Recommended)
# Run PowerShell as Administrator
.\setup.ps1

# Option 2: Batch File Setup (Alternative)
# Run Command Prompt as Administrator
.\setup.bat

# Option 3: Manual Setup
# Install Node.js (if not already installed)
# Download from https://nodejs.org/

# Install PowerBackup globally
npm install -g powerbackup

# Initialize PowerBackup
powerbackup init

# Add your databases
powerbackup add-db

# Test the installation
powerbackup --help
```

### Configure

Edit `src/config/config.json` with your DB settings, retention policies, and optional encryption keys. Example:

```json
{
  "backup_dir": "../../backups",
  "gpg": {
    "symmetric_passphrase_file": "./src/config/passphrase",
    "recipients": []
  },
  "databases": [
    {
      "name": "myapp",
      "type": "mysql",
      "url": "mysql://user:pass@localhost:3306/myapp",
      "keep": {
        "hourly": 24,
        "daily": 7,
        "weekly": 4,
        "monthly": 12,
        "yearly": 0
      },
      "test_restore": {
        "enabled": true,
        "verify_query": "SELECT COUNT(*) FROM information_schema.tables",
        "hour": 3
      }
    }
  ]
}
```

### Environment Variables

```bash
export MYSQL_URL="mysql://user:pass@localhost:3306/db"
export POSTGRES_URL="postgresql://user:pass@localhost:5432/db"
export LOG_LEVEL="debug"
```

---

## 🛠 Command Reference


### 🎯 **Quick Commands**
| Command | Description | Example |
|---------|-------------|---------|
| `powerbackup` | Show beautiful help guide | `powerbackup` |
| `powerbackup list-dbs` | List configured databases | `powerbackup list-dbs` |
| `powerbackup add-db` | Add new database interactively | `powerbackup add-db` |
| `powerbackup create-now <db>` | Create backup immediately | `powerbackup create-now myapp` |
| `powerbackup test-restore <db>` | Test restore (safe) | `powerbackup test-restore myapp` |
| `powerbackup restore <db>` | Restore to target (destructive) | `powerbackup restore myapp` |
| `powerbackup list-tables <db>` | List tables in backup | `powerbackup list-tables myapp` |
| `powerbackup interactive-restore <db>` | Interactive table restore | `powerbackup interactive-restore myapp` |
| `powerbackup list-backups <db>` | List available backups | `powerbackup list-backups myapp` |

### 🔧 **Advanced Commands**
| Command | Description | Options |
|---------|-------------|---------|
| `powerbackup create-now <db>` | Create backup | `--schema-only` |
| `powerbackup test-restore <db>` | Test restore | `--target <db>` |
| `powerbackup restore <db>` | Actual restore | `--target <db>` |
| `powerbackup restore-table <db> <table>` | Restore table | `--target <db>` |
| `powerbackup list-backups <db>` | List backups | `--tier <tier>` |

### 🧪 **Testing Commands**
| Command | Description |
|---------|-------------|
| `npm run test:unit` | Run unit tests |
| `npm run test:integration` | Run integration tests |
| `npm run test:all` | Run all tests |

### ⏰ **Scheduling Commands**
| Command | Description |
|---------|-------------|
| `npm run scheduler:once` | Run scheduled tasks once |
| `npm run scheduler:daemon` | Run scheduler in daemon mode |
| `npm run pm2:start` | Start scheduler with PM2 |
| `npm run pm2:stop` | Stop PM2 scheduler |
| `npm run pm2:status` | Check PM2 status |
| `npm run pm2:logs` | View PM2 logs |
| `npm run install:pm2` | Install PM2 globally |
| `npm run install:cron` | Install cron jobs (Linux/Unix) |
| `npm run install:windows` | Install Windows Task Scheduler |
| `npm run install:systemd` | Install systemd service (Linux) |

## ⚙️ Configuration

### Database Configuration

Create or edit `src/config/config.json`:

```json
{
  "backup_dir": "../../backups",
  "gpg": {
    "symmetric_passphrase_file": "./src/config/passphrase",
    "recipients": []
  },
  "databases": [
    {
      "name": "myapp",
      "type": "mysql",
      "url": "mysql://user:pass@localhost:3306/myapp",
      "keep": {
        "hourly": 24,
        "daily": 7,
        "weekly": 4,
        "monthly": 12,
        "yearly": 0
      },
      "test_restore": {
        "enabled": true,
        "verify_query": "SELECT COUNT(*) FROM information_schema.tables",
        "hour": 3
      }
    },
    {
      "name": "postgres-app",
      "type": "postgres",
      "url": "postgresql://user:pass@localhost:5432/postgres-app",
      "keep": {
        "hourly": 24,
        "daily": 7,
        "weekly": 4,
        "monthly": 12,
        "yearly": 0
      }
    }
  ]
}
```

### Environment Variables

```bash
# Database URLs (alternative to config file)
export MYSQL_URL="mysql://user:pass@localhost:3306/db"
export POSTGRES_URL="postgresql://user:pass@localhost:5432/db"

# Logging
export LOG_LEVEL="debug"  # error, warn, info, success, debug
```

## 🔐 Security Setup

### GPG Encryption

1. **Create Passphrase File**:
```bash
echo "your-secure-passphrase" > src/config/passphrase
chmod 600 src/config/passphrase
```

2. **Public Key Encryption** (Optional):
```bash
# Add recipient public keys to config
{
  "gpg": {
    "recipients": ["user@example.com", "backup@company.com"]
  }
}
```

## 📊 Usage Examples

### Basic Workflow

```bash
# 1. List databases
powerbackup list-dbs

# 2. Create backup
powerbackup create-now myapp

# 3. Test restore (safe)
powerbackup test-restore myapp

# 4. List tables
powerbackup list-tables myapp

# 5. Restore specific table
powerbackup restore-table myapp users

# 6. Interactive restore
powerbackup interactive-restore myapp
```

### Advanced Scenarios

```bash
# Schema-only backup
powerbackup create-now myapp --schema-only

# Restore to different database
powerbackup restore myapp --target myapp-restored

# List backups by tier
powerbackup list-backups myapp --tier daily

# Restore specific table to different database
powerbackup restore-table myapp users --target myapp-test
```

### Automation

```bash
# Add to crontab for automated backups
0 */6 * * * powerbackup create-now myapp

# Test restore at 3 AM daily
0 3 * * * powerbackup test-restore myapp
```



---

## ⏰ Automated Scheduling

PowerBackup can run backups on autopilot. Choose your weapon:

* **PM2**: Great for production, keeps scheduler alive
* **Cron**: Classic Linux scheduling
* **Systemd**: Service-based automation
* **Windows Task Scheduler**: Native Windows scheduling

### 🎯 **Recommended: PM2 (Production)**

```bash
# Install PM2
npm run install:pm2

# Start scheduler
npm run pm2:start

# Check status
npm run pm2:status

# View logs
npm run pm2:logs
```

### 🐧 **Linux/Unix: Systemd Service**

```bash
# Install systemd service
npm run install:systemd

# Start service
sudo systemctl start powerbackup

# Enable auto-start
sudo systemctl enable powerbackup
```

### ⏰ **Linux/Unix: Cron Jobs**

```bash
# Install cron jobs
npm run install:cron

# Manual setup
crontab -e
# Add: 0 * * * * cd /path/to/powerbackup && node src/scheduler.js src/config/config.json once
```

### 🪟 **Windows: Task Scheduler**

```powershell
# Install Windows Task Scheduler
npm run install:windows

# Or run as Administrator
powershell -ExecutionPolicy Bypass -File install-windows-task.ps1
```

### 🪟 **Windows: Manual Setup**

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

### 📋 **Retention Rules**

Configure automatic pruning in your database config:

```json
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
```

📖 **For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)**


---

## 🔐 Security Setup

* Create a passphrase file for symmetric encryption
* Add public keys for asymmetric encryption
* Lock down file permissions


### GPG Encryption

1. **Create Passphrase File**:
```bash
echo "your-secure-passphrase" > src/config/passphrase
chmod 600 src/config/passphrase
```

2. **Public Key Encryption** (Optional):
```bash
# Add recipient public keys to config
{
  "gpg": {
    "recipients": ["user@example.com", "backup@company.com"]
  }
}
```


---

## 🧪 Testing

```bash
npm run test:all
```

Outputs a colorful summary of passed/failed tests.

---

## 🏗 Architecture Overview

* **BackupManager** orchestrates backup & restore
* **Scheduler** automates tasks
* **Logger** handles beautiful logs
* **CLI** for interactive control
* **Encryption & Compression** modules for secure storage

---

## 🤝 Contributing

Pull requests welcome. Please:

* Keep code style consistent (ESLint configured)
* Use async/await
* Maintain test coverage

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

**🌟 Made with ❤️ by the PowerBackup Team**

*Version 2.2.3 — The Beautiful Backup Experience*
