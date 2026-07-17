/**
 * Referral Seeding Module - Phase 3C
 * Responsibility: Generates and bulk inserts referrals created by highly satisfied, high-engagement clients.
 */

import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import logger from './helpers/logger.js';
import Referral from '../../models/Referral.js';
import { ensureClientProfiles } from './helpers/progression.js';
import { generateEmail, generatePhoneNumber, generateCity, generateAge, generateGender } from './helpers/index.js';

/**
 * Seeds Referral records based on the configuration preset.
 * @param {object} config - Seeding configuration preset.
 * @param {object} context - Shared ID tracking context.
 * @param {object} options - Execution options (e.g. dryRun).
 * @returns {Promise<object>} Updated context.
 */
export async function seedReferrals(config, context, options = {}) {
  const clientIds = context.clientIds || [];
  const clients = context.clientsToInsert || [];

  logger.info(`Starting Referral seeding: totalClients=${clientIds.length}`);

  if (clientIds.length === 0) {
    logger.warn('No Client IDs found in context. Skipping Referral seeding.');
    context.referralIds = [];
    return context;
  }

  // Ensure profiles are loaded
  const clientProfiles = ensureClientProfiles(context, config);

  const referralsToInsert = [];
  const referralIds = [];

  const weightRanges = ['Under 50kg', '50-65kg', '65-80kg', '80-100kg', 'Above 100kg'];
  const interests = ['Weight Loss coaching', 'Muscle gain guidance', 'Meal plan subscription', 'General fitness consultation'];

  for (const clientId of clientIds) {
    const clientRecord = clients.find((c) => c._id.equals(clientId));
    if (!clientRecord) continue;

    const data = clientProfiles[clientId.toString()];
    if (!data) continue;

    const { profile } = data;
    const engagement = profile.engagementTier || 'Moderate';

    // Set referral probabilities based on client satisfaction (engagement tier)
    let referralProbability = 0.0;
    let maxReferrals = 0;

    if (engagement === 'High') {
      referralProbability = 0.45; // 45% chance
      maxReferrals = 2;
    } else if (engagement === 'Moderate') {
      referralProbability = 0.15; // 15% chance
      maxReferrals = 1;
    }

    if (Math.random() > referralProbability) continue;

    const numReferrals = faker.number.int({ min: 1, max: maxReferrals });

    for (let r = 0; r < numReferrals; r++) {
      const referralId = new mongoose.Types.ObjectId();
      referralIds.push(referralId);

      // Chronological offset: referral occurs 15 to 30 days after subscription starts
      const onboardingDate = new Date(clientRecord.subscriptionStartDate || '2026-01-01');
      const referralDate = new Date(onboardingDate);
      referralDate.setDate(onboardingDate.getDate() + faker.number.int({ min: 15, max: 30 }));

      const gender = generateGender();
      const name = faker.person.fullName({ sex: gender });
      const email = generateEmail(name);
      const phone = generatePhoneNumber();

      referralsToInsert.push({
        _id: referralId,
        client: clientId,
        name,
        email,
        phone,
        city: generateCity(),
        age: String(generateAge()),
        gender,
        weightRange: faker.helpers.arrayElement(weightRanges),
        interest: faker.helpers.arrayElement(interests),
        createdAt: referralDate,
        updatedAt: referralDate
      });
    }
  }

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${referralsToInsert.length} Referral(s) with bulk insert.`);
  } else {
    try {
      const result = await Referral.insertMany(referralsToInsert);
      logger.success(`Created ${result.length} Referral(s)`);
    } catch (err) {
      logger.error('Failed to bulk insert Referrals', err);
      throw err;
    }
  }

  context.referralIds = referralIds;
  context.referralsToInsert = referralsToInsert;

  return context;
}

export default seedReferrals;
