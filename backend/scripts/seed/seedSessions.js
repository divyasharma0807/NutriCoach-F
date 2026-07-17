/**
 * Session Seeding Module - Inactive Stub for Phase 2
 */

import logger from './helpers/logger.js';

export async function seedSessions(config, context, options = {}) {
  logger.info('Session seeding skipped (Inactive stub for Phase 2).');
  context.sessionIds = [];
  return context;
}

export default seedSessions;
