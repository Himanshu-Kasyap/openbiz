/**
 * @fileoverview Health check routes
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const express = require('express');
const { checkDatabaseHealth } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Health check endpoint
 * @route GET /api/health
 */
router.get('/', asyncHandler(async (req, res) => {
  const dbHealthy = await checkDatabaseHealth();
  
  const health = {
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealthy ? 'connected' : 'disconnected'
  };

  res.status(dbHealthy ? 200 : 503).json(health);
}));

module.exports = router;