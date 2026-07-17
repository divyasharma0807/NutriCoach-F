/**
 * Master Seeding Driver
 * Responsibility: Connects to MongoDB, manages the transaction-less pipeline flow,
 * parses CLI options, and executes seeders in sequential order.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './helpers/logger.js';
import connectDB from '../../config/db.js';
import config from './config.js';

// Import clear utility
import { clearDatabase } from './clearDatabase.js';

// Import individual seed generators
import { seedAdmins } from './seedAdmin.js';
import { seedCoaches } from './seedCoaches.js';
import { seedClients } from './seedClients.js';
import { seedResults } from './seedResults.js';
import { seedNotifications } from './seedNotifications.js';
import { seedSessions } from './seedSessions.js';
import { seedDietPlans } from './seedDietPlans.js';
import { seedMeasurements } from './seedMeasurements.js';
import { seedBodyParameters } from './seedBodyParameters.js';
import { seedProspects } from './seedProspects.js';
import { seedReferrals } from './seedReferrals.js';

async function runSeeder() {
  // Load configuration options
  dotenv.config();

  // Detect dry-run flag
  const dryRun = process.argv.includes('--dry') || process.argv.includes('-d');

  // Hard environment check for safety
  if (process.env.NODE_ENV === 'production') {
    logger.error('CRITICAL ERROR: Seeding script execution is BLOCKED in production mode!');
    process.exit(1);
  }

  logger.divider();
  logger.info('DATABASE SEED ENGINE INITIATED');
  logger.info(`Active Config Preset: ${config.name}`);
  logger.info(`Dry Run Execution: ${dryRun}`);
  logger.divider();

  try {
    if (!dryRun) {
      await connectDB();
      logger.success('Connected to MongoDB.');
    } else {
      logger.info('[DRY RUN] Skipping MongoDB database connection.');
    }

    // Step 1: Execute database cleanup sequence
    await clearDatabase({ dryRun });
    logger.divider();

    // Step 2: Setup memory context for sharing ObjectIds between modules
    const context = {
      adminIds: [],
      coachIds: [],
      clientIds: [],
      resultIds: [],
      notificationIds: [],
      sessionIds: [],
      dietPlanIds: [],
      measurementIds: [],
      bodyParameterIds: [],
      prospectIds: [],
      referralIds: []
    };

    const options = { dryRun };

    // Step 3: Run generators sequentially
    logger.info('Executing seeding pipeline generators...');
    
    await seedAdmins(config, context, options);
    await seedCoaches(config, context, options);
    await seedClients(config, context, options);
    await seedResults(config, context, options);
    await seedNotifications(config, context, options);
    await seedSessions(config, context, options);
    await seedDietPlans(config, context, options);
    await seedMeasurements(config, context, options);
    await seedBodyParameters(config, context, options);
    await seedProspects(config, context, options);
    await seedReferrals(config, context, options);

    logger.divider();
    if (!dryRun) {
      await mongoose.connection.close();
      logger.success('Disconnected from MongoDB.');
    }

    logger.success('DATABASE SEED PIPELINE COMPLETED SUCCESSFULLY');
    logger.divider();
  } catch (error) {
    logger.divider();
    logger.error('FATAL: Database seeding pipeline encountered a critical error:', error);
    
    if (!dryRun && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info('Disconnected from MongoDB after error.');
    }
    process.exit(1);
  }
}

runSeeder();
