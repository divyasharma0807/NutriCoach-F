/**
 * DietPlan Seeding Module - Inactive Stub for Phase 2
 */

import logger from './helpers/logger.js';

export async function seedDietPlans(config, context, options = {}) {
  logger.info('DietPlan seeding skipped (Inactive stub for Phase 2).');
  context.dietPlanIds = [];
  return context;
}

export default seedDietPlans;
