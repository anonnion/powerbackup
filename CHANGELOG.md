# Changelog

All notable changes to PowerBackup will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## \[2.2.0] - 2025-08-13

### 🚀 Added

* **API Service**: Introduced a full-featured REST API for PowerBackup, including endpoints for backups, restores, logs, status, and table management.
* **API Authentication**: Added HMAC and JWT-based authentication for API endpoints.
* **API Rate Limiting & CORS**: Implemented rate limiting and CORS configuration for secure API access.
* **API Key Management**: CLI commands to enable/disable API, check status, and generate new API keys.
* **Audit Logging**: Added audit middleware for API actions.
* **Validation Middleware**: Robust request validation for all API routes.
* **Comprehensive API Documentation**: All routes and middleware are documented in code and accessible via the API.

### 🎨 Improved

* **Version Management**: All version references in CLI, API, docs, and metadata now automatically pull from package.json for single-source-of-truth versioning.
* **CLI User Experience**: Enhanced CLI help, banners, and command descriptions. Improved add-db command with non-interactive mode and better prompts.
* **Docs & Badges**: Updated documentation and badges to reflect v2.2.0. GitHub Pages and README now show the correct version.

### 🐛 Fixed

* **Version Consistency**: Fixed all hardcoded version strings and ensured all scripts and tests check for the correct version.
* **Test Scripts**: Improved version checks in global install test scripts for both bash and PowerShell.

## \[2.1.5] - 2025-08-12

### 🎨 Added

* **NPM Install Button**: Added prominent npm install button to README for easy installation
* **Badge Fixes**: Fixed URL encoding for npm install badge in documentation

## \[2.1.4] - 2025-08-12

### 🔧 Fixed

* **Branch References**: Fixed all 'main' branch references to 'master' in documentation
* **NPM Header**: Updated package description to show correct version in npm header
* **Homepage URL**: Fixed homepage URL to point to GitHub Pages instead of GitHub README
* **Version Consistency**: Updated all version references to v2.1.4

## \[2.1.3] - 2025-08-12

### 🔧 Fixed

* **README Update**: Force npm README update by bumping version to 2.1.3
* **Version Consistency**: Updated all version references across all files
* **Documentation**: Ensured all documentation reflects latest version

## \[2.1.2] - 2025-08-12

### 📚 Documentation

* **Download Statistics**: Added comprehensive download statistics to documentation page
* **NPM Badges**: Added npm version and download badges to header and stats sections
* **GitHub Statistics**: Added GitHub stars, forks, and issues badges
* **Installation Methods**: Added installation method badges with proper styling
* **Version Updates**: Updated all version references to v2.1.2

### 🎨 UI/UX

* **Enhanced Documentation**: Beautiful download statistics section with glass morphism design
* **Interactive Badges**: All badges are clickable and link to relevant pages
* **Responsive Design**: Download statistics work on all screen sizes
* **Real-time Data**: All statistics pull live data from npm and GitHub

### 🔧 Fixed

* **NPM Install Badge**: Fixed npm install badge styling and visibility
* **Branch References**: Ensured all references use correct branch names
* **Version Consistency**: Updated all files to reflect v2.1.2

## \[2.1.1] - 2025-08-12

### 🔒 Security

* **Dependency Update**: Updated inquirer from v9.3.7 to v12.9.1 to fix high severity vulnerability
* **Vulnerability Fix**: Resolved tmp package vulnerability through inquirer update
* **Security Audit**: All security vulnerabilities now resolved

### 🔧 Fixed

* **Code Quality**: Replaced console.log with log.info in restore-locations.js for production code
* **Production Code**: Ensured all logging uses proper logger instead of console.log

### 🧪 Testing

* **All Tests Passing**: Verified functionality with updated dependencies
* **Security Audit**: npm audit now shows 0 vulnerabilities

## \[2.1.0] - 2025-08-12

### 🚀 Added

* **Restore Locations**: Pre-configure database URLs for different environments (dev, staging, prod)
* **Interactive Restore Location Management**: Add, remove, and manage restore locations through CLI
* **Enhanced Restore Workflow**: Choose restore locations during test and actual restore operations
* **Restore Location Validation**: URL validation and masking for security
* **Flexible Environment Support**: Support multiple database types per restore location

### 🔧 Changed

* **CLI Banner**: Fixed duplication issue - banner now shows only once per command
* **Version Update**: Bumped to v2.1.0 to reflect new features
* **Configuration Structure**: Added `restore_locations` section to config files
* **Help System**: Updated to include new restore location commands

### 🐛 Fixed

* **Banner Duplication**: Eliminated duplicate banner display in CLI commands
* **Code Organization**: Improved code structure and readability

### 📚 Documentation

* **Updated README**: Added comprehensive restore locations documentation
* **Configuration Examples**: Added restore locations examples to config files
* **Command Reference**: Updated to include new restore location management commands

## \[2.0.1] - 2025-08-12

### 🔧 Fixed

* **Dependencies**: Updated all packages to latest stable versions
* **OpenPGP**: Upgraded from deprecated v5.x to v6.2.0
* **Commander**: Updated to v12.0.0 for better CLI handling
* **Inquirer**: Updated to v9.3.7 for improved prompts
* **MySQL2**: Updated to v3.9.0 for better performance
* **Winston**: Updated to v3.13.0 for enhanced logging
* **Date-fns**: Updated to v3.6.0 for modern date handling
* **Ora**: Updated to v8.0.1 for better spinners
* **AWS SDK**: Updated to v3.500.0 for latest features
* **ESLint**: Updated to v9.0.0 for modern linting

### 🚀 Improved

* **Global Installation**: Fixed dependency resolution for global npm package
* **Package Structure**: Moved dependencies to root package.json
* **Installation Process**: Simplified with single `npm install` command
* **Windows Support**: Added PowerShell setup script (`setup.ps1`) for Windows users

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
* **Global NPM Package**: Install globally with `npm install -g powerbackup`.
* **Multiple Deployment Options**: PM2, Systemd, Cron, Windows Task Scheduler.
* **Setup Automation**: Initialize with `powerbackup init`.
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

* **v2.2.0**: API service, authentication, rate limiting, and documentation.
* **v2.1.5**: NPM install button and badge fixes.
* **v2.1.4**: Branch references and npm header fixes.
* **v2.1.3**: README update and version consistency fixes.
* **v2.1.2**: Documentation updates and download statistics.
* **v2.1.1**: Security fixes and code quality improvements.
* **v2.1.0**: Restore locations feature and CLI improvements.
* **v2.0.1**: Dependency updates and global package fixes.
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
   * New: `powerbackup create-now <db>`
4. **Scheduling**:

   * Old: Manual cron setup.
   * New: Automated scheduling.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License – see [LICENSE](LICENSE) for details.
