/**
 * MCP Server Logger
 * 
 * Logging utility for the MCP server using Winston.
 */

const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Create the logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'mcp-server' },
    transports: [
        // Write logs to console
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        // Write logs to file (development only)
        ...(process.env.NODE_ENV !== 'production' ? [
            new winston.transports.File({
                filename: path.join(__dirname, '../../../logs/error.log'),
                level: 'error'
            }),
            new winston.transports.File({
                filename: path.join(__dirname, '../../../logs/combined.log')
            })
        ] : [])
    ]
});

module.exports = logger;
