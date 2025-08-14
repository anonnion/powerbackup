#!/usr/bin/env node

// PowerBackup REST API Server
// Provides secure REST API access to PowerBackup functionality

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { log } from '../utils/logger.js';
import { loadConfig } from '../utils/config.js';
import { authMiddleware } from './middleware/auth.js';
import { auditMiddleware } from './middleware/audit.js';
import { validationMiddleware } from './middleware/validation.js';
import { errorHandler } from './middleware/error.js';

// Import route handlers
import statusRoutes from './routes/status.js';
import databaseRoutes from './routes/databases.js';
import backupRoutes from './routes/backups.js';
import restoreRoutes from './routes/restores.js';
import tableRoutes from './routes/tables.js';
import logRoutes from './routes/logs.js';

class PowerBackupAPI {
    constructor(config = null) {
        this.app = express();
        this.config = config;
        this.server = null;
        this.port = process.env.POWERBACKUP_API_PORT || 3000;
        this.host = process.env.POWERBACKUP_API_HOST || 'localhost';
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    async initialize() {
        try {
            // Load config if not provided
            if (!this.config) {
                this.config = await loadConfig();
            }

            // Check if API is enabled
            if (!this.config.api?.enabled) {
                throw new Error('PowerBackup API is not enabled. Set api.enabled to true in config.');
            }

            log.info('🚀 PowerBackup API initialized successfully');
            return true;
        } catch (error) {
            log.error('Failed to initialize PowerBackup API:', error.message);
            throw error;
        }
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));

        // CORS configuration
        this.app.use(cors({
            origin: this.config?.api?.cors?.origins || ['http://localhost:3000'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: this.config?.api?.rateLimit?.max || 100, // limit each IP to 100 requests per windowMs
            message: {
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use(limiter);

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            log.info(`${req.method} ${req.path} - ${req.ip}`);
            next();
        });

        // Audit logging
        this.app.use(auditMiddleware);

        // Input validation
        this.app.use(validationMiddleware);
    }

    setupRoutes() {
        // Health check endpoint (no auth required)
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || PKG_VERSION,
                uptime: process.uptime()
            });
        });

        // API routes (auth required)
        this.app.use('/api/v1', authMiddleware);
        this.app.use('/api/v1/status', statusRoutes);
        this.app.use('/api/v1/databases', databaseRoutes);
        this.app.use('/api/v1/backups', backupRoutes);
        this.app.use('/api/v1/restores', restoreRoutes);
        this.app.use('/api/v1/tables', tableRoutes);
        this.app.use('/api/v1/logs', logRoutes);

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.originalUrl,
                method: req.method
            });
        });
    }

    setupErrorHandling() {
        this.app.use(errorHandler);
    }

    async start() {
        try {
            await this.initialize();
            
            this.server = this.app.listen(this.port, this.host, () => {
                log.success(`🚀 PowerBackup API server running on http://${this.host}:${this.port}`);
                log.info(`📋 API Documentation: http://${this.host}:${this.port}/api/v1/docs`);
                log.info(`🔒 Authentication: HMAC-SHA256 required for all endpoints`);
            });

            // Graceful shutdown
            process.on('SIGTERM', () => this.shutdown());
            process.on('SIGINT', () => this.shutdown());

            return this.server;
        } catch (error) {
            log.error('Failed to start PowerBackup API:', error.message);
            throw error;
        }
    }

    async shutdown() {
        if (this.server) {
            log.info('🛑 Shutting down PowerBackup API server...');
            this.server.close(() => {
                log.success('PowerBackup API server stopped');
                process.exit(0);
            });
        }
    }
}

// Export for programmatic use
export { PowerBackupAPI };

// Start server if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const api = new PowerBackupAPI();
    api.start().catch(error => {
        log.error('Failed to start API server:', error.message);
        process.exit(1);
    });
}


