/**
 * Database Clear Utility
 * Responsibility: Safely deletes all documents from registered application collections.
 * Safeguard: Will throw an error and exit if process.env.NODE_ENV is set to 'production'.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './helpers/logger.js';
import connectDB from '../../config/db.js';

// Import all models to ensure registration
import Admin from '../../models/Admin.js';
import Coach from '../../models/Coach.js';
import Client from '../../models/Client.js';
import Result from '../../models/Result.js';
import Notification from '../../models/Notification.js';
import Session from '../../models/Session.js';
import DietPlan from '../../models/DietPlan.js';
import Prospect from '../../models/Prospect.js';
import Referral from '../../models/Referral.js';
import MeasurementHistory from '../../models/MeasurementHistory.js';
import BodyParameterHistory from '../../models/BodyParameterHistory.js';

const MODELS = [
  { name: 'Admin', model: Admin },
  { name: 'Coach', model: Coach },
  { name: 'Client', model: Client },
  { name: 'Result', model: Result },
  { name: 'Notification', model: Notification },
  { name: 'Session', model: Session },
  { name: 'DietPlan', model: DietPlan },
  { name: 'Prospect', model: Prospect },
  { name: 'Referral', model: Referral },
  { name: 'MeasurementHistory', model: MeasurementHistory },
  { name: 'BodyParameterHistory', model: BodyParameterHistory }
];

/**
 * Iterates through application models and removes all documents.
 * @param {object} options - Options containing dryRun flag.
 * @returns {Promise<void>}
 */
export async function clearDatabase(options = {}) {
  const isDry = !!options.dryRun;

  // Strict production environment safeguard
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database clearing is BLOCKED in production mode!');
  }

  logger.info(`Starting database clear sequence (Dry Run: ${isDry})...`);

  for (const { name, model } of MODELS) {
    if (isDry) {
      logger.success(`[DRY RUN] Would clear documents from collection: ${name}s`);
    } else {
      try {
        const result = await model.deleteMany({});
        logger.success(`Cleared ${name}s collection: deleted ${result.deletedCount || 0} documents.`);
      } catch (err) {
        logger.error(`Error clearing collection ${name}s`, err);
        throw err;
      }
    }
  }

  logger.success('Database clear sequence completed successfully.');
}

// Self-executing harness for direct command execution (npm run clear)
const run = async () => {
  dotenv.config();
  const dryRun = process.argv.includes('--dry') || process.argv.includes('-d');

  if (process.env.NODE_ENV === 'production') {
    logger.error('CRITICAL: Cannot execute database clear script in production environment!');
    process.exit(1);
  }

  try {
    if (!dryRun) {
      await connectDB();
    } else {
      logger.info('[DRY RUN] Skipping MongoDB connection.');
    }

    await clearDatabase({ dryRun });

    if (!dryRun) {
      await mongoose.connection.close();
      logger.success('Disconnected from MongoDB.');
    }
  } catch (error) {
    logger.error('Execution failed:', error);
    process.exit(1);
  }
};

const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('clearDatabase.js') ||
  process.argv[1].endsWith('clearDatabase')
);

if (isDirectRun) {
  run();
}
