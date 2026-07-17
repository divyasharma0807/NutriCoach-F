/**
 * Session Seeding Module
 * Responsibility: Simulates/coordinates bulk seeding of calendar/meeting sessions.
 */

import mongoose from 'mongoose';
import logger from './helpers/logger.js';

/**
 * Seeds Session records based on the configuration preset.
 * @param {object} config - Seeding configuration preset.
 * @param {object} context - Shared ID tracking context.
 * @param {object} options - Execution options (e.g. dryRun).
 * @returns {Promise<object>} Updated context.
 */
export async function seedSessions(config, context, options = {}) {
  const sessionsPerCoach = config.sessionsPerCoach || 0;
  const coachIds = context.coachIds || [];
  const clientIds = context.clientIds || [];

  logger.info(`Starting Session seeding: sessionsPerCoach=${sessionsPerCoach}, totalCoaches=${coachIds.length}`);

  if (coachIds.length === 0) {
    logger.warn('No Coach IDs found in context. Skipping Session seeding.');
    context.sessionIds = [];
    return context;
  }

  const sessionsToInsert = [];
  const sessionIds = [];

  for (const coachId of coachIds) {
    for (let i = 0; i < sessionsPerCoach; i++) {
      const sessionId = new mongoose.Types.ObjectId();
      sessionIds.push(sessionId);

      // Link to a random client from the context if any exists
      const clientId = clientIds.length > 0 ? clientIds[Math.floor(Math.random() * clientIds.length)] : null;

      sessionsToInsert.push({
        _id: sessionId,
        coachId,
        clientId,
        organizerId: coachId,
        organizerRole: 'coach',
        status: 'APPROVED',
        // Future fields: date, time, title
      });
    }
  }

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${sessionsToInsert.length} Session(s) with bulk insert.`);
  } else {
    // Phase 2: Implement Mongoose Session.insertMany(sessionsToInsert)
    logger.success(`Seeded ${sessionsToInsert.length} Session(s) (Framework Skeleton)`);
  }

  context.sessionIds = sessionIds;
  return context;
}

export default seedSessions;
