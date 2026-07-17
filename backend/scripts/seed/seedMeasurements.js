/**
 * Measurement Seeding Module - Inactive Stub for Phase 2
 */

import logger from './helpers/logger.js';

export async function seedMeasurements(config, context, options = {}) {
  logger.info('Measurement seeding skipped (Inactive stub for Phase 2).');
  context.measurementIds = [];
  return context;
}

export default seedMeasurements;
