/**
 * BodyParameter History Seeding Module - Phase 3A
 * Responsibility: Generates and bulk inserts client body composition parameters (weight, fat %, muscle, BMR, visceral fat).
 */

import mongoose from 'mongoose';
import logger from './helpers/logger.js';
import BodyParameterHistory from '../../models/BodyParameterHistory.js';
import { ensureClientProfiles } from './helpers/progression.js';

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

  // Retrieve client timelines from shared context
  const clientProfiles = ensureClientProfiles(context, config);

  const parametersToInsert = [];
  const parameterIds = [];

  for (const clientId of clientIds) {
    const data = clientProfiles[clientId.toString()];
    if (!data) continue;

    const { timeline } = data;

    // Constrain counts by bodyParameterEntriesPerClient preset
    const limit = Math.min(timeline.length, entriesPerClient);
    for (let i = 0; i < limit; i++) {
      const entry = timeline[i];
      const parameterId = new mongoose.Types.ObjectId();
      parameterIds.push(parameterId);

      parametersToInsert.push({
        _id: parameterId,
        client: new mongoose.Types.ObjectId(clientId),
        date: entry.date,
        isProfileBaseline: entry.isProfileBaseline,
        bodyWeight: entry.bodyWeight,
        bmi: entry.bmi,
        bodyFatRatio: entry.bodyFatRatio,
        muscleRate: entry.muscleRate,
        bodyWater: entry.bodyWater,
        boneMass: entry.boneMass,
        bmr: entry.bmr,
        metabolicAge: entry.metabolicAge,
        visceralFat: entry.visceralFat,
        subcutaneousFat: entry.subcutaneousFat,
        proteinMass: entry.proteinMass,
        muscleMass: entry.muscleMass,
        weightWithoutFat: entry.weightWithoutFat
      });
    }
  }

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${parametersToInsert.length} BodyParameterHistory record(s) with bulk insert.`);
  } else {
    try {
      const result = await BodyParameterHistory.insertMany(parametersToInsert);
      logger.success(`Created ${result.length} BodyParameterHistory record(s)`);
    } catch (err) {
      logger.error('Failed to bulk insert BodyParameterHistory', err);
      throw err;
    }
  }

  context.bodyParameterIds = parameterIds;
  context.bodyParametersToInsert = parametersToInsert;

  return context;
}

export default seedBodyParameters;
