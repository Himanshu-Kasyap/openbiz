/**
 * @fileoverview Database utility functions for performance optimization and monitoring
 */

const { prisma } = require('../config/database');
const winston = require('winston');

/**
 * Get database statistics and performance metrics
 * @returns {Promise<Object>} Database statistics
 */
async function getDatabaseStats() {
  try {
    const [userCount, submissionCount, schemaCount] = await Promise.all([
      prisma.user.count(),
      prisma.formSubmission.count(),
      prisma.formSchema.count(),
    ]);

    const recentSubmissions = await prisma.formSubmission.count({
      where: {
        submittedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    return {
      totalUsers: userCount,
      totalSubmissions: submissionCount,
      totalSchemas: schemaCount,
      recentSubmissions,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    winston.error('Failed to get database stats:', error);
    throw error;
  }
}

/**
 * Clean up old form submissions (older than 30 days)
 * @returns {Promise<number>} Number of deleted records
 */
async function cleanupOldSubmissions() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const result = await prisma.formSubmission.deleteMany({
      where: {
        submittedAt: {
          lt: thirtyDaysAgo,
        },
        validationStatus: 'completed',
      },
    });

    winston.info(`Cleaned up ${result.count} old form submissions`);
    return result.count;
  } catch (error) {
    winston.error('Failed to cleanup old submissions:', error);
    throw error;
  }
}

/**
 * Get user submission history with pagination
 * @param {string} userId - User ID
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated submission history
 */
async function getUserSubmissionHistory(userId, page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    
    const [submissions, total] = await Promise.all([
      prisma.formSubmission.findMany({
        where: { userId },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              sessionId: true,
              status: true,
            },
          },
        },
      }),
      prisma.formSubmission.count({
        where: { userId },
      }),
    ]);

    return {
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    winston.error('Failed to get user submission history:', error);
    throw error;
  }
}

/**
 * Get active form schema
 * @returns {Promise<Object|null>} Active form schema
 */
async function getActiveFormSchema() {
  try {
    const schema = await prisma.formSchema.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return schema;
  } catch (error) {
    winston.error('Failed to get active form schema:', error);
    throw error;
  }
}

/**
 * Update form schema and deactivate previous versions
 * @param {string} version - Schema version
 * @param {Object} schemaData - Schema data
 * @returns {Promise<Object>} Created schema
 */
async function updateFormSchema(version, schemaData) {
  try {
    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Deactivate all existing schemas
      await tx.formSchema.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Create new active schema
      const newSchema = await tx.formSchema.create({
        data: {
          version,
          schemaData,
          isActive: true,
        },
      });

      return newSchema;
    });

    winston.info(`Updated form schema to version ${version}`);
    return result;
  } catch (error) {
    winston.error('Failed to update form schema:', error);
    throw error;
  }
}

/**
 * Bulk insert form submissions (for data migration or bulk operations)
 * @param {Array<Object>} submissions - Array of submission data
 * @returns {Promise<number>} Number of created submissions
 */
async function bulkInsertSubmissions(submissions) {
  try {
    const result = await prisma.formSubmission.createMany({
      data: submissions,
      skipDuplicates: true,
    });

    winston.info(`Bulk inserted ${result.count} form submissions`);
    return result.count;
  } catch (error) {
    winston.error('Failed to bulk insert submissions:', error);
    throw error;
  }
}

/**
 * Get submission analytics by step
 * @param {Date} startDate - Start date for analytics
 * @param {Date} endDate - End date for analytics
 * @returns {Promise<Array>} Analytics data by step
 */
async function getSubmissionAnalytics(startDate, endDate) {
  try {
    const analytics = await prisma.formSubmission.groupBy({
      by: ['stepNumber', 'validationStatus'],
      where: {
        submittedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        stepNumber: 'asc',
      },
    });

    return analytics.map(item => ({
      step: item.stepNumber,
      status: item.validationStatus,
      count: item._count.id,
    }));
  } catch (error) {
    winston.error('Failed to get submission analytics:', error);
    throw error;
  }
}

module.exports = {
  getDatabaseStats,
  cleanupOldSubmissions,
  getUserSubmissionHistory,
  getActiveFormSchema,
  updateFormSchema,
  bulkInsertSubmissions,
  getSubmissionAnalytics,
};