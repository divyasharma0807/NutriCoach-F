/**
 * Referral Seeding Module
 * Responsibility: Simulates/coordinates bulk seeding of referrals.
 */

import mongoose from 'mongoose';
import logger from './helpers/logger.js';

/**
 * Seeds Referral records based on the configuration preset.
 * @param {object} config - Seeding configuration preset.
 * @param {object} context - Shared ID tracking context.
 * @param {object} options - Execution options (e.g. dryRun).
 * @returns {Promise<object>} Updated context.
 */
export async function seedReferrals(config, context, options = {}) {
  const count = config.referrals || 0;
  const clientIds = context.clientIds || [];

  logger.info(`Starting Referral seeding: target count is ${count}`);

  if (clientIds.length === 0 && count > 0) {
    logger.warn('No Client IDs found in context. Skipping Referral seeding.');
    context.referralIds = [];
    return context;
  }

  const referralsToInsert = [];
  const referralIds = [];

  for (let i = 0; i < count; i++) {
    const referralId = new mongoose.Types.ObjectId();
    referralIds.push(referralId);

    // Link referral to a client from context
    const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];

    referralsToInsert.push({
      _id: referralId,
      client: clientId,
      // Future fields: name, email, phone, city, age, gender, weightRange, interest
    });
  }

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${referralsToInsert.length} Referral(s) with bulk insert.`);
  } else {
    // Phase 2: Implement Mongoose Referral.insertMany(referralsToInsert)
    logger.success(`Seeded ${referralsToInsert.length} Referral(s) (Framework Skeleton)`);
  }

  context.referralIds = referralIds;
  return context;
}

export default seedReferrals;
