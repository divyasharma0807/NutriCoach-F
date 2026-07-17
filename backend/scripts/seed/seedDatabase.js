/**
 * Master Seeding Driver - Phase 3C
 * Responsibility: Connects to MongoDB, manages the database seeding timeline,
 * executes validators (uniqueness, circular, depth, orphans, chronological, journey progressions, boundaries, sessions status/revisions, CRM prospects/referrals),
 * compiles output reports, and saves login credentials & manifest logs.
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

// Import Mongoose models for validation fetches
import Admin from '../../models/Admin.js';
import Coach from '../../models/Coach.js';
import Client from '../../models/Client.js';
import Result from '../../models/Result.js';
import MeasurementHistory from '../../models/MeasurementHistory.js';
import BodyParameterHistory from '../../models/BodyParameterHistory.js';
import DietPlan from '../../models/DietPlan.js';
import Session from '../../models/Session.js';
import Notification from '../../models/Notification.js';
import Prospect from '../../models/Prospect.js';
import Referral from '../../models/Referral.js';

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
  logger.info('DATABASE SEED ENGINE INITIATED (PHASE 3C)');
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
      clientsToInsert: [],
      resultsToInsert: [],
      measurementsToInsert: [],
      bodyParametersToInsert: [],
      dietPlansToInsert: [],
      sessionsToInsert: [],
      notificationsToInsert: [],
      prospectsToInsert: [],
      referralsToInsert: [],
      clientProfiles: null
    };

    const options = { dryRun };

    // Step 3: Run generators sequentially
    logger.info('Executing seeding pipeline generators...');
    
    await seedAdmins(config, context, options);
    await seedCoaches(config, context, options);
    await seedClients(config, context, options);
    await seedResults(config, context, options);
    await seedSessions(config, context, options);
    await seedDietPlans(config, context, options);
    await seedMeasurements(config, context, options);
    await seedBodyParameters(config, context, options);
    await seedNotifications(config, context, options);
    await seedProspects(config, context, options);
    await seedReferrals(config, context, options);

    logger.divider();

    // Step 4: Run Extended Validations
    logger.info('Initiating database integrity and hierarchy validations...');
    
    let dbAdmins = [];
    let dbCoaches = [];
    let dbClients = [];
    let dbResults = [];
    let dbMeasurements = [];
    let dbBodyParameters = [];
    let dbDietPlans = [];
    let dbSessions = [];
    let dbNotifications = [];
    let dbProspects = [];
    let dbReferrals = [];

    if (dryRun) {
      dbAdmins = context.adminsToInsert || [];
      dbCoaches = context.coachesToInsert || [];
      dbClients = context.clientsToInsert || [];
      dbResults = context.resultsToInsert || [];
      dbMeasurements = context.measurementsToInsert || [];
      dbBodyParameters = context.bodyParametersToInsert || [];
      dbDietPlans = context.dietPlansToInsert || [];
      dbSessions = context.sessionsToInsert || [];
      dbNotifications = context.notificationsToInsert || [];
      dbProspects = context.prospectsToInsert || [];
      dbReferrals = context.referralsToInsert || [];
    } else {
      logger.info('Fetching newly inserted documents from MongoDB for verification...');
      dbAdmins = await Admin.find({}).lean();
      dbCoaches = await Coach.find({}).lean();
      dbClients = await Client.find({}).lean();
      dbResults = await Result.find({}).lean();
      dbMeasurements = await MeasurementHistory.find({}).lean();
      dbBodyParameters = await BodyParameterHistory.find({}).lean();
      dbDietPlans = await DietPlan.find({}).lean();
      dbSessions = await Session.find({}).lean();
      dbNotifications = await Notification.find({}).lean();
      dbProspects = await Prospect.find({}).lean();
      dbReferrals = await Referral.find({}).lean();
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

    // 4.7 Results reference valid Clients (check via coach and name)
    const clientsMapByNameAndCoach = new Map();
    for (const c of dbClients) {
      clientsMapByNameAndCoach.set(`${c.name}_${c.coach.toString()}`, c);
    }
    for (const r of dbResults) {
      const key = `${r.clientName}_${r.coach.toString()}`;
      if (!clientsMapByNameAndCoach.has(key)) {
        throw new Error(`Validation Error: Result for client "${r.clientName}" under coach "${r.coach}" has no matching Client!`);
      }
    }
    logger.success('Validation Check Passed: All Results map to valid Client names and Coach IDs.');

    // 4.8 MeasurementHistory & BodyParameterHistory client reference verification (no orphans)
    const clientIdsSet = new Set(dbClients.map((c) => c._id.toString()));
    for (const m of dbMeasurements) {
      if (!m.client) throw new Error('Validation Error: Measurement history record has no client reference (orphan).');
      if (!clientIdsSet.has(m.client.toString())) {
        throw new Error(`Validation Error: Measurement history references non-existent client ID: "${m.client}"`);
      }
    }
    for (const bp of dbBodyParameters) {
      if (!bp.client) throw new Error('Validation Error: Body parameter history record has no client reference (orphan).');
      if (!clientIdsSet.has(bp.client.toString())) {
        throw new Error(`Validation Error: Body parameter history references non-existent client ID: "${bp.client}"`);
      }
    }
    logger.success('Validation Check Passed: All history records reference valid Client IDs (no orphans).');

    // 4.9 Chronological order and timestamp duplicates validation
    const mDates = {};
    const bpDates = {};
    for (const m of dbMeasurements) {
      const cid = m.client.toString();
      if (!mDates[cid]) mDates[cid] = [];
      mDates[cid].push(m.date);
    }
    for (const bp of dbBodyParameters) {
      const cid = bp.client.toString();
      if (!bpDates[cid]) bpDates[cid] = [];
      bpDates[cid].push(bp.date);
    }

    for (const cid in mDates) {
      const dates = mDates[cid];
      const sorted = [...dates].sort();
      const uniqueDates = new Set(dates);
      if (uniqueDates.size !== dates.length) {
        throw new Error(`Validation Error: Duplicate measurement date found for client ${cid}.`);
      }
      for (let i = 1; i < dates.length; i++) {
        if (dates[i] <= dates[i - 1]) {
          throw new Error(`Validation Error: Chronological sorting failed for Client ${cid} measurements: ${dates[i]} is not after ${dates[i - 1]}`);
        }
      }
    }
    for (const cid in bpDates) {
      const dates = bpDates[cid];
      const sorted = [...dates].sort();
      const uniqueDates = new Set(dates);
      if (uniqueDates.size !== dates.length) {
        throw new Error(`Validation Error: Duplicate body parameter date found for client ${cid}.`);
      }
      for (let i = 1; i < dates.length; i++) {
        if (dates[i] <= dates[i - 1]) {
          throw new Error(`Validation Error: Chronological sorting failed for Client ${cid} body parameters: ${dates[i]} is not after ${dates[i - 1]}`);
        }
      }
    }
    logger.success('Validation Check Passed: Chronological ordering correct with no duplicate dates per Client.');

    // 4.10 Journey progression checks
    const clientParams = {};
    for (const bp of dbBodyParameters) {
      const cid = bp.client.toString();
      if (!clientParams[cid]) clientParams[cid] = [];
      clientParams[cid].push(bp);
    }
    for (const cid in clientParams) {
      const history = clientParams[cid].sort((a, b) => a.date.localeCompare(b.date));
      if (history.length < 2) continue;
      const first = history[0];
      const last = history[history.length - 1];

      const profileData = (context.clientProfiles || {})[cid];
      if (!profileData) continue;
      const journey = profileData.profile.journey;

      if (journey === 'Weight Loss') {
        if (last.bodyWeight >= first.bodyWeight) {
          throw new Error(`Journey Validation Error: Client ${cid} on Weight Loss did not lose weight! First: ${first.bodyWeight}, Last: ${last.bodyWeight}`);
        }
      } else if (journey === 'Muscle Gain') {
        if (last.muscleMass <= first.muscleMass) {
          throw new Error(`Journey Validation Error: Client ${cid} on Muscle Gain did not gain muscle! First: ${first.muscleMass}, Last: ${last.muscleMass}`);
        }
      } else if (journey === 'Body Recomposition') {
        if (Math.abs(last.bodyWeight - first.bodyWeight) > 3.0) {
          throw new Error(`Journey Validation Error: Client ${cid} on Recomposition weight fluctuated too much! First: ${first.bodyWeight}, Last: ${last.bodyWeight}`);
        }
        if (last.bodyFatRatio >= first.bodyFatRatio) {
          throw new Error(`Journey Validation Error: Client ${cid} on Recomposition fat ratio did not decrease! First: ${first.bodyFatRatio}, Last: ${last.bodyFatRatio}`);
        }
      }
    }
    logger.success('Validation Check Passed: Client fitness journeys and weight progression directions are correct.');

    // 4.11 Physical and Physiological bounds checks
    for (const bp of dbBodyParameters) {
      if (bp.bodyWeight < 35 || bp.bodyWeight > 180) throw new Error(`Physiological Bound Exception: weight ${bp.bodyWeight} kg is invalid.`);
      if (bp.bodyFatRatio < 3 || bp.bodyFatRatio > 55) throw new Error(`Physiological Bound Exception: fat ${bp.bodyFatRatio}% is invalid.`);
      if (bp.muscleMass < 20 || bp.muscleMass > 100) throw new Error(`Physiological Bound Exception: muscle mass ${bp.muscleMass} kg is invalid.`);
      if (bp.bmi < 14 || bp.bmi > 46) throw new Error(`Physiological Bound Exception: BMI ${bp.bmi} is invalid.`);
    }
    for (const m of dbMeasurements) {
      if (m.waist < 50 || m.waist > 150) throw new Error(`Physiological Bound Exception: waist size ${m.waist} cm is invalid.`);
      if (m.chest < 60 || m.chest > 160) throw new Error(`Physiological Bound Exception: chest size ${m.chest} cm is invalid.`);
    }
    logger.success('Validation Check Passed: All parameters fall within medically realistic limits.');

    // 4.12 DietPlan client and coach validation (no orphans)
    for (const dp of dbDietPlans) {
      if (!dp.client) throw new Error('Validation Error: Diet plan has no client reference (orphan).');
      if (!dp.coach) throw new Error('Validation Error: Diet plan has no coach reference (orphan).');
      if (!clientIdsSet.has(dp.client.toString())) {
        throw new Error(`Validation Error: Diet plan references non-existent client ID: ${dp.client}`);
      }
      if (!coachIdsSet.has(dp.coach.toString())) {
        throw new Error(`Validation Error: Diet plan references non-existent coach ID: ${dp.coach}`);
      }

      // 4.13 Journey alignment verification
      const profileData = (context.clientProfiles || {})[dp.client.toString()];
      if (profileData) {
        const journey = profileData.profile.journey;
        const targetStr = dp.weightLoss || '';
        if (journey === 'Weight Loss' && !targetStr.startsWith('Deficit targets')) {
          throw new Error(`Validation Error: Diet Plan journey mismatch for Client ${dp.client}. Deficit expected but got: "${targetStr}"`);
        }
        if (journey === 'Muscle Gain' && !targetStr.startsWith('Surplus targets')) {
          throw new Error(`Validation Error: Diet Plan journey mismatch for Client ${dp.client}. Surplus expected but got: "${targetStr}"`);
        }
        if (journey === 'Body Recomposition' && !targetStr.startsWith('Recomp targets')) {
          throw new Error(`Validation Error: Diet Plan journey mismatch for Client ${dp.client}. Recomp expected but got: "${targetStr}"`);
        }
        if (journey === 'Maintenance' && !targetStr.startsWith('Maintenance targets')) {
          throw new Error(`Validation Error: Diet Plan journey mismatch for Client ${dp.client}. Maintenance expected but got: "${targetStr}"`);
        }
      }
    }
    logger.success('Validation Check Passed: All Diet Plans map to valid Clients/Coaches and align with fitness journeys.');

    // 4.14 Session fields, status, and timeline validations
    const todayStr = '2026-07-18'; // Mock system date matching current local run times
    for (const session of dbSessions) {
      if (!session.coachId || !session.clientId) {
        throw new Error('Validation Error: Session has missing coachId or clientId references.');
      }
      if (!coachIdsSet.has(session.coachId.toString())) {
        throw new Error(`Validation Error: Session references non-existent coach ID: ${session.coachId}`);
      }
      if (!clientIdsSet.has(session.clientId.toString())) {
        throw new Error(`Validation Error: Session references non-existent client ID: ${session.clientId}`);
      }

      const isPast = session.date <= todayStr;
      if (isPast) {
        if (session.status === 'PENDING') {
          throw new Error(`Validation Error: Past session scheduled for date ${session.date} is left in a PENDING state.`);
        }
      } else {
        if (session.title.includes('Completed') || session.title.includes('Cancelled')) {
          throw new Error(`Validation Error: Future session scheduled for date ${session.date} contains completion notes in title: "${session.title}"`);
        }
      }
    }
    logger.success('Validation Check Passed: Seeding session dates, organizer details, and statuses are correct.');

    // 4.15 Notification recipient validation (no orphans)
    const adminIdsSet = new Set(dbAdmins.map((a) => a._id.toString()));
    const allRecipientIds = new Set([...coachIdsSet, ...clientIdsSet, ...adminIdsSet]);

    for (const n of dbNotifications) {
      if (n.recipientId && !allRecipientIds.has(n.recipientId.toString())) {
        throw new Error(`Validation Error: Notification references non-existent recipient ID: ${n.recipientId}`);
      }
    }
    logger.success('Validation Check Passed: All Notification recipients exist in database (no orphans).');

    // 4.16 Diet plans revisions chronological validation
    const clientDiets = {};
    for (const dp of dbDietPlans) {
      const cid = dp.client.toString();
      if (!clientDiets[cid]) clientDiets[cid] = [];
      clientDiets[cid].push(dp);
    }
    for (const cid in clientDiets) {
      const sorted = [...clientDiets[cid]].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1].createdAt).getTime();
        const curr = new Date(sorted[i].createdAt).getTime();
        if (curr <= prev) {
          throw new Error(`Validation Error: Diet plan revisions for Client ${cid} are not chronological.`);
        }
      }
    }
    logger.success('Validation Check Passed: Diet plan revisions are sorted chronologically.');

    // 4.17 Prospect to Coach ownership check (no orphans)
    for (const pr of dbProspects) {
      if (pr.addedByCoach && !coachIdsSet.has(pr.addedByCoach.toString())) {
        throw new Error(`Validation Error: Prospect references non-existent coach ID: ${pr.addedByCoach}`);
      }
    }
    logger.success('Validation Check Passed: All Prospects map to valid Coach IDs.');

    // 4.18 Referral to Client references check (no orphans)
    for (const ref of dbReferrals) {
      if (!ref.client) throw new Error('Validation Error: Referral has missing client reference.');
      if (!clientIdsSet.has(ref.client.toString())) {
        throw new Error(`Validation Error: Referral references non-existent client ID: ${ref.client}`);
      }
    }
    logger.success('Validation Check Passed: All Referrals reference valid Client IDs (no orphans).');

    // 4.19 Converted Prospect validations (phone/email check) and uniqueness
    const clientsMapByPhone = new Map(dbClients.map((c) => [c.phone, c]));
    const matchedClientIds = new Set();
    const prospectPhones = new Set();

    for (const pr of dbProspects) {
      // Check duplicate phone in prospects collection
      if (prospectPhones.has(pr.phone)) {
        throw new Error(`Validation Error: Duplicate phone number found in Prospects collection: ${pr.phone}`);
      }
      prospectPhones.add(pr.phone);

      const matchedClient = clientsMapByPhone.get(pr.phone);
      if (matchedClient) {
        if (matchedClient.email !== pr.email) {
          throw new Error(`Validation Error: Converted prospect phone/email mismatch. Phone: ${pr.phone}. Client email: ${matchedClient.email}, Prospect email: ${pr.email}`);
        }
        
        const cidStr = matchedClient._id.toString();
        if (matchedClientIds.has(cidStr)) {
          throw new Error(`Validation Error: Duplicate converted prospect mapping found for Client ID: ${cidStr}`);
        }
        matchedClientIds.add(cidStr);

        // 4.20 Chronological: Converted Prospect created before onboarding
        const pCreated = new Date(pr.createdAt).getTime();
        const cStart = new Date(matchedClient.subscriptionStartDate).getTime();
        if (pCreated >= cStart) {
          throw new Error(`Validation Error: Converted Prospect was created after/on Client onboarding date. Prospect: ${pr.createdAt}, Client: ${matchedClient.subscriptionStartDate}`);
        }
      }
    }
    logger.success('Validation Check Passed: Converted prospects correspond to valid Clients with no duplicates and occur before client onboarding.');

    // 4.21 Chronological: Referral created after onboarding
    const clientsMapById = new Map(dbClients.map((c) => [c._id.toString(), c]));
    for (const ref of dbReferrals) {
      const referringClient = clientsMapById.get(ref.client.toString());
      if (referringClient) {
        const refCreated = new Date(ref.createdAt).getTime();
        const cStart = new Date(referringClient.subscriptionStartDate).getTime();
        if (refCreated <= cStart) {
          throw new Error(`Validation Error: Referral occurred before/on the referring client onboarding date. Referral: ${ref.createdAt}, Client: ${referringClient.subscriptionStartDate}`);
        }
      }
    }
    logger.success('Validation Check Passed: All Referrals occurred chronologically after client subscription onboarding.');

    logger.success('Hierarchy, History, Operational & CRM Validations Passed');
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

    // Date range calculation
    const allDates = [
      ...dbMeasurements.map((m) => m.date),
      ...dbBodyParameters.map((bp) => bp.date),
      ...dbSessions.map((s) => s.date),
      ...dbProspects.map((p) => new Date(p.createdAt).toISOString().split('T')[0]),
      ...dbReferrals.map((r) => new Date(r.createdAt).toISOString().split('T')[0])
    ].sort();
    const dateRangeCovered = allDates.length > 0 ? `${allDates[0]} to ${allDates[allDates.length - 1]}` : 'N/A';

    // Journey distribution calculation
    const journeyDistribution = {};
    if (context.clientProfiles) {
      for (const cid in context.clientProfiles) {
        const j = context.clientProfiles[cid].profile.journey;
        journeyDistribution[j] = (journeyDistribution[j] || 0) + 1;
      }
    }

    // Sessions metrics
    const completedSessions = dbSessions.filter((s) => s.status === 'APPROVED' && s.date <= todayStr).length;
    const upcomingSessions = dbSessions.filter((s) => s.date > todayStr).length;
    const cancelledSessions = dbSessions.filter((s) => s.status === 'REJECTED').length;

    // DietPlan revisions count
    const totalDietPlans = dbDietPlans.length;
    const initialDietPlansCount = dbClients.length;
    const dietPlanRevisionsCount = Math.max(0, totalDietPlans - initialDietPlansCount);

    // Business Data Splits
    const totalConverted = matchedClientIds.size;
    const totalUnconverted = dbProspects.length - totalConverted;
    const lostProspects = Math.round(totalUnconverted * 0.2);
    const activeProspects = totalUnconverted - lostProspects;

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
      
      // Phase 3A Metrics
      resultsGenerated: dbResults.length,
      measurementRecordsGenerated: dbMeasurements.length,
      bodyParameterRecordsGenerated: dbBodyParameters.length,
      averageRecordsPerClient: dbClients.length > 0 ? parseFloat((dbMeasurements.length / dbClients.length).toFixed(1)) : 0,

      // Phase 3B Metrics
      dietPlansGenerated: totalDietPlans,
      dietPlanRevisions: dietPlanRevisionsCount,
      sessionsGenerated: dbSessions.length,
      completedSessions,
      upcomingSessions,
      cancelledSessions,
      notificationsGenerated: dbNotifications.length,
      readNotifications: dbNotifications.filter((n) => n.read).length,
      unreadNotifications: dbNotifications.filter((n) => !n.read).length,
      averageSessionsPerClient: dbClients.length > 0 ? parseFloat((dbSessions.length / dbClients.length).toFixed(1)) : 0,
      averageDietPlansPerClient: dbClients.length > 0 ? parseFloat((totalDietPlans / dbClients.length).toFixed(1)) : 0,
      averageNotificationsPerClient: dbClients.length > 0 ? parseFloat((dbNotifications.length / dbClients.length).toFixed(1)) : 0,

      // Phase 3C Metrics
      prospectsGenerated: dbProspects.length,
      convertedProspects: totalConverted,
      activeProspects,
      lostProspects,
      referralsGenerated: dbReferrals.length,
      prospectsPerCoach: dbCoaches.length > 0 ? parseFloat((dbProspects.length / dbCoaches.length).toFixed(1)) : 0,
      averageConversionRate: dbProspects.length > 0 ? parseFloat(((totalConverted / dbProspects.length) * 100).toFixed(1)) : 0,
      referralsPerCoach: dbCoaches.length > 0 ? parseFloat((dbReferrals.length / dbCoaches.length).toFixed(1)) : 0,
      referralParticipationRate: dbClients.length > 0 ? parseFloat(((new Set(dbReferrals.map((r) => r.client.toString())).size / dbClients.length) * 100).toFixed(1)) : 0,

      dateRangeCovered,
      journeyDistribution,
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

    // Step 7: Print Complete Seeding Summary Report
    logger.divider();
    logger.success('DATABASE SEED PIPELINE COMPLETED SUCCESSFULLY');
    console.log(`\nExecution Summary Report:\n`);
    console.log(`- Selected Preset:             ${manifestData.selectedPreset}`);
    console.log(`- Total Admins:                ${manifestData.numberOfAdmins}`);
    console.log(`- Total Coaches:               ${manifestData.totalCoaches} (Roots: ${manifestData.numberOfRootCoaches})`);
    console.log(`- Total Clients:               ${manifestData.totalClients}`);
    console.log(`- Diet Plans (Revisions):      ${manifestData.dietPlansGenerated} (${manifestData.dietPlanRevisions} revisions)`);
    console.log(`- Sessions (Past / Future):    ${manifestData.sessionsGenerated} (${manifestData.completedSessions} past / ${manifestData.upcomingSessions} future)`);
    console.log(`- Notifications:               ${manifestData.notificationsGenerated} (${manifestData.unreadNotifications} unread)`);
    console.log(`- Prospects (Conv Rate):       ${manifestData.prospectsGenerated} (Rate: ${manifestData.averageConversionRate}%)`);
    console.log(`- Referrals (Part Rate):       ${manifestData.referralsGenerated} (Rate: ${manifestData.referralParticipationRate}%)`);
    console.log(`- Date Range Covered:          ${manifestData.dateRangeCovered}`);
    console.log(`- Max Hierarchy Depth:         ${manifestData.maximumHierarchyDepth}`);
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
