/**
 * Notification Seeding Module - Inactive Stub for Phase 2
 */

import logger from './helpers/logger.js';

export async function seedNotifications(config, context, options = {}) {
  logger.info('Notification seeding skipped (Inactive stub for Phase 2).');
  context.notificationIds = [];
  return context;
}

export default seedNotifications;
