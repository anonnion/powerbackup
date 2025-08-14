#!/usr/bin/env node


// CLI entrypoint for PowerBackup
import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { BackupManager } from './backup/manager.js';
import { log } from './utils/logger.js';
import { loadConfig, saveConfig } from './utils/config.js';
import { detectMySQLPath, detectPostgreSQLPath } from './utils/find-binary.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
const execAsync = promisify(exec);
// Load config.json at runtime so it works globally
let configPath = path.resolve(process.cwd(), './src/config/config.json');
try {
    // If user passed --config, use that
    const configArgIndex = process.argv.findIndex(arg => arg === '-c' || arg === '--config');
    if (configArgIndex !== -1 && process.argv[configArgIndex + 1]) {
        configPath = path.resolve(process.cwd(), process.argv[configArgIndex + 1]);
    }
} catch {}
let loadedConfig = {};
try {
    loadedConfig = await loadConfig(configPath);
} catch (e) {
    log.warn('Could not load config:', e.message);
}
global.powerbackupConfig = loadedConfig;
import { RestoreLocationsManager } from './utils/restore-locations.js';
import chalk from 'chalk';
import figlet from 'figlet';
import { PKG_VERSION } from './utils/pkg-version.js';

// Display beautiful banner
function showBanner() {
    console.log(chalk.cyan(figlet.textSync('PowerBackup', { font: 'Standard' })));
    console.log(chalk.gray(`Multi-Database Backup & Restore Tool v${PKG_VERSION}\n`));
    const verboseLogFile = process.env.VERBOSE_LOG_FILE || 'logs/powerbackup-verbose.log';
    console.log(chalk.yellow(`🔎 Verbose logs are written to: ${verboseLogFile}`));
    console.log(chalk.gray('For detailed troubleshooting, check the verbose log file.'));
}

const program = new Command();
program.version(PKG_VERSION).description('Multi-DB backup & rotation tool with beautiful logging & restore locations').option('-c, --config <path>', 'Config file path', './src/config/config.json');

program.command('list-dbs').description('List configured databases').action(listDbs);
program
  .command('add-db')
  .description('Add a new database')
  .option('--name <name>', 'Database name')
  .option('--type <type>', 'Database type (mysql|postgres)')
  .option('--url <url>', 'Database URL (e.g., mysql://user:pass@host:port/db)')
  .option('--url-env <env>', 'Environment variable name that holds the URL')
  .option('--keep-hourly <n>', 'Hourly backups to keep', '24')
  .option('--keep-daily <n>', 'Daily backups to keep', '7')
  .option('--enable-test-restore', 'Enable test restore', false)
  .option('--test-hour <h>', 'Test restore hour (0-23)', '3')
  .option('--non-interactive', 'Do not prompt; requires flags', false)
  .action(addDb);
program.command('create-now <name>').description('Create backup immediately').action(createNow);
program.command('test-restore <name>').description('Test restore to temporary database (safe)').action(testRestore);
program.command('restore <name>').description('Restore to target database (destructive)').option('--target <database>', 'Target database name (defaults to original name)').action(actualRestore);
program.command('list-tables <name>').description('List tables in latest backup').action(listTables);
program.command('restore-table <name> <table>').description('Restore specific table from latest backup').option('--target <database>', 'Target database name (defaults to original name)').action(restoreTable);
program.command('interactive-restore <name>').description('Interactive table restore from latest backup').option('--target <database>', 'Target database name (defaults to original name)').action(interactiveRestore);
program.command('list-backups <name>').description('List backups for database').option('--tier <tier>', 'Backup tier', 'hourly').action(listBackups);

program.command('scheduler:daemon').description('Run backup scheduler in daemon mode (continuous loop, for PM2/systemd)').action(async () => {
    showBanner();
    log.info('Starting PowerBackup scheduler in daemon mode...');
    while (true) {
        await runHourlyBackups();
        await new Promise(r => setTimeout(r, 60 * 60 * 1000)); // Wait 1 hour
    }
});

program.command('scheduler:once').description('Run backup scheduler once (for cron/one-off)').action(async () => {
    showBanner();
    log.info('Running PowerBackup scheduler once...');
    await runHourlyBackups();
});

program.command('init').description('Initialize PowerBackup configuration').action(initPowerBackup);

// Restore location management commands
program.command('list-restore-locations').description('List configured restore locations').action(listRestoreLocations);
program.command('add-restore-location').description('Add a new restore location interactively').action(addRestoreLocation);
program.command('remove-restore-location').description('Remove a restore location interactively').action(removeRestoreLocation);
program.command('manage-restore-locations').description('Interactive restore location management').action(manageRestoreLocations);

// API management commands (preserved from original cli.js)
program.command('api:enable').description('Enable PowerBackup API').action(enableAPI);
program.command('api:disable').description('Disable PowerBackup API').action(disableAPI);
program.command('api:status').description('Show API status').action(apiStatus);
program.command('api:generate-key').description('Generate new API keys').action(generateAPIKeys);

// Binary path management commands
/**
 * Set binary paths for MySQL and PostgreSQL executables
 * @param {Object} options Command options
 */
async function setBinaryPath(options) {
    try {
        const config = global.powerbackupConfig || {};
        config.binaries = config.binaries || {};

        if (!options.mysql && !options.postgres) {
            // Auto-detect paths if no options provided
            log.info('🔍 Detecting database binaries...');

            const mysqlPath = await detectMySQLPath();
            if (mysqlPath) {
                log.success('Found MySQL binaries:', mysqlPath);
                config.binaries.mysqlPath = mysqlPath;
            } else {
                log.warn('MySQL binaries not found in common locations');
            }

            const postgresPath = await detectPostgreSQLPath();
            if (postgresPath) {
                log.success('Found PostgreSQL binaries:', postgresPath);
                config.binaries.postgresPath = postgresPath;
            } else {
                log.warn('PostgreSQL binaries not found in common locations');
            }

            log.info('\nCurrent binary paths:');
            log.info('MySQL:');
            log.info(`  "${config.binaries.mysqlPath || 'Not set'}"`);
            log.info('PostgreSQL:');
            log.info(`  "${config.binaries.postgresPath || 'Not set'}"`);

            if (config.binaries.mysqlPath || config.binaries.postgresPath) {
                await saveConfig(config);
            }
            return;
        }

        if (options.mysql) {
            config.binaries.mysqlPath = path.resolve(options.mysql);
            // Verify the path contains the binaries
            try {
                const mysqlExists = await execAsync(
                    os.platform().startsWith('win')
                        ? `if exist "${config.binaries.mysqlPath}\\mysql.exe" (exit 0) else (exit 1)`
                        : `test -f "${config.binaries.mysqlPath}/mysql"`
                );
                log.success(`MySQL binary path set and verified: ${config.binaries.mysqlPath}`);
            } catch {
                log.warn('MySQL binaries not found in specified path. Make sure mysql.exe exists in this directory.');
            }
        }
        
        if (options.postgres) {
            config.binaries.postgresPath = path.resolve(options.postgres);
            // Verify the path contains the binaries
            try {
                const psqlExists = await execAsync(
                    os.platform().startsWith('win')
                        ? `if exist "${config.binaries.postgresPath}\\psql.exe" (exit 0) else (exit 1)`
                        : `test -f "${config.binaries.postgresPath}/psql"`
                );
                log.success(`PostgreSQL binary path set and verified: ${config.binaries.postgresPath}`);
            } catch {
                log.warn('PostgreSQL binaries not found in specified path. Make sure psql.exe exists in this directory.');
            }
        }

        await saveConfig(config);
    } catch (error) {
        log.error('Failed to set binary path:', error.message);
    }
}

program.command('set-binary-path')
    .description('Set path to MySQL/PostgreSQL executables')
    .option('--mysql <path>', 'Path to MySQL base directory (containing mysql and mysqldump)')
    .option('--postgres <path>', 'Path to PostgreSQL base directory (containing psql, pg_dump, pg_restore)')
    .action(setBinaryPath);

async function loadCliConfig() {
    const configPath = path.resolve(process.cwd(), program.opts().config);
    try {
        const content = await fs.readFile(configPath, 'utf8');
        return JSON.parse(content);
    } catch (e) {
        if (e && e.code === 'ENOENT') {
            console.log(chalk.yellow('🆕 First-time run detected. Running initial setup...'));
            await basicInit();
            const content = await fs.readFile(configPath, 'utf8');
            return JSON.parse(content);
        }
        throw new Error(`Failed to load config: ${e.message}`);
    }
}

async function listDbs() {
    try {
        const config = await loadConfig();
        if (!config.databases || config.databases.length === 0) {
            log.warn('No databases configured');
            return;
        }
        log.info('📋 Configured databases:');
        for (const db of config.databases) {
            console.log(`  ${chalk.cyan(db.name)} (${chalk.yellow(db.type)}) - ${chalk.gray(db.url || db.url_env || 'No URL')}`);
        }
    } catch (e) {
        log.error('Error:', e.message);
        process.exit(1);
    }
}

async function addDb(options) {
    try {
        let answers = {};
        if (options?.nonInteractive) {
            // Non-interactive mode
            answers = {
                name: options.name,
                type: options.type,
                url: options.url,
                urlEnv: options.urlEnv,
                configureRetention: true,
                keepHourly: options.keepHourly ?? options.keephourly ?? options.keepHourly,
                keepDaily: options.keepDaily ?? options.keepdaily ?? options.keepDaily,
                enableTestRestore: !!options.enableTestRestore,
                testHour: options.testHour ?? options.testhour ?? options.testHour
            };
            if (!answers.name) throw new Error('Name is required (--name)');
            if (!answers.type || !['mysql','postgres'].includes(answers.type)) throw new Error('Type is required and must be mysql or postgres (--type)');
            if (!answers.url && !answers.urlEnv) throw new Error('Either --url or --url-env is required');
            if (!answers.keepHourly) answers.keepHourly = '24';
            if (!answers.keepDaily) answers.keepDaily = '7';
            if (answers.enableTestRestore && (isNaN(parseInt(answers.testHour)) || parseInt(answers.testHour) < 0 || parseInt(answers.testHour) > 23)) {
                throw new Error('Invalid --test-hour (0-23)');
            }
        } else {
            // Interactive mode
            answers = await inquirer.prompt([
                { type: 'input', name: 'name', message: 'Database name:', validate: input => input ? true : 'Name is required' },
                { type: 'list', name: 'type', message: 'Database type:', choices: ['mysql', 'postgres'] },
                { type: 'confirm', name: 'useEnv', message: 'Use environment variable for URL?' },
                { type: 'input', name: 'url', message: 'Database URL:', when: answers => !answers.useEnv, validate: input => input ? true : 'URL is required' },
                { type: 'input', name: 'urlEnv', message: 'Environment variable name:', when: answers => answers.useEnv, validate: input => input ? true : 'Environment variable name is required' },
                { type: 'confirm', name: 'configureRetention', message: 'Configure backup retention?', default: true },
                { type: 'input', name: 'keepHourly', message: 'Keep hourly backups:', default: '24', when: answers => answers.configureRetention, validate: input => !isNaN(input) ? true : 'Must be a number' },
                { type: 'input', name: 'keepDaily', message: 'Keep daily backups:', default: '7', when: answers => answers.configureRetention, validate: input => !isNaN(input) ? true : 'Must be a number' },
                { type: 'confirm', name: 'enableTestRestore', message: 'Enable test restore?', default: true },
                { type: 'input', name: 'testHour', message: 'Test restore hour (0-23):', default: '3', when: answers => answers.enableTestRestore, validate: input => { const num = parseInt(input); return num >= 0 && num <= 23 ? true : 'Must be between 0 and 23'; } }
            ]);
        }

        const config = await loadConfig();
        const db = { name: answers.name, type: answers.type };
        if (answers.url) db.url = answers.url;
        if (answers.urlEnv) db.url_env = answers.urlEnv;
        if (answers.configureRetention) db.keep = { hourly: parseInt(answers.keepHourly), daily: parseInt(answers.keepDaily), weekly: 4, monthly: 12, yearly: 0 };
        if (answers.enableTestRestore) db.test_restore = { enabled: true, hour: parseInt(answers.testHour) };
        if (!Array.isArray(config.databases)) config.databases = [];
        config.databases.push(db);
        await saveConfig(config);
        log.success(`Added database ${chalk.cyan(db.name)}`);
    } catch (e) {
        log.error('Error:', e.message);
        process.exit(1);
    }
}

async function createNow(name) {
    try {
        const config = await loadConfig();
        const db = config.databases?.find(d => d.name === name);
        if (!db) throw new Error(`Database ${name} not found`);
        const manager = new BackupManager(config);
        const dest = await manager.performBackup(db);
        log.success(`Backup created at ${chalk.gray(dest)}`);
    } catch (e) {
        log.error('Error:', e.message);
        process.exit(1);
    }
}

async function testRestore(name) {
    try {
        const config = await loadConfig();
        const db = config.databases?.find(d => d.name === name);
        if (!db) throw new Error(`Database ${name} not found`);
        const backupDir = path.join(config.backup_dir, name, 'hourly');
        const files = await fs.readdir(backupDir);
        if (!files.length) throw new Error('No backups found');
        const sorted = await Promise.all(files.filter(f => !f.endsWith('.meta.json')).map(async f => ({ name: f, time: (await fs.stat(path.join(backupDir, f))).mtime.getTime() })));
        sorted.sort((a, b) => b.time - a.time);
        const latestBackup = path.join(backupDir, sorted[0].name);

        // Handle restore location selection for test restore
        let targetUrl = null;
        
        const useRestoreLocation = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'useLocation',
                message: 'Would you like to test restore to a configured restore location?',
                default: false
            }
        ]);
        
        if (useRestoreLocation.useLocation) {
            const configPath = path.resolve(process.cwd(), program.opts().config);
            const locationManager = new RestoreLocationsManager(configPath);
            
            try {
                const selectedLocation = await locationManager.selectRestoreLocation(db.type);
                targetUrl = selectedLocation.url;
                log.info(`Using restore location: ${chalk.cyan(selectedLocation.name)}`);
            } catch (error) {
                log.warn(`Could not select restore location: ${error.message}`);
                log.info('Proceeding with original database configuration');
            }
        }

        const manager = new BackupManager(config);
        
        if (targetUrl) {
            // Create a temporary db config with the target URL
            const targetDbConfig = { ...db, url: targetUrl };
            await manager.testRestore(targetDbConfig, latestBackup);
        } else {
            await manager.testRestore(db, latestBackup);
        }
        
        log.success('Test restore completed successfully');
    } catch (e) {
        log.error('Error:', e.message);
        process.exit(1);
    }
}

async function actualRestore(name, options) {
    try {
        const config = await loadConfig();
        const db = config.databases?.find(d => d.name === name);
        if (!db) throw new Error(`Database ${name} not found`);

        const backupDir = path.join(config.backup_dir, name, 'hourly');
        const files = await fs.readdir(backupDir);
        if (!files.length) throw new Error('No backups found');
        const sorted = await Promise.all(files.filter(f => !f.endsWith('.meta.json')).map(async f => ({ name: f, time: (await fs.stat(path.join(backupDir, f))).mtime.getTime() })));
        sorted.sort((a, b) => b.time - a.time);
        const latestBackup = path.join(backupDir, sorted[0].name);

        // Handle restore location selection
        let targetUrl = null;
        let targetDbName = options.target || name;
        
        if (!options.target) {
            // Ask user if they want to use a restore location
            const useRestoreLocation = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'useLocation',
                    message: 'Would you like to restore to a configured restore location?',
                    default: false
                }
            ]);
            
            if (useRestoreLocation.useLocation) {
                const configPath = path.resolve(process.cwd(), program.opts().config);
                const locationManager = new RestoreLocationsManager(configPath);
                
                try {
                    const selectedLocation = await locationManager.selectRestoreLocation(db.type);
                    targetUrl = selectedLocation.url;
                    targetDbName = selectedLocation.name;
                    log.info(`Using restore location: ${chalk.cyan(selectedLocation.name)}`);
                } catch (error) {
                    log.warn(`Could not select restore location: ${error.message}`);
                    log.info('Proceeding with original database configuration');
                }
            }
        }

        const manager = new BackupManager(config);
        
        if (targetUrl) {
            // Create a temporary db config with the target URL
            const targetDbConfig = { ...db, url: targetUrl, name: targetDbName };
            await manager.actualRestore(targetDbConfig, latestBackup, targetDbName);
        } else {
            await manager.actualRestore(db, latestBackup, targetDbName);
        }
        
        log.success('Actual restore completed successfully');
    } catch (e) {
        log.error('Error:', e.message);
        process.exit(1);
    }
}

async function listBackups(name, options) {
    try {
        const config = await loadConfig();
        const backupDir = path.join(config.backup_dir, name, options.tier);
        if (!await fs.access(backupDir).then(() => true).catch(() => false)) {
            log.warn('No backups found');
            return;
        }
        const files = await fs.readdir(backupDir);
        log.info(`📁 Backups for ${chalk.cyan(name)} (${chalk.yellow(options.tier)} tier):`);
        for (const file of files.filter(f => !f.endsWith('.meta.json'))) {
            const stats = await fs.stat(path.join(backupDir, file));
            const size = (stats.size / 1024 / 1024).toFixed(2);
            console.log(`  ${chalk.gray(file)} - ${chalk.green(size)}MB - ${chalk.blue(stats.mtime.toLocaleString())}`);
        }
    } catch (e) {
        log.error('Error:', e.message);
        process.exit(1);
    }
}

async function listTables(name) {
    try {
        const config = await loadConfig();
        const db = config.databases?.find(d => d.name === name);
        if (!db) throw new Error(`Database ${name} not found`);

        const backupDir = path.join(config.backup_dir, name, 'hourly');
        const files = await fs.readdir(backupDir);
        if (!files.length) throw new Error('No backups found');
        const sorted = await Promise.all(files.filter(f => !f.endsWith('.meta.json')).map(async f => ({ name: f, time: (await fs.stat(path.join(backupDir, f))).mtime.getTime() })));
        sorted.sort((a, b) => b.time - a.time);
        const latestBackup = path.join(backupDir, sorted[0].name);

        const { listBackupTables } = await import('./backup/table-restore.js');
        await listBackupTables(db, latestBackup);
    } catch (e) {
        log.error('Error:', e.message);
        process.exit(1);
    }
}

async function restoreTable(name, table, options) {
    try {
        const config = await loadConfig();
        const db = config.databases?.find(d => d.name === name);
        if (!db) throw new Error(`Database ${name} not found`);

        const backupDir = path.join(config.backup_dir, name, 'hourly');
        const files = await fs.readdir(backupDir);
        if (!files.length) throw new Error('No backups found');
        const sorted = await Promise.all(files.filter(f => !f.endsWith('.meta.json')).map(async f => ({ name: f, time: (await fs.stat(path.join(backupDir, f))).mtime.getTime() })));
        sorted.sort((a, b) => b.time - a.time);
        const latestBackup = path.join(backupDir, sorted[0].name);

        const { restoreTable: restoreTableFn } = await import('./backup/table-restore.js');
        await restoreTableFn(db, latestBackup, table, options.target || name);
        log.success(`Table ${table} restored successfully`);
    } catch (e) {
        log.error('Error:', e.message);
        process.exit(1);
    }
}

async function interactiveRestore(name, options) {
    try {
        const config = await loadConfig();
        const db = config.databases?.find(d => d.name === name);
        if (!db) throw new Error(`Database ${name} not found`);

        const backupDir = path.join(config.backup_dir, name, 'hourly');
        const files = await fs.readdir(backupDir);
        if (!files.length) throw new Error('No backups found');
        const sorted = await Promise.all(files.filter(f => !f.endsWith('.meta.json')).map(async f => ({ name: f, time: (await fs.stat(path.join(backupDir, f))).mtime.getTime() })));
        sorted.sort((a, b) => b.time - a.time);
        const latestBackup = path.join(backupDir, sorted[0].name);

        const { interactiveTableRestore } = await import('./backup/table-restore.js');
        await interactiveTableRestore(db, latestBackup, options.target || name);
    } catch (e) {
        log.error('Error:', e.message);
        process.exit(1);
    }
}

async function runHourlyBackups() {
    try {
        const config = await loadConfig();
        const manager = new BackupManager(config);

        for (const db of config.databases || []) {
            try {
                log.info(`Processing ${chalk.cyan(db.name)}`);
                const dest = await manager.performBackup(db);
                log.success(`Backup created at ${chalk.gray(dest)}`);

                // Handle test restore
                const now = new Date();
                const hour = now.getHours();
                if (db.test_restore?.enabled && hour === (db.test_restore.hour || 3)) {
                    log.info(`Running scheduled test restore for ${chalk.cyan(db.name)}`);
                    await manager.testRestore(db, dest);
                }

            } catch (e) {
                log.error(`Error processing ${chalk.cyan(db.name)}:`, e.message);
            }
        }
    } catch (e) {
        log.error('Error:', e.message);
        process.exit(1);
    }
}

async function initPowerBackup() {
    try {
        console.log(chalk.yellow('🚀 Initializing PowerBackup...\n'));
        
        // Detect operating system and run appropriate setup script
        const os = process.platform;
        const { execSync } = await import('child_process');
        
        console.log(chalk.cyan('🔧 Detecting operating system...'));
        console.log(chalk.gray(`Platform: ${os}`));
        
        let setupScript = '';
        let setupCommand = '';
        
        if (os === 'win32') {
            setupScript = 'setup.bat';
            setupCommand = 'setup.bat';
            console.log(chalk.yellow('🪟 Windows detected - running Windows setup script...'));
        } else {
            setupScript = 'setup.sh';
            setupCommand = './setup.sh';
            console.log(chalk.yellow('🐧 Linux/macOS detected - running Unix setup script...'));
        }
        
        // Check if setup script exists
        console.log(chalk.gray(`Checking for setup script: ${setupScript}`));
        try {
            await fs.access(setupScript);
            console.log(chalk.green(`✅ Setup script found: ${setupScript}`));
        } catch (e) {
            console.log(chalk.red(`❌ Setup script not found: ${setupScript}`));
            console.log(chalk.yellow('💡 Running basic initialization instead...'));
            
            // Fall back to basic initialization
            await basicInit();
            return;
        }
        
        console.log(chalk.cyan('⏳ Running setup script...'));
        console.log(chalk.gray('This may take a few minutes. Please wait...\n'));
        
        try {
            // Run the setup script
            execSync(setupCommand, { 
                stdio: 'inherit',
                cwd: process.cwd()
            });
            
            console.log(chalk.green('\n✅ Setup completed successfully!\n'));
            console.log(chalk.yellow('Next steps:'));
            console.log(`  1. ${chalk.green('powerbackup add-db')} - Add your first database`);
            console.log(`  2. ${chalk.green('powerbackup create-now <name>')} - Create your first backup`);
            console.log(`  3. ${chalk.green('powerbackup --help')} - View all available commands\n`);
            
        } catch (e) {
            console.log(chalk.red(`❌ Setup script failed: ${e.message}`));
            console.log(chalk.yellow('💡 Running basic initialization instead...'));
            
            // Fall back to basic initialization
            await basicInit();
        }
        
    } catch (e) {
        log.error('Initialization failed:', e.message);
        process.exit(1);
    }
}

async function basicInit() {
    try {
        console.log(chalk.cyan('🔧 Running basic initialization...\n'));
        
        // Check if config already exists
        const configPath = path.resolve(process.cwd(), program.opts().config);
        try {
            await fs.access(configPath);
            const overwrite = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'overwrite',
                    message: 'Configuration file already exists. Overwrite?',
                    default: false
                }
            ]);
            
            if (!overwrite.overwrite) {
                log.info('Initialization cancelled.');
                return;
            }
        } catch (e) {
            // Config doesn't exist, continue
        }
        
        // Create default config aligned with example schema
        const defaultConfig = {
            backup_dir: "../../backups",
            gpg: {
                symmetric_passphrase_file: "./src/config/passphrase",
                recipients: []
            },
            restore_locations: {},
            databases: [],
            keyring_path: "./src/config/keyring.gpg",
            default_keep: {
                hourly: 24,
                daily: 7,
                weekly: 4,
                monthly: 12,
                yearly: 0
            }
        };
        
        // Create directories
        const dirs = [
            './backups',
            './logs',
            './src/config'
        ];
        
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
                log.success(`Created directory: ${chalk.gray(dir)}`);
            } catch (e) {
                log.warn(`Directory already exists: ${chalk.gray(dir)}`);
            }
        }
        
        // Save config
        await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
        log.success(`Configuration saved to: ${chalk.gray(configPath)}`);
        
        console.log(chalk.green('\n✅ Basic initialization completed!\n'));
        console.log(chalk.yellow('Next steps:'));
        console.log(`  1. ${chalk.green('powerbackup add-db')} - Add your first database`);
        console.log(`  2. ${chalk.green('powerbackup create-now <name>')} - Create your first backup`);
        console.log(`  3. ${chalk.green('powerbackup --help')} - View all available commands\n`);
        
    } catch (e) {
        log.error('Basic initialization failed:', e.message);
        process.exit(1);
    }
}

// Restore location management functions
async function listRestoreLocations() {
    try {
        const configPath = path.resolve(process.cwd(), program.opts().config);
        const manager = new RestoreLocationsManager(configPath);
        await manager.listRestoreLocations();
    } catch (e) {
        log.error('Error:', e.message);
        process.exit(1);
    }
}

async function addRestoreLocation() {
    try {
        const configPath = path.resolve(process.cwd(), program.opts().config);
        const manager = new RestoreLocationsManager(configPath);
        await manager.interactiveAddRestoreLocation();
    } catch (e) {
        log.error('Error:', e.message);
        process.exit(1);
    }
}

async function removeRestoreLocation() {
    try {
        const configPath = path.resolve(process.cwd(), program.opts().config);
        const manager = new RestoreLocationsManager(configPath);
        await manager.interactiveRemoveRestoreLocation();
    } catch (e) {
        log.error('Error:', e.message);
        process.exit(1);
    }
}

async function manageRestoreLocations() {
    try {
        const configPath = path.resolve(process.cwd(), program.opts().config);
        const manager = new RestoreLocationsManager(configPath);
        await manager.manageRestoreLocations();
    } catch (e) {
        log.error('Error:', e.message);
        process.exit(1);
    }
}

// API Management Functions
async function enableAPI() {
    try {
        const config = await loadConfig();
        
        if (!config.api) {
            config.api = {
                enabled: true,
                port: 3000,
                host: 'localhost',
                cors: {
                    origins: ['http://localhost:3000']
                },
                rateLimit: {
                    max: 100,
                    windowMs: 900000
                },
                auth: {
                    hmacSecret: null,
                    jwtSecret: null,
                    tokenExpiry: '24h'
                }
            };
        } else {
            config.api.enabled = true;
        }

        // Generate secrets if not present
        if (!config.api.auth.hmacSecret) {
            const crypto = require('crypto');
            config.api.auth.hmacSecret = crypto.randomBytes(32).toString('hex');
        }
        
        if (!config.api.auth.jwtSecret) {
            const crypto = require('crypto');
            config.api.auth.jwtSecret = crypto.randomBytes(32).toString('hex');
        }

        await saveConfig(config);
        log.success('✅ PowerBackup API enabled successfully!');
        log.info(`🔑 HMAC Secret: ${chalk.cyan(config.api.auth.hmacSecret)}`);
        log.info(`🔑 JWT Secret: ${chalk.cyan(config.api.auth.jwtSecret)}`);
        log.info(`🌐 API will be available at: ${chalk.cyan(`http://${config.api.host}:${config.api.port}`)}`);
        log.info(`📋 Start the API with: ${chalk.green('npm run api')}`);
    } catch (e) {
        log.error('Error:', e.message);
        process.exit(1);
    }
}

async function disableAPI() {
    try {
        const config = await loadConfig();
        
        if (config.api) {
            config.api.enabled = false;
            await saveConfig(config);
            log.success('✅ PowerBackup API disabled successfully!');
        } else {
            log.warn('API was not configured');
        }
    } catch (e) {
        log.error('Error:', e.message);
        process.exit(1);
    }
}

async function apiStatus() {
    try {
        const config = await loadConfig();
        
        if (!config.api) {
            log.info('📋 API Status: Not configured');
            return;
        }

        log.info('📋 PowerBackup API Status:');
        console.log(`  Status: ${config.api.enabled ? chalk.green('✅ Enabled') : chalk.red('❌ Disabled')}`);
        console.log(`  Host: ${chalk.cyan(config.api.host)}`);
        console.log(`  Port: ${chalk.cyan(config.api.port)}`);
        console.log(`  HMAC Secret: ${config.api.auth?.hmacSecret ? chalk.green('✅ Configured') : chalk.red('❌ Not configured')}`);
        console.log(`  JWT Secret: ${config.api.auth?.jwtSecret ? chalk.green('✅ Configured') : chalk.red('❌ Not configured')}`);
        
        if (config.api.enabled) {
            console.log(`\n🌐 API URL: ${chalk.cyan(`http://${config.api.host}:${config.api.port}`)}`);
            console.log(`📋 Start command: ${chalk.green('npm run api')}`);
        }
    } catch (e) {
        log.error('Error:', e.message);
        process.exit(1);
    }
}

async function generateAPIKeys() {
    try {
        const config = await loadConfig();
        
        if (!config.api) {
            log.error('API must be enabled first. Run: powerbackup api:enable');
            process.exit(1);
        }

        const crypto = require('crypto');
        const newHmacSecret = crypto.randomBytes(32).toString('hex');
        const newJwtSecret = crypto.randomBytes(32).toString('hex');

        config.api.auth.hmacSecret = newHmacSecret;
        config.api.auth.jwtSecret = newJwtSecret;

        await saveConfig(config);
        log.success('✅ New API keys generated successfully!');
        log.info(`🔑 New HMAC Secret: ${chalk.cyan(newHmacSecret)}`);
        log.info(`🔑 New JWT Secret: ${chalk.cyan(newJwtSecret)}`);
        log.warn('⚠️  Previous API keys are now invalid. Update your clients accordingly.');
    } catch (e) {
        log.error('Error:', e.message);
        process.exit(1);
    }
}

// Parse arguments and run
async function main() {
    try {
        // Show banner only once at the beginning
        showBanner();
        
        // If no command specified, show beautiful help
        if (process.argv.length === 2) {
            showBeautifulHelp();
            return;
        }
        
        await program.parseAsync(process.argv);
    } catch (e) {
        log.error('Error:', e.message);
        process.exit(1);
    }
}

// Beautiful help display
function showBeautifulHelp() {
    console.log(chalk.cyan(`\n🚀 PowerBackup v${PKG_VERSION} - Quick Start Guide\n`));
    
    console.log(chalk.yellow('📋 Database Management:'));
    console.log(`  ${chalk.green('powerbackup list-dbs')}     - List all configured databases`);
    console.log(`  ${chalk.green('powerbackup add-db')}       - Add a new database interactively`);
    console.log(`  ${chalk.green('powerbackup init')}         - Initialize PowerBackup configuration\n`);
    
    console.log(chalk.yellow('📍 Restore Location Management:'));
    console.log(`  ${chalk.green('powerbackup list-restore-locations')}     - List configured restore locations`);
    console.log(`  ${chalk.green('powerbackup add-restore-location')}       - Add a new restore location`);
    console.log(`  ${chalk.green('powerbackup manage-restore-locations')}   - Interactive restore location management\n`);
    
    console.log(chalk.yellow('💾 Backup Operations:'));
    console.log(`  ${chalk.green('powerbackup create-now <db>')}  - Create backup immediately`);
    console.log(`  ${chalk.green('powerbackup list-backups <db>')} - List available backups\n`);
    
    console.log(chalk.yellow('🔄 Restore Operations:'));
    console.log(`  ${chalk.green('powerbackup test-restore <db>')}     - Test restore (safe, temporary)`);
    console.log(`  ${chalk.green('powerbackup restore <db>')}   - Restore to target database\n`);
    
    console.log(chalk.yellow('🎯 Table-Level Operations:'));
    console.log(`  ${chalk.green('powerbackup list-tables <db>')}      - List tables in latest backup`);
    console.log(`  ${chalk.green('powerbackup restore-table <db> <table>')} - Restore specific table`);
    console.log(`  ${chalk.green('powerbackup interactive-restore <db>')}   - Interactive table selection\n`);
    
    console.log(chalk.yellow('🔌 API Management:'));
    console.log(`  ${chalk.green('powerbackup api:enable')}        - Enable PowerBackup API`);
    console.log(`  ${chalk.green('powerbackup api:disable')}       - Disable PowerBackup API`);
    console.log(`  ${chalk.green('powerbackup api:status')}        - Show API status`);
    console.log(`  ${chalk.green('powerbackup api:generate-key')}  - Generate new API keys\n`);
    
    console.log(chalk.yellow('🔧 Options:'));
    console.log(`  ${chalk.gray('--target <database>')} - Specify target database for restore operations`);
    console.log(`  ${chalk.gray('--tier <tier>')}       - Specify backup tier (hourly, daily, weekly, monthly, yearly)\n`);
    
    console.log(chalk.cyan('💡 Examples:'));
    console.log(`  ${chalk.gray('powerbackup create-now myapp')}`);
    console.log(`  ${chalk.gray('powerbackup test-restore myapp')}`);
    console.log(`  ${chalk.gray('powerbackup restore myapp')}`);
    console.log(`  ${chalk.gray('powerbackup restore-table myapp users')}`);
    console.log(`  ${chalk.gray('powerbackup interactive-restore myapp')}\n`);
    
    console.log(chalk.magenta('🎨 Features:'));
    console.log(`  ✨ Beautiful colored logging with emojis`);
    console.log(`  🔐 GPG encryption support`);
    console.log(`  🗜️ Gzip compression`);
    console.log(`  🎯 Granular table-level restore`);
    console.log(`  🔄 Automated test restores`);
    console.log(`  ☁️ AWS S3 integration\n`);
    
    console.log(chalk.blue('📖 For detailed help:'));
    console.log(`  ${chalk.gray('powerbackup --help')} - Show all available commands\n`);
    
    console.log(chalk.green('🌟 PowerBackup - The Beautiful Backup Experience!\n'));
}

main();
