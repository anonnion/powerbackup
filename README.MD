# 🚀 PowerBackup v2.0.0

**Multi-Database Backup & Restore Tool with Beautiful Logging**

[![CI/CD Pipeline](https://github.com/anonnion/powerbackup/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/anonnion/powerbackup/actions/workflows/ci.yml)
[![Tests](https://github.com/anonnion/powerbackup/workflows/Tests/badge.svg)](https://github.com/anonnion/powerbackup/actions/workflows/tests.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Test Coverage](https://img.shields.io/badge/test%20coverage-97.6%25-brightgreen.svg)](https://github.com/anonnion/powerbackup)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.0.0-orange.svg)](package.json)

> **The Beautiful Backup Experience** - A modern, feature-rich database backup and restore solution with stunning visual feedback, comprehensive testing, and enterprise-grade security.

## ✨ Features

### 🎨 **Beautiful User Experience**
- **Colorful Logging**: Rich, emoji-enhanced logs with formatted timestamps
- **ASCII Art Banners**: Eye-catching PowerBackup logo on startup
- **Progress Indicators**: Real-time backup and restore progress tracking
- **Interactive CLI**: User-friendly command-line interface with helpful prompts

### 🔐 **Enterprise Security**
- **GPG Encryption**: Military-grade encryption for backup files
- **Symmetric & Asymmetric**: Support for both passphrase and public key encryption
- **Secure Storage**: Encrypted backups with compression for optimal storage

### 🗄️ **Multi-Database Support**
- **MySQL**: Full backup and restore support with schema and data
- **PostgreSQL**: Complete backup and restore functionality
- **Extensible**: Easy to add support for additional database types

### 🎯 **Granular Control**
- **Table-Level Restore**: Restore individual tables from backups
- **Interactive Selection**: Choose specific tables to restore
- **Schema-Only Backups**: Backup structure without data for faster operations

### 🔄 **Smart Restore Options**
- **Test Restore**: Safe restore to temporary database for verification
- **Actual Restore**: Direct restore to target database (destructive)
- **Table Restore**: Restore specific tables with data integrity

### 🗜️ **Optimization Features**
- **Gzip Compression**: Significantly reduce backup file sizes
- **Incremental Support**: Efficient backup strategies
- **Retention Policies**: Automated cleanup of old backups

### ☁️ **Cloud Integration**
- **AWS S3**: Direct upload to cloud storage
- **Multi-Tier Storage**: Hourly, daily, weekly, monthly, yearly retention
- **Automated Rotation**: Intelligent backup lifecycle management

### 🧪 **Comprehensive Testing**
- **Unit Tests**: 90%+ test coverage for core functionality
- **Integration Tests**: End-to-end testing of backup/restore workflows
- **Beautiful Test Output**: Color-coded test results with progress indicators

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Database Access** - MySQL or PostgreSQL connection
- **GPG** - For encryption (optional but recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/powerbackup.git
cd powerbackup

# Install dependencies
npm run install-deps

# Show beautiful help
npm run help
```

### First Backup

```bash
# List available databases
npm run list

# Create your first backup
npm run backup mydatabase

# Test the backup (safe)
npm run test-restore mydatabase

# List tables in backup
npm run tables mydatabase
```

## 📋 Command Reference

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

## ⏰ **Automated Scheduling**

PowerBackup supports multiple deployment options for automated hourly backups and pruning:

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

## 🧪 Testing

### Run All Tests
```bash
npm run test:all
```

### Individual Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

### Test Results
```
📊 Test Results Summary:
  ✅ Passed: 39
  ❌ Failed: 0
  📋 Total: 39
  📈 Success Rate: 100.0%

🎉 All tests passed successfully!
```

## 🏗️ Architecture

### Project Structure
```
powerbackup/
├── src/
│   ├── backup/
│   │   ├── dump/
│   │   │   ├── mysql.js      # MySQL backup logic
│   │   │   └── postgres.js   # PostgreSQL backup logic
│   │   ├── manager.js        # Backup orchestration
│   │   ├── restore.js        # Restore functionality
│   │   ├── actual-restore.js # Actual restore logic
│   │   ├── table-restore.js  # Table-level restore
│   │   └── scheduler.js      # Automated scheduling
│   ├── config/
│   │   └── config.json       # Configuration file
│   ├── utils/
│   │   ├── logger.js         # Beautiful logging system
│   │   └── file.js           # File operations
│   ├── tests/
│   │   ├── unit.js           # Unit tests
│   │   └── integration.js    # Integration tests
│   └── cli.js                # Command-line interface
├── backups/                  # Backup storage
├── logs/                     # Scheduler logs
├── ecosystem.config.js       # PM2 configuration
├── powerbackup.service       # Systemd service
├── install-cron.sh          # Cron installation
├── install-windows-task.ps1 # Windows Task Scheduler
├── DEPLOYMENT.md            # Deployment guide
├── package.json
└── README.md
```

### Key Components

- **BackupManager**: Orchestrates backup and restore operations
- **PowerBackupScheduler**: Handles automated scheduling and pruning
- **Logger**: Beautiful, emoji-rich logging system
- **CLI**: User-friendly command-line interface
- **Encryption**: GPG-based security layer
- **Compression**: Gzip optimization
- **Testing**: Comprehensive test suite

## 🔧 Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check database URL format
mysql://user:pass@host:port/database
postgresql://user:pass@host:port/database

# Verify credentials and network access
```

**2. GPG Encryption Failed**
```bash
# Ensure passphrase file exists
ls -la src/config/passphrase

# Check file permissions
chmod 600 src/config/passphrase
```

**3. Backup File Not Found**
```bash
# Check backup directory
ls -la backups/

# Verify database name matches config
npm run list
```

**4. Scheduler Not Running**
```bash
# Check PM2 status
npm run pm2:status

# Check systemd service
sudo systemctl status powerbackup

# Check cron jobs
crontab -l
```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL="debug"
npm run backup myapp

# Test scheduler manually
npm run scheduler:once
```

### Log Files

Logs are displayed in real-time with beautiful formatting. For file logging, configure Winston transports in `src/utils/logger.js`.

## 🤝 Contributing

### Development Setup

```bash
# Clone and setup
git clone https://github.com/your-org/powerbackup.git
cd powerbackup
npm run install-deps

# Run tests
npm run test:all

# Development mode
npm run dev
```

### Code Style

- **ESLint**: Configured for consistent code style
- **ES Modules**: Use `import/export` syntax
- **Async/Await**: Prefer async functions over callbacks
- **Beautiful Logging**: Use the logger system for all output

### Testing Guidelines

- **Unit Tests**: Test individual functions and modules
- **Integration Tests**: Test complete workflows
- **Coverage**: Maintain 90%+ test coverage
- **Beautiful Output**: Use emojis and colors in test output

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Winston**: Beautiful logging framework
- **Commander.js**: CLI framework
- **Chalk**: Terminal colors and styling
- **Figlet**: ASCII art banners
- **OpenPGP**: Encryption library
- **MySQL2**: MySQL driver
- **PG**: PostgreSQL driver
- **PM2**: Process management

---

**🌟 Made with ❤️ by the PowerBackup Team**

*Version 2.0.0 - The Beautiful Backup Experience*