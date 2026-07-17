/**
 * Admin Seeding Module
 * Responsibility: Simulates/coordinates bulk seeding of Admin users.
 */

import mongoose from 'mongoose';
import logger from './helpers/logger.js';

/**
 * Seeds Admin accounts based on the preset configuration.
 * @param {object} config - Seeding configuration preset.
 * @param {object} context - Shared ID tracking context.
 * @param {object} options - Execution options (e.g. dryRun).
 * @returns {Promise<object>} Updated context.
 */
export async function seedAdmins(config, context, options = {}) {
  const count = config.admins || 0;
  logger.info(`Starting Admin seeding: target count is ${count}`);

  const mockAdmins = [];
  const adminIds = [];

  for (let i = 0; i < count; i++) {
    const adminId = new mongoose.Types.ObjectId();
    adminIds.push(adminId);
    mockAdmins.push({
      _id: adminId,
      // Future fields: name, email, password, etc.
    });
  }

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${count} Admin(s) with bulk insert.`);
  } else {
    // Phase 2: Implement Mongoose Admin.insertMany(mockAdmins)
    logger.success(`Seeded ${count} Admin(s) (Framework Skeleton)`);
  }

  context.adminIds = adminIds;
  return context;
}

export default seedAdmins;
