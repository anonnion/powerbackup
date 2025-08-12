// CLI entrypoint for PowerBackup
import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { BackupManager } from './backup/manager.js';
import { log } from './utils/logger.js';
import chalk from 'chalk';
import figlet from 'figlet';

// Display beautiful banner
function showBanner() {
    console.log(chalk.cyan(figlet.textSync('PowerBackup', { font: 'Standard' })));
    console.log(chalk.gray('Multi-Database Backup & Restore Tool v2.0.0\n'));
}

const program = new Command();
program.version('2.0.0').description('Multi-DB backup & rotation tool with beautiful logging').option('-c, --config <path>', 'Config file path', './src/config/config.json');

program.command('list-dbs').description('List configured databases').action(listDbs);
program.command('add-db').description('Add a new database').action(addDb);
program.command('create-now <name>').description('Create backup immediately').action(createNow);
program.command('test-restore <name>').description('Test restore to temporary database (safe)').action(testRestore);
program.command('restore <name>').description('Restore to target database (destructive)').option('--target <database>', 'Target database name (defaults to original name)').action(actualRestore);
program.command('list-tables <name>').description('List tables in latest backup').action(listTables);
program.command('restore-table <name> <table>').description('Restore specific table from latest backup').option('--target <database>', 'Target database name (defaults to original name)').action(restoreTable);
program.command('interactive-restore <name>').description('Interactive table restore from latest backup').option('--target <database>', 'Target database name (defaults to original name)').action(interactiveRestore);
program.command('list-backups <name>').description('List backups for database').option('--tier <tier>', 'Backup tier', 'hourly').action(listBackups);

async function loadConfig() {
    try {
        const configPath = path.resolve(process.cwd(), program.opts().config);
        const content = await fs.readFile(configPath, 'utf8');
        return JSON.parse(content);
    } catch (e) {
        throw new Error(`Failed to load config: ${e.message}`);
    }
}

async function saveConfig(config) {
    try {
        const configPath = path.resolve(process.cwd(), program.opts().config);
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    } catch (e) {
        throw new Error(`Failed to save config: ${e.message}`);
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

async function addDb() {
    try {
        const answers = await inquirer.prompt([
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
        const config = await loadConfig();
        const db = { name: answers.name, type: answers.type };
        if (answers.url) db.url = answers.url;
        if (answers.urlEnv) db.url_env = answers.urlEnv;
        if (answers.configureRetention) db.keep = { hourly: parseInt(answers.keepHourly), daily: parseInt(answers.keepDaily), weekly: 4, monthly: 12, yearly: 0 };
        if (answers.enableTestRestore) db.test_restore = { enabled: true, hour: parseInt(answers.testHour) };
        config.databases = config.databases || [];
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
        const manager = new BackupManager(config);
        await manager.testRestore(db, latestBackup);
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

        const manager = new BackupManager(config);
        await manager.actualRestore(db, latestBackup, options.target || name);
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

// Parse arguments and run
async function main() {
    try {
        // Show banner for interactive commands
        if (process.argv.length > 2) {
            showBanner();
        }
        
        // If no command specified, show beautiful help
        if (process.argv.length === 2) {
            showBanner();
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
    console.log(chalk.cyan('\n🚀 PowerBackup v2.0.0 - Quick Start Guide\n'));
    
    console.log(chalk.yellow('📋 Database Management:'));
    console.log(`  ${chalk.green('npm start list-dbs')}     - List all configured databases`);
    console.log(`  ${chalk.green('npm start add-db')}       - Add a new database interactively\n`);
    
    console.log(chalk.yellow('💾 Backup Operations:'));
    console.log(`  ${chalk.green('npm start create-now <db>')}  - Create backup immediately`);
    console.log(`  ${chalk.green('npm start list-backups <db>')} - List available backups\n`);
    
    console.log(chalk.yellow('🔄 Restore Operations:'));
    console.log(`  ${chalk.green('npm start test-restore <db>')}     - Test restore (safe, temporary)`);
    console.log(`  ${chalk.green('npm start restore <db>')}   - Restore to target database\n`);
    
    console.log(chalk.yellow('🎯 Table-Level Operations:'));
    console.log(`  ${chalk.green('npm start list-tables <db>')}      - List tables in latest backup`);
    console.log(`  ${chalk.green('npm start restore-table <db> <table>')} - Restore specific table`);
    console.log(`  ${chalk.green('npm start interactive-restore <db>')}   - Interactive table selection\n`);
    
    console.log(chalk.yellow('🔧 Options:'));
    console.log(`  ${chalk.gray('--target <database>')} - Specify target database for restore operations`);
    console.log(`  ${chalk.gray('--tier <tier>')}       - Specify backup tier (hourly, daily, weekly, monthly, yearly)\n`);
    
    console.log(chalk.cyan('💡 Examples:'));
    console.log(`  ${chalk.gray('npm start create-now myapp')}`);
    console.log(`  ${chalk.gray('npm start test-restore myapp')}`);
    console.log(`  ${chalk.gray('npm start restore myapp')}`);
    console.log(`  ${chalk.gray('npm start restore-table myapp users')}`);
    console.log(`  ${chalk.gray('npm start interactive-restore myapp')}\n`);
    
    console.log(chalk.magenta('🎨 Features:'));
    console.log(`  ✨ Beautiful colored logging with emojis`);
    console.log(`  🔐 GPG encryption support`);
    console.log(`  🗜️ Gzip compression`);
    console.log(`  🎯 Granular table-level restore`);
    console.log(`  🔄 Automated test restores`);
    console.log(`  ☁️ AWS S3 integration\n`);
    
    console.log(chalk.blue('📖 For detailed help:'));
    console.log(`  ${chalk.gray('npm start --help')} - Show all available commands\n`);
    
    console.log(chalk.green('🌟 PowerBackup - The Beautiful Backup Experience!\n'));
}

main();
