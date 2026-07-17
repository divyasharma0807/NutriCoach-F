/**
 * Master Seeding Driver - Phase 2
 * Responsibility: Connects to MongoDB, manages the database seeding timeline,
 * executes validators (uniqueness, circular, depth, orphans), compiles output reports,
 * and saves login credentials & manifest logs.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

// Import model registrations for validation query fetches
import Admin from '../../models/Admin.js';
import Coach from '../../models/Coach.js';
import Client from '../../models/Client.js';

// Import cache reset helper
import { resetUniqueCaches } from './helpers/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeeder() {
  const startTime = Date.now();
  dotenv.config();

  // Reset unique email and phone trackers
  resetUniqueCaches();

  // Detect dry-run flag
  const dryRun = process.argv.includes('--dry') || process.argv.includes('-d');

  // Hard environment check for safety
  if (process.env.NODE_ENV === 'production') {
    logger.error('CRITICAL ERROR: Seeding script execution is BLOCKED in production mode!');
    process.exit(1);
  }

  logger.divider();
  logger.info('DATABASE SEED ENGINE INITIATED (PHASE 2)');
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

    // Step 2: Setup memory context for sharing ObjectIds and data between modules
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
      referralIds: [],
      admins: [],
      coaches: [],
      clients: [],
      adminsToInsert: [],
      coachesToInsert: [],
      clientsToInsert: []
    };

    const options = { dryRun };

    // Step 3: Run generators sequentially (Admins, Coaches, Clients)
    logger.info('Executing seeding pipeline generators...');
    
    await seedAdmins(config, context, options);
    await seedCoaches(config, context, options);
    await seedClients(config, context, options);

    // Call remaining stubs (these return unchanged context for Phase 2)
    await seedResults(config, context, options);
    await seedNotifications(config, context, options);
    await seedSessions(config, context, options);
    await seedDietPlans(config, context, options);
    await seedMeasurements(config, context, options);
    await seedBodyParameters(config, context, options);
    await seedProspects(config, context, options);
    await seedReferrals(config, context, options);

    logger.divider();

    // Step 4: Run Extended Validations
    logger.info('Initiating database integrity and hierarchy validations...');
    
    let dbAdmins = [];
    let dbCoaches = [];
    let dbClients = [];

    if (dryRun) {
      dbAdmins = context.adminsToInsert || [];
      dbCoaches = context.coachesToInsert || [];
      dbClients = context.clientsToInsert || [];
    } else {
      logger.info('Fetching newly inserted documents from MongoDB for verification...');
      dbAdmins = await Admin.find({}).lean();
      dbCoaches = await Coach.find({}).lean();
      dbClients = await Client.find({}).lean();
    }

    // 4.1 Phone number uniqueness validation
    const phoneSet = new Set();
    for (const u of [...dbAdmins, ...dbCoaches, ...dbClients]) {
      if (phoneSet.has(u.phone)) {
        throw new Error(`Validation Error: Duplicate phone number detected: "${u.phone}" (User name: "${u.name}")`);
      }
      phoneSet.add(u.phone);
    }
    logger.success('Validation Check Passed: All phone numbers are globally unique.');

    // 4.2 Email uniqueness validation
    const emailSet = new Set();
    for (const u of [...dbAdmins, ...dbCoaches, ...dbClients]) {
      if (emailSet.has(u.email)) {
        throw new Error(`Validation Error: Duplicate email address detected: "${u.email}" (User name: "${u.name}")`);
      }
      emailSet.add(u.email);
    }
    logger.success('Validation Check Passed: All email addresses are globally unique.');

    // 4.3 Client-Coach reference validation (no orphans)
    const coachIdsSet = new Set(dbCoaches.map((c) => c._id.toString()));
    for (const client of dbClients) {
      if (!client.coach) {
        throw new Error(`Validation Error: Client "${client.name}" (${client._id}) has no assigned coach (orphan client).`);
      }
      if (!coachIdsSet.has(client.coach.toString())) {
        throw new Error(`Validation Error: Client "${client.name}" references non-existent coach ID: "${client.coach}"`);
      }
    }
    logger.success('Validation Check Passed: Every Client references a valid Coach ID (no client orphans).');

    // 4.4 Coach-SeniorCoach references (level matches and no orphans)
    for (const coach of dbCoaches) {
      if (coach.level === 'Senior Coach') {
        if (coach.seniorCoach !== null && coach.seniorCoach !== undefined) {
          throw new Error(`Validation Error: Root Coach "${coach.name}" (${coach._id}) has seniorCoach set (must be null).`);
        }
      } else {
        if (!coach.seniorCoach) {
          throw new Error(`Validation Error: Child Coach "${coach.name}" (${coach._id}) has no seniorCoach reference (orphan coach).`);
        }
        if (!coachIdsSet.has(coach.seniorCoach.toString())) {
          throw new Error(`Validation Error: Child Coach "${coach.name}" references non-existent senior coach ID: "${coach.seniorCoach}"`);
        }
      }
    }
    logger.success('Validation Check Passed: Coach level relationships and references are set correctly.');

    // 4.5 Circular hierarchy check and Depth check
    const coachMap = new Map(dbCoaches.map((c) => [c._id.toString(), c]));
    let maxDepth = 0;

    for (const coach of dbCoaches) {
      const visited = new Set();
      let currentDepth = 0;
      let current = coach;

      while (current && current.seniorCoach) {
        const currentId = current._id.toString();
        if (visited.has(currentId)) {
          throw new Error(`Validation Error: Circular Coach hierarchy loop detected at Coach: "${current.name}" (${currentId})`);
        }
        visited.add(currentId);
        currentDepth++;
        current = coachMap.get(current.seniorCoach.toString());
      }

      if (currentDepth > maxDepth) {
        maxDepth = currentDepth;
      }
    }
    logger.success(`Validation Check Passed: Circularity check succeeded. No infinite loops detected.`);

    // 4.6 Depth constraint validation
    if (maxDepth > config.hierarchyDepth) {
      throw new Error(`Validation Error: Seeding resulted in a tree depth of ${maxDepth}, which exceeds the configured preset limit of ${config.hierarchyDepth}.`);
    }
    logger.success(`Validation Check Passed: Seeding tree depth is ${maxDepth} (Config limit: ${config.hierarchyDepth}).`);

    logger.success('Hierarchy Validation Passed');
    logger.divider();

    // Step 5: Export CSV Credentials & JSON Manifest
    logger.info('Writing seed execution credentials and manifest outputs...');
    
    // Create output directory if not exists
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 5.1 Export credentials.csv
    const allCredentials = [
      ...(context.admins || []),
      ...(context.coaches || []),
      ...(context.clients || [])
    ];

    const csvLines = ['Role,Name,Phone,Email,Password'];
    for (const user of allCredentials) {
      csvLines.push(`${user.Role},"${user.Name}",${user.Phone},${user.Email},${user.Password}`);
    }

    fs.writeFileSync(path.join(outputDir, 'credentials.csv'), csvLines.join('\n'));
    logger.success('Created credentials.csv in scripts/seed/output/');

    // 5.2 Export seed-manifest.json
    const endTime = Date.now();
    const executionDurationSec = ((endTime - startTime) / 1000).toFixed(2);

    // Compute average counts
    const rootCoachesCount = dbCoaches.filter((c) => !c.seniorCoach).length;
    const avgClientsPerCoach = dbCoaches.length > 0 ? (dbClients.length / dbCoaches.length).toFixed(1) : '0';

    // Compute average children per parent coach
    const parentCounts = new Map();
    for (const c of dbCoaches) {
      if (c.seniorCoach) {
        const pid = c.seniorCoach.toString();
        parentCounts.set(pid, (parentCounts.get(pid) || 0) + 1);
      }
    }
    const parentCount = parentCounts.size;
    const totalChildren = Array.from(parentCounts.values()).reduce((sum, v) => sum + v, 0);
    const avgChildCoaches = parentCount > 0 ? (totalChildren / parentCount).toFixed(1) : '0';

    const manifestData = {
      selectedPreset: config.name,
      generatedTimestamp: new Date().toISOString(),
      numberOfAdmins: dbAdmins.length,
      numberOfRootCoaches: rootCoachesCount,
      totalCoaches: dbCoaches.length,
      totalClients: dbClients.length,
      maximumHierarchyDepth: maxDepth,
      averageChildCoaches: parseFloat(avgChildCoaches),
      averageClientsPerCoach: parseFloat(avgClientsPerCoach),
      executionTime: `${executionDurationSec}s`,
      validationStatus: 'Passed',
      databaseName: dryRun ? 'N/A (Dry Run)' : (mongoose.connection.db ? mongoose.connection.db.databaseName : 'Unknown'),
      environment: process.env.NODE_ENV || 'development'
    };

    fs.writeFileSync(
      path.join(outputDir, 'seed-manifest.json'),
      JSON.stringify(manifestData, null, 2)
    );
    logger.success('Created seed-manifest.json in scripts/seed/output/');

    // Step 6: Close Database Connection
    if (!dryRun) {
      await mongoose.connection.close();
      logger.success('Disconnected from MongoDB.');
    }

    // Step 7: Print Complete Hierarchy Summary Report
    logger.divider();
    logger.success('DATABASE SEED PIPELINE COMPLETED SUCCESSFULLY');
    console.log(`\nHierarchy Summary Report:\n`);
    console.log(`- Selected Preset:             ${manifestData.selectedPreset}`);
    console.log(`- Number of Admins:            ${manifestData.numberOfAdmins}`);
    console.log(`- Number of Root Coaches:      ${manifestData.numberOfRootCoaches}`);
    console.log(`- Total Coaches:               ${manifestData.totalCoaches}`);
    console.log(`- Total Clients:               ${manifestData.totalClients}`);
    console.log(`- Maximum Hierarchy Depth:     ${manifestData.maximumHierarchyDepth}`);
    console.log(`- Average Child Coaches:       ${manifestData.averageChildCoaches}`);
    console.log(`- Average Clients Per Coach:   ${manifestData.averageClientsPerCoach}`);
    console.log(`- Validation Status:           ${manifestData.validationStatus}`);
    console.log(`- Database Name:               ${manifestData.databaseName}`);
    console.log(`- Execution Time:              ${manifestData.executionTime}`);
    console.log(`- Output Files Written to:     ${outputDir}`);
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
