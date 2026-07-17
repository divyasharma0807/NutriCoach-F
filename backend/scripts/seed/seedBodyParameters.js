/**
 * BodyParameter History Seeding Module
 * Responsibility: Simulates/coordinates bulk seeding of client body parameter entries.
 */

import mongoose from 'mongoose';
import logger from './helpers/logger.js';

/**
 * Seeds BodyParameterHistory records based on the configuration preset.
 * @param {object} config - Seeding configuration preset.
 * @param {object} context - Shared ID tracking context.
 * @param {object} options - Execution options (e.g. dryRun).
 * @returns {Promise<object>} Updated context.
 */
export async function seedBodyParameters(config, context, options = {}) {
  const entriesPerClient = config.bodyParameterEntriesPerClient || 0;
  const clientIds = context.clientIds || [];

  logger.info(`Starting BodyParameter seeding: entriesPerClient=${entriesPerClient}, totalClients=${clientIds.length}`);

  if (clientIds.length === 0) {
    logger.warn('No Client IDs found in context. Skipping BodyParameter seeding.');
    context.bodyParameterIds = [];
    return context;
  }

  const parametersToInsert = [];
  const parameterIds = [];

  for (const clientId of clientIds) {
    for (let i = 0; i < entriesPerClient; i++) {
      const parameterId = new mongoose.Types.ObjectId();
      parameterIds.push(parameterId);
      parametersToInsert.push({
        _id: parameterId,
        client: clientId,
        isProfileBaseline: i === 0, // First entry is the baseline
        // Future fields: date, bodyWeight, bmi, bodyFatRatio, muscleRate, bmr, etc.
      });
    }
  }

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${parametersToInsert.length} BodyParameterHistory record(s) with bulk insert.`);
  } else {
    // Phase 2: Implement Mongoose BodyParameterHistory.insertMany(parametersToInsert)
    logger.success(`Seeded ${parametersToInsert.length} BodyParameterHistory record(s) (Framework Skeleton)`);
  }

  context.bodyParameterIds = parameterIds;
  return context;
}

export default seedBodyParameters;
