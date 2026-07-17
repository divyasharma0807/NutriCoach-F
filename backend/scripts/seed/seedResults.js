/**
 * Result Seeding Module - Inactive Stub for Phase 2
 */

import logger from './helpers/logger.js';

export async function seedResults(config, context, options = {}) {
  logger.info('Result seeding skipped (Inactive stub for Phase 2).');
  context.resultIds = [];
  return context;
}

export default seedResults;
