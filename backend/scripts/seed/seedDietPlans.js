/**
 * DietPlan Seeding Module
 * Responsibility: Simulates/coordinates bulk seeding of client diet plans.
 */

import mongoose from 'mongoose';
import logger from './helpers/logger.js';

/**
 * Seeds DietPlan records based on the configuration preset.
 * @param {object} config - Seeding configuration preset.
 * @param {object} context - Shared ID tracking context.
 * @param {object} options - Execution options (e.g. dryRun).
 * @returns {Promise<object>} Updated context.
 */
export async function seedDietPlans(config, context, options = {}) {
  const dietPlansPerClient = config.dietPlansPerClient || 0;
  const clientIds = context.clientIds || [];

  logger.info(`Starting DietPlan seeding: dietPlansPerClient=${dietPlansPerClient}, totalClients=${clientIds.length}`);

  if (clientIds.length === 0) {
    logger.warn('No Client IDs found in context. Skipping DietPlan seeding.');
    context.dietPlanIds = [];
    return context;
  }

  const dietPlansToInsert = [];
  const dietPlanIds = [];

  // For each client, generate diet plans
  for (const clientId of clientIds) {
    for (let i = 0; i < dietPlansPerClient; i++) {
      const dietPlanId = new mongoose.Types.ObjectId();
      dietPlanIds.push(dietPlanId);
      dietPlansToInsert.push({
        _id: dietPlanId,
        client: clientId,
        // Future fields: coach, beginner, intermediate, advanced, weightLoss, approved, fileUrl
      });
    }
  }

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${dietPlansToInsert.length} DietPlan(s) with bulk insert.`);
  } else {
    // Phase 2: Implement Mongoose DietPlan.insertMany(dietPlansToInsert)
    logger.success(`Seeded ${dietPlansToInsert.length} DietPlan(s) (Framework Skeleton)`);
  }

  context.dietPlanIds = dietPlanIds;
  return context;
}

export default seedDietPlans;
