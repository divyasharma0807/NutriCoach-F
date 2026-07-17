/**
 * BodyParameter History Seeding Module - Inactive Stub for Phase 2
 */

import logger from './helpers/logger.js';

export async function seedBodyParameters(config, context, options = {}) {
  logger.info('BodyParameter seeding skipped (Inactive stub for Phase 2).');
  context.bodyParameterIds = [];
  return context;
}

export default seedBodyParameters;
