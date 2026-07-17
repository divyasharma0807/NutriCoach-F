/**
 * Result Seeding Module - Phase 3A
 * Responsibility: Generates and bulk inserts client success results consistent with journeys.
 */

import mongoose from 'mongoose';
import logger from './helpers/logger.js';
import Result from '../../models/Result.js';
import { ensureClientProfiles } from './helpers/progression.js';

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

  // Ensure profiles are initialized
  const clientProfiles = ensureClientProfiles(context, config);

  const resultsToInsert = [];
  const resultIds = [];

  for (const clientId of clientIds) {
    const clientRecord = (context.clientsToInsert || []).find((c) => c._id.equals(clientId));
    if (!clientRecord) continue;

    const data = clientProfiles[clientId.toString()];
    if (!data) continue;

    const { profile, timeline } = data;
    const coachId = clientRecord.coach;
    const clientName = clientRecord.name;

    for (let i = 0; i < resultsPerClient; i++) {
      const resultId = new mongoose.Types.ObjectId();
      resultIds.push(resultId);

      // Determine starting/ending weights for progress description
      const startWeight = timeline[0]?.bodyWeight || profile.initialWeight;
      const endWeight = timeline[timeline.length - 1]?.bodyWeight || profile.initialWeight;
      const diff = (endWeight - startWeight).toFixed(1);
      
      let description = '';
      if (profile.journey === 'Weight Loss') {
        description = `${clientName} has achieved an outstanding weight reduction of ${Math.abs(diff)} kg (from ${startWeight} kg down to ${endWeight} kg) over ${timeline.length} weeks of customized nutrition coaching.`;
      } else if (profile.journey === 'Muscle Gain') {
        description = `${clientName} successfully gained ${diff} kg of lean mass (moving from ${startWeight} kg to ${endWeight} kg), exhibiting substantial strength improvements under the coach's program.`;
      } else if (profile.journey === 'Body Recomposition') {
        description = `${clientName} underwent body recomposition, keeping weight stable near ${startWeight} kg while lowering body fat % and gaining structural muscle density.`;
      } else {
        description = `${clientName} maintained a stable body profile near ${startWeight} kg, mastering sustainable nutrition habits and active lifestyle metrics.`;
      }

      // Span date historically
      const dateVal = timeline[Math.min(timeline.length - 1, i)]?.date || new Date().toISOString().split('T')[0];

      resultsToInsert.push({
        _id: resultId,
        coach: coachId,
        clientName: clientName,
        description: description,
        image: {
          secure_url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
          public_id: 'cloudinary_sample_placeholder'
        },
        createdAt: new Date(dateVal),
        updatedAt: new Date(dateVal)
      });
    }
  }

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${resultsToInsert.length} Result(s) with bulk insert.`);
  } else {
    try {
      const result = await Result.insertMany(resultsToInsert);
      logger.success(`Created ${result.length} Result(s)`);
    } catch (err) {
      logger.error('Failed to bulk insert Results', err);
      throw err;
    }
  }

  context.resultIds = resultIds;
  context.resultsToInsert = resultsToInsert;

  return context;
}

export default seedResults;
