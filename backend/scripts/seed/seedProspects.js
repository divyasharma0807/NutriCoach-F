/**
 * Prospect Seeding Module - Phase 3C
 * Responsibility: Generates and bulk inserts prospects mapping to coach activity levels.
 */

import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import logger from './helpers/logger.js';
import Prospect from '../../models/Prospect.js';
import { generateEmail, generatePhoneNumber, generateCity, generateAge, generateGender } from './helpers/index.js';

/**
 * Seeds Prospect records based on the configuration preset.
 * @param {object} config - Seeding configuration preset.
 * @param {object} context - Shared ID tracking context.
 * @param {object} options - Execution options (e.g. dryRun).
 * @returns {Promise<object>} Updated context.
 */
export async function seedProspects(config, context, options = {}) {
  const coachIds = context.coachIds || [];
  const clients = context.clientsToInsert || [];

  logger.info(`Starting Prospect seeding: totalCoaches=${coachIds.length}`);

  if (coachIds.length === 0) {
    logger.warn('No Coach IDs found in context. Skipping Prospect seeding.');
    context.prospectIds = [];
    return context;
  }

  const prospectsToInsert = [];
  const prospectIds = [];

  const weightRanges = ['Under 50kg', '50-65kg', '65-80kg', '80-100kg', 'Above 100kg'];

  for (const coachId of coachIds) {
    // Get clients assigned to this coach
    const coachClients = clients.filter((c) => c.coach.toString() === coachId.toString());

    // Determine Coach Activity Tier
    let activityTier = 'Moderate';
    let targetConversionRate = 0.25; // 25%
    if (coachClients.length >= 4) {
      activityTier = 'High';
      targetConversionRate = 0.50; // 50%
    } else if (coachClients.length <= 1) {
      activityTier = 'Low';
      targetConversionRate = 0.05; // 5%
    }

    // Step 1: Create converted prospects from a realistic percentage of the coach's clients
    const convertedClients = [];
    const conversionProbability = activityTier === 'High' ? 0.6 : activityTier === 'Moderate' ? 0.4 : 0.1;

    for (const client of coachClients) {
      if (Math.random() < conversionProbability) {
        convertedClients.push(client);
      }
    }

    // Add converted prospect records
    for (const client of convertedClients) {
      const prospectId = new mongoose.Types.ObjectId();
      prospectIds.push(prospectId);

      // Timeline: Prospect created 5 to 10 days before client subscription onboarding date
      const onboardingDate = new Date(client.subscriptionStartDate || '2026-01-01');
      const prospectCreatedDate = new Date(onboardingDate);
      prospectCreatedDate.setDate(onboardingDate.getDate() - faker.number.int({ min: 5, max: 10 }));

      // Estimate a weight range based on their initial weight if we can find it
      let weightRange = '65-80kg';
      const clientProfile = (context.clientProfiles || {})[client._id.toString()];
      if (clientProfile && clientProfile.profile) {
        const wt = clientProfile.profile.initialWeight;
        if (wt < 50) weightRange = 'Under 50kg';
        else if (wt < 65) weightRange = '50-65kg';
        else if (wt < 80) weightRange = '65-80kg';
        else if (wt < 100) weightRange = '80-100kg';
        else weightRange = 'Above 100kg';
      }

      prospectsToInsert.push({
        _id: prospectId,
        name: client.name,
        email: client.email,
        phone: client.phone,
        city: client.city || generateCity(),
        age: String(client.age || generateAge()),
        gender: client.gender || generateGender(),
        weightRange,
        addedByCoach: coachId,
        createdAt: prospectCreatedDate,
        updatedAt: prospectCreatedDate
      });
    }

    // Step 2: Generate active/lost (unconverted) prospects to hit target conversion rate
    // conversionRate = converted / (converted + unconverted)
    // unconverted = (converted / conversionRate) - converted
    const numConverted = convertedClients.length;
    let numUnconverted = 0;
    if (numConverted > 0) {
      numUnconverted = Math.round((numConverted / targetConversionRate) - numConverted);
    } else {
      // If no clients converted, assign a baseline of unconverted prospects based on activity tier
      numUnconverted = activityTier === 'High' ? 4 : activityTier === 'Moderate' ? 2 : 1;
    }

    // Cap unconverted prospects to prevent huge sets
    numUnconverted = Math.min(numUnconverted, 10);

    for (let i = 0; i < numUnconverted; i++) {
      const prospectId = new mongoose.Types.ObjectId();
      prospectIds.push(prospectId);

      const gender = generateGender();
      const name = faker.person.fullName({ sex: gender });
      const email = generateEmail(name);
      const phone = generatePhoneNumber();

      // Timeline: Randomly in the past 6 months
      const createdDate = faker.date.past({ refDate: new Date('2026-07-18'), years: 0.5 });

      prospectsToInsert.push({
        _id: prospectId,
        name,
        email,
        phone,
        city: generateCity(),
        age: String(generateAge()),
        gender,
        weightRange: faker.helpers.arrayElement(weightRanges),
        addedByCoach: coachId,
        createdAt: createdDate,
        updatedAt: createdDate
      });
    }
  }

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${prospectsToInsert.length} Prospect(s) with bulk insert.`);
  } else {
    try {
      const result = await Prospect.insertMany(prospectsToInsert);
      logger.success(`Created ${result.length} Prospect(s)`);
    } catch (err) {
      logger.error('Failed to bulk insert Prospects', err);
      throw err;
    }
  }

  context.prospectIds = prospectIds;
  context.prospectsToInsert = prospectsToInsert;

  return context;
}

export default seedProspects;
