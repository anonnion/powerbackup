# 🔋💾 PowerBackup v2.0.0

**Backups you’ll actually enjoy running — secure, reliable, and beautiful.**

[![CI/CD Pipeline](https://github.com/anonnion/powerbackup/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/anonnion/powerbackup/actions/workflows/ci.yml)
[![Tests](https://github.com/anonnion/powerbackup/workflows/Tests/badge.svg)](https://github.com/anonnion/powerbackup/actions/workflows/tests.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Test Coverage](https://img.shields.io/badge/test%20coverage-97.6%25-brightgreen.svg)](https://github.com/anonnion/powerbackup)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.0.0-orange.svg)](package.json)

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

### Install & Run

```bash
git clone https://github.com/your-org/powerbackup.git
cd powerbackup

# Install dependencies
npm run install-deps

# Show beautiful help
npm run help
```

### First Backup

```bash
# List your databases
npm run list

# Make a backup
npm run backup mydatabase

# Safely test-restore it
npm run test-restore mydatabase
```

---

## 📋 Command Cheatsheet

| Command                     | What it does                       |
| --------------------------- | ---------------------------------- |
| `npm run help`              | Show full help with emoji goodness |
| `npm run list`              | See configured databases           |
| `npm run add`               | Add a new DB interactively         |
| `npm run backup <db>`       | Backup instantly                   |
| `npm run test-restore <db>` | Safe restore to temp DB            |
| `npm run restore <db>`      | Actual restore (destructive)       |
| `npm run tables <db>`       | List tables in backup              |
| `npm run interactive <db>`  | Pick specific tables to restore    |

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

```bash
git clone https://github.com/your-org/powerbackup.git
cd powerbackup
npm run install-deps
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
| `npm run help` | Show beautiful help guide | `npm run help` |
| `npm run list` | List configured databases | `npm run list` |
| `npm run add` | Add new database interactively | `npm run add` |
| `npm run backup <db>` | Create backup immediately | `npm run backup myapp` |
| `npm run test-restore <db>` | Test restore (safe) | `npm run test-restore myapp` |
| `npm run restore <db>` | Restore to target (destructive) | `npm run restore myapp` |
| `npm run tables <db>` | List tables in backup | `npm run tables myapp` |
| `npm run interactive <db>` | Interactive table restore | `npm run interactive myapp` |
| `npm run backups <db>` | List available backups | `npm run backups myapp` |

### 🔧 **Advanced Commands**
| Command | Description | Options |
|---------|-------------|---------|
| `npm start create-now <db>` | Create backup | `--schema-only` |
| `npm start test-restore <db>` | Test restore | `--target <db>` |
| `npm start restore <db>` | Actual restore | `--target <db>` |
| `npm start restore-table <db> <table>` | Restore table | `--target <db>` |
| `npm start list-backups <db>` | List backups | `--tier <tier>` |

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
npm run list

# 2. Create backup
npm run backup myapp

# 3. Test restore (safe)
npm run test-restore myapp

# 4. List tables
npm run tables myapp

# 5. Restore specific table
npm run restore-table myapp users

# 6. Interactive restore
npm run interactive myapp
```

### Advanced Scenarios

```bash
# Schema-only backup
npm start create-now myapp --schema-only

# Restore to different database
npm start restore myapp --target myapp-restored

# List backups by tier
npm start list-backups myapp --tier daily

# Restore specific table to different database
npm start restore-table myapp users --target myapp-test
```

### Automation

```bash
# Add to crontab for automated backups
0 */6 * * * cd /path/to/powerbackup && npm run backup myapp

# Test restore at 3 AM daily
0 3 * * * cd /path/to/powerbackup && npm run test-restore myapp
```



---

## ⏰ Automated Scheduling

PowerBackup can run backups on autopilot. Choose your weapon:

* **PM2**: Great for production, keeps scheduler alive
* **Cron**: Classic Linux scheduling
* **Systemd**: Service-based automation
* **Windows Task Scheduler**: Native Windows scheduling

*(Detailed instructions remain from original)*

---

## 🔐 Security Setup

* Create a passphrase file for symmetric encryption
* Add public keys for asymmetric encryption
* Lock down file permissions

*(Commands remain as in original)*

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

*Version 2.0.0 — The Beautiful Backup Experience*
