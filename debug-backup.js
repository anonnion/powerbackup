#!/usr/bin/env node

import { log } from './src/utils/logger.js';
import { findBinary } from './src/utils/find-binary.js';
import { detectPostgreSQLPath } from './src/utils/find-binary.js';
import { detectMySQLPath } from './src/utils/find-binary.js';
import fs from 'fs/promises';
import path from 'path';

async function debugBackup() {
    log.info('🔍 PowerBackup Debug Script');
    log.info('==========================');
    
    // Check package.json and package-lock.json sync
    try {
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
        log.success('✅ package.json is valid');
        
        const packageLock = JSON.parse(await fs.readFile('package-lock.json', 'utf8'));
        log.success('✅ package-lock.json is valid');
        
        if (packageJson.version === packageLock.version) {
            log.success('✅ package.json and package-lock.json versions match');
        } else {
            log.warn('⚠️  package.json and package-lock.json versions do not match');
            log.info(`   package.json version: ${packageJson.version}`);
            log.info(`   package-lock.json version: ${packageLock.version}`);
        }
    } catch (error) {
        log.error('❌ Error reading package files:', error.message);
    }
    
    // Check PostgreSQL binaries
    log.info('\n🔍 Checking PostgreSQL binaries...');
    try {
        const pgPath = await detectPostgreSQLPath();
        if (pgPath) {
            log.success(`✅ PostgreSQL binaries found at: ${pgPath}`);
            
            // Check specific binaries
            const binaries = ['psql', 'pg_dump', 'pg_restore'];
            for (const binary of binaries) {
                const binaryPath = await findBinary(binary);
                if (binaryPath) {
                    log.success(`✅ ${binary} found at: ${binaryPath}`);
                } else {
                    log.warn(`⚠️  ${binary} not found in PATH`);
                }
            }
            
            // Test the actual binary paths that would be used
            const isWin = process.platform === 'win32';
            const pgDumpName = isWin ? 'pg_dump.exe' : 'pg_dump';
            const actualPgDumpPath = path.join(pgPath, pgDumpName);
            
            try {
                await fs.access(actualPgDumpPath);
                log.success(`✅ pg_dump binary exists at: ${actualPgDumpPath}`);
                
                // Test if it's executable
                const { execSync } = await import('child_process');
                try {
                    execSync(`"${actualPgDumpPath}" --version`, { stdio: 'pipe' });
                    log.success(`✅ pg_dump binary is executable and working`);
                } catch (execError) {
                    log.warn(`⚠️  pg_dump binary exists but not executable: ${execError.message}`);
                }
            } catch (accessError) {
                log.warn(`⚠️  pg_dump binary not found at: ${actualPgDumpPath}`);
            }
        } else {
            log.warn('⚠️  PostgreSQL binaries not found');
        }
    } catch (error) {
        log.error('❌ Error checking PostgreSQL binaries:', error.message);
    }
    
    // Check MySQL binaries
    log.info('\n🔍 Checking MySQL binaries...');
    try {
        const mysqlPath = await detectMySQLPath();
        if (mysqlPath) {
            log.success(`✅ MySQL binaries found at: ${mysqlPath}`);
            
            // Check specific binaries
            const binaries = ['mysql', 'mysqldump'];
            for (const binary of binaries) {
                const binaryPath = await findBinary(binary);
                if (binaryPath) {
                    log.success(`✅ ${binary} found at: ${binaryPath}`);
                } else {
                    log.warn(`⚠️  ${binary} not found in PATH`);
                }
            }
            
            // Test the actual binary paths that would be used
            const isWin = process.platform === 'win32';
            const mysqldumpName = isWin ? 'mysqldump.exe' : 'mysqldump';
            const actualMysqldumpPath = path.join(mysqlPath, mysqldumpName);
            
            try {
                await fs.access(actualMysqldumpPath);
                log.success(`✅ mysqldump binary exists at: ${actualMysqldumpPath}`);
                
                // Test if it's executable
                const { execSync } = await import('child_process');
                try {
                    execSync(`"${actualMysqldumpPath}" --version`, { stdio: 'pipe' });
                    log.success(`✅ mysqldump binary is executable and working`);
                } catch (execError) {
                    log.warn(`⚠️  mysqldump binary exists but not executable: ${execError.message}`);
                }
            } catch (accessError) {
                log.warn(`⚠️  mysqldump binary not found at: ${actualMysqldumpPath}`);
            }
        } else {
            log.warn('⚠️  MySQL binaries not found');
        }
    } catch (error) {
        log.error('❌ Error checking MySQL binaries:', error.message);
    }
    
    // Check passphrase file
    log.info('\n🔍 Checking passphrase file...');
    try {
        const passphrasePath = './src/config/passphrase';
        await fs.access(passphrasePath);
        log.success(`✅ Passphrase file exists at: ${passphrasePath}`);
        
        const passphrase = await fs.readFile(passphrasePath, 'utf8');
        if (passphrase.trim()) {
            log.success('✅ Passphrase file is not empty');
        } else {
            log.warn('⚠️  Passphrase file is empty');
        }
    } catch (error) {
        log.warn(`⚠️  Passphrase file not found: ${error.message}`);
        log.info('   Will be created automatically during backup');
    }
    
    // Check config directory
    log.info('\n🔍 Checking config directory...');
    try {
        const configDir = './src/config';
        await fs.access(configDir);
        log.success(`✅ Config directory exists: ${configDir}`);
        
        const files = await fs.readdir(configDir);
        log.info(`   Files in config directory: ${files.join(', ')}`);
        
        // Check if config.json exists and is valid
        try {
            const configPath = path.join(configDir, 'config.json');
            await fs.access(configPath);
            const configContent = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(configContent);
            log.success('✅ config.json exists and is valid JSON');
            
            // Check binary paths in config
            if (config.binaries) {
                log.info('   Binary paths in config:');
                if (config.binaries.mysqlPath) {
                    log.info(`     MySQL: ${config.binaries.mysqlPath}`);
                }
                if (config.binaries.postgresPath) {
                    log.info(`     PostgreSQL: ${config.binaries.postgresPath}`);
                }
            }
        } catch (configError) {
            log.warn(`⚠️  config.json issue: ${configError.message}`);
        }
    } catch (error) {
        log.warn(`⚠️  Config directory not found: ${error.message}`);
    }
    
    // Check backups directory
    log.info('\n🔍 Checking backups directory...');
    try {
        const backupsDir = './backups';
        await fs.access(backupsDir);
        log.success(`✅ Backups directory exists: ${backupsDir}`);
    } catch (error) {
        log.warn(`⚠️  Backups directory not found: ${error.message}`);
        log.info('   Will be created automatically during backup');
    }
    
    log.info('\n🎯 Debug complete!');
}

debugBackup().catch(error => {
    log.error('❌ Debug script failed:', error);
    process.exit(1);
});
