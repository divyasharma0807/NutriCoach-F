/**
 * Measurement Seeding Module
 * Responsibility: Simulates/coordinates bulk seeding of client body measurements history.
 */

import mongoose from 'mongoose';
import logger from './helpers/logger.js';

/**
 * Seeds MeasurementHistory records based on the configuration preset.
 * @param {object} config - Seeding configuration preset.
 * @param {object} context - Shared ID tracking context.
 * @param {object} options - Execution options (e.g. dryRun).
 * @returns {Promise<object>} Updated context.
 */
export async function seedMeasurements(config, context, options = {}) {
  const measurementsPerClient = config.measurementsPerClient || 0;
  const clientIds = context.clientIds || [];

  logger.info(`Starting Measurement seeding: measurementsPerClient=${measurementsPerClient}, totalClients=${clientIds.length}`);

  if (clientIds.length === 0) {
    logger.warn('No Client IDs found in context. Skipping Measurement seeding.');
    context.measurementIds = [];
    return context;
  }

  const measurementsToInsert = [];
  const measurementIds = [];

  for (const clientId of clientIds) {
    for (let i = 0; i < measurementsPerClient; i++) {
      const measurementId = new mongoose.Types.ObjectId();
      measurementIds.push(measurementId);
      measurementsToInsert.push({
        _id: measurementId,
        client: clientId,
        isProfileBaseline: i === 0, // First measurement is the baseline
        // Future fields: date, belly, waist, thigh, chest, arm
      });
    }
  }

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${measurementsToInsert.length} MeasurementHistory record(s) with bulk insert.`);
  } else {
    // Phase 2: Implement Mongoose MeasurementHistory.insertMany(measurementsToInsert)
    logger.success(`Seeded ${measurementsToInsert.length} MeasurementHistory record(s) (Framework Skeleton)`);
  }

  context.measurementIds = measurementIds;
  return context;
}

export default seedMeasurements;
