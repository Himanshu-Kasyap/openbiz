/**
 * @fileoverview Metrics routes
 * @author Udyam Backend Team
 * @version 1.0.0
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Basic metrics endpoint
 * @route GET /api/metrics
 */
router.get('/', asyncHandler(async (req, res) => {
  const metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };

  res.json(metrics);
}));

module.exports = router;