import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { log } from './logger.js';
import chalk from 'chalk';

/**
 * Restore Locations Manager
 * Handles storing and retrieving restore location configurations
 */
export class RestoreLocationsManager {
    constructor(configPath) {
        this.configPath = configPath;
    }

    /**
     * Load configuration from file
     */
    async loadConfig() {
        try {
            const content = await fs.readFile(this.configPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            throw new Error(`Failed to load config: ${error.message}`);
        }
    }

    /**
     * Save configuration to file
     */
    async saveConfig(config) {
        try {
            await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
        } catch (error) {
            throw new Error(`Failed to save config: ${error.message}`);
        }
    }

    /**
     * Get all restore locations
     */
    async getRestoreLocations() {
        const config = await this.loadConfig();
        return config.restore_locations || {};
    }

    /**
     * Get restore location by name and database type
     */
    async getRestoreLocation(name, dbType) {
        const locations = await this.getRestoreLocations();
        return locations[name]?.[dbType];
    }

    /**
     * Add a new restore location
     */
    async addRestoreLocation(name, dbType, url) {
        const config = await this.loadConfig();
        
        if (!config.restore_locations) {
            config.restore_locations = {};
        }
        
        if (!config.restore_locations[name]) {
            config.restore_locations[name] = {};
        }
        
        config.restore_locations[name][dbType] = url;
        await this.saveConfig(config);
        
        log.success(`Added restore location: ${chalk.cyan(name)} (${chalk.yellow(dbType)})`);
    }

    /**
     * Remove a restore location
     */
    async removeRestoreLocation(name, dbType = null) {
        const config = await this.loadConfig();
        
        if (!config.restore_locations || !config.restore_locations[name]) {
            throw new Error(`Restore location '${name}' not found`);
        }
        
        if (dbType) {
            // Remove specific database type
            if (!config.restore_locations[name][dbType]) {
                throw new Error(`Restore location '${name}' (${dbType}) not found`);
            }
            delete config.restore_locations[name][dbType];
            
            // Remove the entire location if no more database types
            if (Object.keys(config.restore_locations[name]).length === 0) {
                delete config.restore_locations[name];
            }
        } else {
            // Remove entire location
            delete config.restore_locations[name];
        }
        
        await this.saveConfig(config);
        log.success(`Removed restore location: ${chalk.cyan(name)}${dbType ? ` (${chalk.yellow(dbType)})` : ''}`);
    }

    /**
     * List all restore locations
     */
    async listRestoreLocations() {
        const locations = await this.getRestoreLocations();
        
        if (Object.keys(locations).length === 0) {
            log.warn('No restore locations configured');
            return;
        }
        
        log.info('📋 Configured restore locations:');
        for (const [name, dbTypes] of Object.entries(locations)) {
            console.log(`  ${chalk.cyan(name)}:`);
            for (const [dbType, url] of Object.entries(dbTypes)) {
                const maskedUrl = this.maskUrl(url);
                console.log(`    ${chalk.yellow(dbType)}: ${chalk.gray(maskedUrl)}`);
            }
        }
    }

    /**
     * Interactive restore location selection
     */
    async selectRestoreLocation(dbType) {
        const locations = await this.getRestoreLocations();
        
        if (Object.keys(locations).length === 0) {
            throw new Error('No restore locations configured. Use "powerbackup add-restore-location" to add one.');
        }
        
        // Filter locations that have the specified database type
        const availableLocations = Object.entries(locations)
            .filter(([name, dbTypes]) => dbTypes[dbType])
            .map(([name, dbTypes]) => ({
                name: `${name} (${dbType})`,
                value: { name, url: dbTypes[dbType] }
            }));
        
        if (availableLocations.length === 0) {
            throw new Error(`No restore locations found for database type: ${dbType}`);
        }
        
        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'location',
                message: `Select restore location for ${dbType}:`,
                choices: availableLocations
            }
        ]);
        
        return answer.location;
    }

    /**
     * Interactive restore location management
     */
    async manageRestoreLocations() {
        const action = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: 'List restore locations', value: 'list' },
                    { name: 'Add restore location', value: 'add' },
                    { name: 'Remove restore location', value: 'remove' },
                    { name: 'Back', value: 'back' }
                ]
            }
        ]);
        
        switch (action.action) {
            case 'list':
                await this.listRestoreLocations();
                break;
                
            case 'add':
                await this.interactiveAddRestoreLocation();
                break;
                
            case 'remove':
                await this.interactiveRemoveRestoreLocation();
                break;
                
            case 'back':
                return;
        }
    }

    /**
     * Interactive add restore location
     */
    async interactiveAddRestoreLocation() {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Restore location name (e.g., development, staging, testing):',
                validate: input => input ? true : 'Name is required'
            },
            {
                type: 'list',
                name: 'dbType',
                message: 'Database type:',
                choices: ['mysql', 'postgres']
            },
            {
                type: 'input',
                name: 'url',
                message: 'Database URL:',
                validate: input => input ? true : 'URL is required'
            }
        ]);
        
        await this.addRestoreLocation(answers.name, answers.dbType, answers.url);
    }

    /**
     * Interactive remove restore location
     */
    async interactiveRemoveRestoreLocation() {
        const locations = await this.getRestoreLocations();
        
        if (Object.keys(locations).length === 0) {
            log.warn('No restore locations to remove');
            return;
        }
        
        // Create choices for removal
        const choices = [];
        for (const [name, dbTypes] of Object.entries(locations)) {
            for (const [dbType, url] of Object.entries(dbTypes)) {
                choices.push({
                    name: `${name} (${dbType})`,
                    value: { name, dbType }
                });
            }
        }
        
        choices.push({ name: 'Back', value: 'back' });
        
        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'location',
                message: 'Select restore location to remove:',
                choices
            }
        ]);
        
        if (answer.location !== 'back') {
            await this.removeRestoreLocation(answer.location.name, answer.location.dbType);
        }
    }

    /**
     * Mask sensitive information in URLs
     */
    maskUrl(url) {
        try {
            const parsed = new URL(url);
            const maskedPassword = parsed.password ? '*'.repeat(parsed.password.length) : '';
            parsed.password = maskedPassword;
            return parsed.toString();
        } catch (error) {
            // If URL parsing fails, just return the original
            return url;
        }
    }

    /**
     * Validate restore location URL
     */
    validateRestoreLocationUrl(url, dbType) {
        try {
            const parsed = new URL(url);
            
            if (dbType === 'mysql') {
                return parsed.protocol === 'mysql:';
            } else if (dbType === 'postgres') {
                return parsed.protocol === 'postgresql:';
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }
}
