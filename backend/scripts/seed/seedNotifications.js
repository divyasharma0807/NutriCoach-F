/**
 * Notification Seeding Module
 * Responsibility: Simulates/coordinates bulk seeding of system notifications.
 */

import mongoose from 'mongoose';
import logger from './helpers/logger.js';

/**
 * Seeds Notification records based on the configuration preset.
 * @param {object} config - Seeding configuration preset.
 * @param {object} context - Shared ID tracking context.
 * @param {object} options - Execution options (e.g. dryRun).
 * @returns {Promise<object>} Updated context.
 */
export async function seedNotifications(config, context, options = {}) {
  const notificationsPerCoach = config.notificationsPerCoach || 0;
  const coachIds = context.coachIds || [];

  logger.info(`Starting Notification seeding: notificationsPerCoach=${notificationsPerCoach}, totalCoaches=${coachIds.length}`);

  if (coachIds.length === 0) {
    logger.warn('No Coach IDs found in context. Skipping Notification seeding.');
    context.notificationIds = [];
    return context;
  }

  const notificationsToInsert = [];
  const notificationIds = [];

  for (const coachId of coachIds) {
    for (let i = 0; i < notificationsPerCoach; i++) {
      const notificationId = new mongoose.Types.ObjectId();
      notificationIds.push(notificationId);
      notificationsToInsert.push({
        _id: notificationId,
        recipientType: 'coach',
        recipientId: coachId,
        // Future fields: text, read, type, message, senderId, senderRole
      });
    }
  }

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${notificationsToInsert.length} Notification(s) with bulk insert.`);
  } else {
    // Phase 2: Implement Mongoose Notification.insertMany(notificationsToInsert)
    logger.success(`Seeded ${notificationsToInsert.length} Notification(s) (Framework Skeleton)`);
  }

  context.notificationIds = notificationIds;
  return context;
}

export default seedNotifications;
