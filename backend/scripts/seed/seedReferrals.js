/**
 * Referral Seeding Module - Inactive Stub for Phase 2
 */

import logger from './helpers/logger.js';

export async function seedReferrals(config, context, options = {}) {
  logger.info('Referral seeding skipped (Inactive stub for Phase 2).');
  context.referralIds = [];
  return context;
}

export default seedReferrals;
