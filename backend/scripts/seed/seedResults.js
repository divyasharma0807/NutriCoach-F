/**
 * Result Seeding Module
 * Responsibility: Simulates/coordinates bulk seeding of client success results.
 */

import mongoose from 'mongoose';
import logger from './helpers/logger.js';

/**
 * Seeds Client Result records based on the configuration preset.
 * @param {object} config - Seeding configuration preset.
 * @param {object} context - Shared ID tracking context.
 * @param {object} options - Execution options (e.g. dryRun).
 * @returns {Promise<object>} Updated context.
 */
export async function seedResults(config, context, options = {}) {
  const resultsPerClient = config.resultsPerClient || 0;
  const clientIds = context.clientIds || [];

  logger.info(`Starting Result seeding: resultsPerClient=${resultsPerClient}, totalClients=${clientIds.length}`);

  if (clientIds.length === 0) {
    logger.warn('No Client IDs found in context. Skipping Result seeding.');
    context.resultIds = [];
    return context;
  }

  const resultsToInsert = [];
  const resultIds = [];

  // Generate results to link to coach with client reference names
  const totalCount = clientIds.length * resultsPerClient;
  for (let i = 0; i < totalCount; i++) {
    const resultId = new mongoose.Types.ObjectId();
    resultIds.push(resultId);
    resultsToInsert.push({
      _id: resultId,
      // Future fields: coach, clientName, description, image
    });
  }

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${resultsToInsert.length} Result(s) with bulk insert.`);
  } else {
    // Phase 2: Implement Mongoose Result.insertMany(resultsToInsert)
    logger.success(`Seeded ${resultsToInsert.length} Result(s) (Framework Skeleton)`);
  }

  context.resultIds = resultIds;
  return context;
}

export default seedResults;
