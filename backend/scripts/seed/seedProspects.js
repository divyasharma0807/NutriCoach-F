/**
 * Prospect Seeding Module - Inactive Stub for Phase 2
 */

import logger from './helpers/logger.js';

export async function seedProspects(config, context, options = {}) {
  logger.info('Prospect seeding skipped (Inactive stub for Phase 2).');
  context.prospectIds = [];
  return context;
}

export default seedProspects;
