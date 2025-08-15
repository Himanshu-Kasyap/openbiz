/**
 * @fileoverview Database configuration and Prisma client setup
 */

const { PrismaClient } = require('@prisma/client');
const winston = require('winston');

/**
 * Prisma client instance with logging configuration
 * @type {PrismaClient}
 */
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Set up Prisma logging
prisma.$on('query', (e) => {
  winston.debug('Query: ' + e.query);
  winston.debug('Params: ' + e.params);
  winston.debug('Duration: ' + e.duration + 'ms');
});

prisma.$on('error', (e) => {
  winston.error('Database error:', e);
});

prisma.$on('info', (e) => {
  winston.info('Database info:', e.message);
});

prisma.$on('warn', (e) => {
  winston.warn('Database warning:', e.message);
});

/**
 * Connect to the database
 * @returns {Promise<void>}
 */
async function connectDatabase() {
  try {
    await prisma.$connect();
    winston.info('Database connected successfully');
  } catch (error) {
    winston.error('Failed to connect to database:', error);
    throw error;
  }
}

/**
 * Disconnect from the database
 * @returns {Promise<void>}
 */
async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    winston.info('Database disconnected successfully');
  } catch (error) {
    winston.error('Failed to disconnect from database:', error);
    throw error;
  }
}

/**
 * Check database health
 * @returns {Promise<boolean>}
 */
async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    winston.error('Database health check failed:', error);
    return false;
  }
}

module.exports = {
  prisma,
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth,
};