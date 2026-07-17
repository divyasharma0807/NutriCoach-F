/**
 * Client Seeding Module
 * Responsibility: Simulates/coordinates bulk seeding of Clients associated with Coaches.
 * Focuses on client-coach link: Client.coach.
 */

import mongoose from 'mongoose';
import logger from './helpers/logger.js';

/**
 * Seeds Client accounts based on the preset configuration.
 * Distributes clients across the coach IDs in the shared context.
 * @param {object} config - Seeding configuration preset.
 * @param {object} context - Shared ID tracking context.
 * @param {object} options - Execution options (e.g. dryRun).
 * @returns {Promise<object>} Updated context.
 */
export async function seedClients(config, context, options = {}) {
  const clientsPerCoach = config.clientsPerCoach || 0;
  const coachIds = context.coachIds || [];

  logger.info(`Starting Client seeding: clientsPerCoach=${clientsPerCoach}, totalCoaches=${coachIds.length}`);

  if (coachIds.length === 0) {
    logger.warn('No Coach IDs found in context. Skipping Client seeding.');
    context.clientIds = [];
    return context;
  }

  const clientsToInsert = [];
  const clientIds = [];

  for (const coachId of coachIds) {
    for (let i = 0; i < clientsPerCoach; i++) {
      const clientId = new mongoose.Types.ObjectId();
      clientIds.push(clientId);
      clientsToInsert.push({
        _id: clientId,
        coach: coachId, // exact hierarchy field name
        role: 'client',
        // Other fields will be generated in Phase 2
      });
    }
  }

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${clientsToInsert.length} Client(s) with bulk insert.`);
  } else {
    // Phase 2: Implement Mongoose Client.insertMany(clientsToInsert)
    logger.success(`Seeded ${clientsToInsert.length} Client(s) (Framework Skeleton)`);
  }

  context.clientIds = clientIds;
  return context;
}

export default seedClients;
