/**
 * Measurement Seeding Module - Phase 3A
 * Responsibility: Generates and bulk inserts client body size history records.
 */

import mongoose from 'mongoose';
import logger from './helpers/logger.js';
import MeasurementHistory from '../../models/MeasurementHistory.js';
import { ensureClientProfiles } from './helpers/progression.js';

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

  // Retrieve client timelines from shared context
  const clientProfiles = ensureClientProfiles(context, config);

  const measurementsToInsert = [];
  const measurementIds = [];

  for (const clientId of clientIds) {
    const data = clientProfiles[clientId.toString()];
    if (!data) continue;

    const { timeline } = data;

    for (let i = 0; i < timeline.length; i++) {
      const entry = timeline[i];
      const measurementId = new mongoose.Types.ObjectId();
      measurementIds.push(measurementId);

      measurementsToInsert.push({
        _id: measurementId,
        client: new mongoose.Types.ObjectId(clientId),
        date: entry.date,
        isProfileBaseline: entry.isProfileBaseline,
        belly: entry.belly,
        waist: entry.waist,
        thigh: entry.thigh,
        chest: entry.chest,
        arm: entry.arm
      });
    }
  }

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${measurementsToInsert.length} MeasurementHistory record(s) with bulk insert.`);
  } else {
    try {
      const result = await MeasurementHistory.insertMany(measurementsToInsert);
      logger.success(`Created ${result.length} MeasurementHistory record(s)`);
    } catch (err) {
      logger.error('Failed to bulk insert MeasurementHistory', err);
      throw err;
    }
  }

  context.measurementIds = measurementIds;
  context.measurementsToInsert = measurementsToInsert;

  return context;
}

export default seedMeasurements;
