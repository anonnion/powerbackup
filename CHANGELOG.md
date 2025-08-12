# Changelog

All notable changes to PowerBackup will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## \[2.0.0] - 2025-08-12

### 🚀 Added

* **Beautiful Logging System**: Emoji-enhanced logs with formatted timestamps.
* **Automated Scheduling**: Hourly backups and pruning with flexible deployment options.
* **Table-Level Restore**: Restore individual tables from backups.
* **Interactive CLI**: Guided prompts for a friendly user experience.
* **Multi-Database Support**: Full MySQL and PostgreSQL backup/restore.
* **GPG Encryption**: Strong encryption for backup files.
* **Gzip Compression**: Smaller backup sizes with minimal performance hit.
* **Retention Policies**: Automated cleanup of outdated backups.
* **Test Restore**: Safe restore to temporary database for verification.
* **Comprehensive Testing**: Unit and integration tests with 90%+ coverage.
* **Multiple Deployment Options**: PM2, Systemd, Cron, Windows Task Scheduler.
* **Setup Automation**: Install and configure with a single script.
* **Security Features**: Secure file permissions and credential protection.

### 🔧 Changed

* **Complete Rewrite**: Migrated from Python to Node.js for performance and maintainability.
* **Modular Architecture**: ES modules with clear separation of concerns.
* **Enhanced CLI**: ASCII art banners and improved help system.
* **Better Error Handling**: Graceful recovery with detailed logs.
* **Improved Configuration**: JSON-based config with validation.
* **Cross-Platform Support**: Works on Windows, Linux, and macOS.

### 🐛 Fixed

* **SQL Syntax**: Robust parsing and execution.
* **Connection Handling**: Reliable database connections.
* **File Path Resolution**: Cross-platform path handling.
* **Memory Usage**: Efficient large dump processing.
* **Permission Issues**: Correct file permission handling.

### 🔒 Security

* **Credential Safety**: Database credentials kept out of version control.
* **Encryption Support**: GPG encryption integrated.
* **Secure Defaults**: Sensitive files ignored by default.
* **File Permissions**: Secure defaults applied automatically.

### 📚 Documentation

* **Updated README**: Full setup and usage guide.
* **Deployment Guide**: Platform-specific instructions.
* **API Docs**: Programmatic examples.
* **Troubleshooting**: Common problems and solutions.

### 🧪 Testing

* **Unit Tests**: 90%+ coverage.
* **Integration Tests**: Full backup/restore workflows.
* **Improved Output**: Color-coded results.
* **CI/CD Ready**: Automated test suite.

### 🚀 Performance

* **Faster Backups**: Optimized dumping and compression.
* **Efficient Storage**: Gzip + retention policies.
* **Parallel Processing**: Multiple database handling.
* **Memory Optimization**: Smarter large dataset processing.

### 🔧 Developer Experience

* **ES Modules**: Modern JavaScript imports/exports.
* **Type Safety**: JSDoc for IDE hints.
* **Debug Mode**: Rich debugging output.
* **Hot Reload**: Instant feedback during development.

## \[1.0.0] - 2024-12-01

### 🚀 Initial Release

* Basic backup/restore.
* Python-based.
* MySQL only.
* Basic CLI.
* Simple config system.

---

## Version History

* **v2.0.0**: Node.js rewrite with logging, automation, and multi-DB support.
* **v1.0.0**: Initial Python-based release.

## Migration Guide

### From v1.0.0 to v2.0.0

1. **Install**:

   ```bash
   pip uninstall powerbackup
   git clone <repository>
   cd powerbackup
   ./setup.sh
   ```
2. **Configure**:

   * Use `src/config/config.example.json` as template.
   * Update DB URLs/settings.
3. **Commands**:

   * Old: `powerbackup backup <db>`
   * New: `npm run backup <db>`
4. **Scheduling**:

   * Old: Manual cron setup.
   * New: Automated scheduling.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License – see [LICENSE](LICENSE) for details.
