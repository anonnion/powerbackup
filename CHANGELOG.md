# Changelog

All notable changes to PowerBackup will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-08-12

### 🚀 Added
- **Beautiful Logging System**: Rich, emoji-enhanced logs with formatted timestamps
- **Automated Scheduling**: Hourly backup and pruning with multiple deployment options
- **Table-Level Restore**: Restore individual tables from backups
- **Interactive CLI**: User-friendly command-line interface with helpful prompts
- **Multi-Database Support**: Full MySQL and PostgreSQL backup/restore
- **GPG Encryption**: Military-grade encryption for backup files
- **Gzip Compression**: Significantly reduce backup file sizes
- **Retention Policies**: Automated cleanup of old backups
- **Test Restore**: Safe restore to temporary database for verification
- **Comprehensive Testing**: Unit and integration tests with 90%+ coverage
- **Multiple Deployment Options**: PM2, Systemd, Cron, Windows Task Scheduler
- **Setup Automation**: Automated installation and configuration script
- **Security Features**: Secure file permissions and credential protection

### 🔧 Changed
- **Complete Rewrite**: Migrated from Python to Node.js for better performance
- **Modular Architecture**: Clean separation of concerns with ES modules
- **Enhanced CLI**: Beautiful help system with ASCII art banners
- **Improved Error Handling**: Graceful error recovery and detailed logging
- **Better Configuration**: JSON-based configuration with validation
- **Cross-Platform Support**: Windows, Linux, and macOS compatibility

### 🐛 Fixed
- **SQL Syntax Issues**: Robust SQL parsing and statement execution
- **Connection Problems**: Improved database connection handling
- **File Path Issues**: Cross-platform file path resolution
- **Memory Management**: Efficient handling of large database dumps
- **Permission Errors**: Proper file permission handling

### 🔒 Security
- **Credential Protection**: Database credentials excluded from version control
- **Encryption Support**: GPG encryption for backup files
- **Secure Defaults**: Sensitive files ignored by default
- **File Permissions**: Proper security settings for sensitive files

### 📚 Documentation
- **Comprehensive README**: Complete setup and usage guide
- **Deployment Guide**: Detailed deployment instructions for all platforms
- **API Documentation**: Programmatic usage examples
- **Troubleshooting Guide**: Common issues and solutions

### 🧪 Testing
- **Unit Tests**: 90%+ test coverage for core functionality
- **Integration Tests**: End-to-end testing of backup/restore workflows
- **Beautiful Test Output**: Color-coded test results with progress indicators
- **Automated Testing**: CI/CD ready test suite

### 🚀 Performance
- **Faster Backups**: Optimized database dumping and compression
- **Efficient Storage**: Gzip compression and smart retention policies
- **Parallel Processing**: Support for multiple database processing
- **Memory Optimization**: Efficient handling of large datasets

### 🔧 Developer Experience
- **ES Modules**: Modern JavaScript with import/export syntax
- **Type Safety**: JSDoc comments for better IDE support
- **Debug Mode**: Comprehensive debugging capabilities
- **Hot Reload**: Development mode with file watching

## [1.0.0] - 2024-12-01

### 🚀 Initial Release
- Basic backup and restore functionality
- Python-based implementation
- MySQL support only
- Basic CLI interface
- Simple configuration system

---

## Version History

- **v2.0.0**: Complete rewrite in Node.js with beautiful logging and automated scheduling
- **v1.0.0**: Initial Python-based release with basic functionality

## Migration Guide

### From v1.0.0 to v2.0.0

1. **Installation**: 
   ```bash
   # Remove old Python version
   pip uninstall powerbackup
   
   # Install new Node.js version
   git clone <repository>
   cd powerbackup
   ./setup.sh
   ```

2. **Configuration**: 
   - Old Python config format is not compatible
   - Use `src/config/config.example.json` as template
   - Update database URLs and settings

3. **Commands**: 
   - Old: `powerbackup backup <db>`
   - New: `npm run backup <db>`

4. **Scheduling**: 
   - Old: Manual cron setup
   - New: Automated scheduling with multiple options

---

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
