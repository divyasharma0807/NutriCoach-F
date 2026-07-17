/**
 * Prospect Seeding Module
 * Responsibility: Simulates/coordinates bulk seeding of prospects.
 */

import mongoose from 'mongoose';
import logger from './helpers/logger.js';

/**
 * Seeds Prospect records based on the configuration preset.
 * @param {object} config - Seeding configuration preset.
 * @param {object} context - Shared ID tracking context.
 * @param {object} options - Execution options (e.g. dryRun).
 * @returns {Promise<object>} Updated context.
 */
export async function seedProspects(config, context, options = {}) {
  const count = config.prospects || 0;
  const coachIds = context.coachIds || [];

  logger.info(`Starting Prospect seeding: target count is ${count}`);

  const prospectsToInsert = [];
  const prospectIds = [];

  for (let i = 0; i < count; i++) {
    const prospectId = new mongoose.Types.ObjectId();
    prospectIds.push(prospectId);

    // Assign to a random coach if available
    const coachId = coachIds.length > 0 ? coachIds[Math.floor(Math.random() * coachIds.length)] : null;

    prospectsToInsert.push({
      _id: prospectId,
      addedByCoach: coachId,
      // Future fields: name, email, phone, city, age, gender, weightRange
    });
  }

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${prospectsToInsert.length} Prospect(s) with bulk insert.`);
  } else {
    // Phase 2: Implement Mongoose Prospect.insertMany(prospectsToInsert)
    logger.success(`Seeded ${prospectsToInsert.length} Prospect(s) (Framework Skeleton)`);
  }

  context.prospectIds = prospectIds;
  return context;
}

export default seedProspects;
