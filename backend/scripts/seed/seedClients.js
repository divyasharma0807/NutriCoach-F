/**
 * Client Seeding Module
 * Responsibility: Generates and inserts Clients with unique bcrypt hashes, linked to Coaches.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import logger from './helpers/logger.js';
import Client from '../../models/Client.js';
import {
  generateIndianName,
  generateEmail,
  generatePhoneNumber,
  generateCity,
  generateGender,
  generateAge,
  generateHeight,
  generateSubscriptionPeriod
} from './helpers/index.js';

/**
 * Seeds Client accounts based on the preset configuration.
 * Distributes clients across the coach IDs in the shared context.
 * @param {object} config - Seeding configuration preset.
 * @param {object} context - Shared ID tracking context.
 * @param {object} options - Execution options (e.g. dryRun).
 * @returns {Promise<object>} Updated context.
 */
export async function seedClients(config, context, options = {}) {
  const clientsPerCoach = config.clientsPerCoach || 0;
  const coachIds = context.coachIds || [];

  logger.info(`Starting Client seeding: clientsPerCoach=${clientsPerCoach}, totalCoaches=${coachIds.length}`);

  if (coachIds.length === 0) {
    logger.warn('No Coach IDs found in context. Skipping Client seeding.');
    context.clientIds = [];
    return context;
  }

  const clientsToInsert = [];
  const clientIds = [];
  const rawClientData = [];

  for (const coachId of coachIds) {
    // Find Coach details in context to populate coachName
    const coachObj = (context.coaches || []).find((c) => c._id.equals(coachId));
    const coachName = coachObj ? coachObj.Name : '';

    for (let i = 0; i < clientsPerCoach; i++) {
      const clientId = new mongoose.Types.ObjectId();
      const gender = generateGender();
      const name = generateIndianName(gender);

      // Standard login fallback for testing (first client of first coach)
      const isFirst = coachId.equals(coachIds[0]) && i === 0;
      const email = isFirst ? 'client@test.com' : generateEmail(name);
      const phone = isFirst ? '9876545678' : generatePhoneNumber();

      clientIds.push(clientId);
      rawClientData.push({
        _id: clientId,
        Role: 'Client',
        Name: name,
        Phone: phone,
        Email: email,
        Password: 'Password123'
      });

      const { subscriptionStartDate, subscriptionExpiryDate } = generateSubscriptionPeriod();

      clientsToInsert.push({
        _id: clientId,
        name,
        email,
        phone,
        password: 'Password123',
        role: 'client',
        city: generateCity(),
        age: generateAge(),
        gender,
        clientPlan: faker.helpers.arrayElement(['Basic', 'Premium', 'Elite']),
        coach: coachId,
        coachName,
        activeGoal: faker.helpers.arrayElement(['Weight Loss', 'Muscle Gain', 'Healthy Living', 'Diet Control']),
        height: generateHeight(),
        heightUnit: 'cm',
        weightUnit: 'kg',
        subscriptionStartDate,
        subscriptionExpiryDate,
        profileComplete: true
      });
    }
  }

  // Generate unique bcrypt hashes in parallel
  logger.info(`Generating unique bcrypt hashes for ${clientsToInsert.length} Clients...`);
  const hashedClients = await Promise.all(
    clientsToInsert.map(async (client) => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(client.password, salt);
      return { ...client, password: hashedPassword };
    })
  );

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${clientsToInsert.length} Client(s) with bulk insert.`);
  } else {
    try {
      const result = await Client.insertMany(hashedClients);
      logger.success(`Created ${result.length} Client(s)`);
    } catch (err) {
      logger.error('Failed to bulk insert Clients', err);
      throw err;
    }
  }

  // Save client details and IDs in context
  context.clientIds = clientIds;
  context.clients = rawClientData;
  context.clientsToInsert = hashedClients;

  return context;
}

export default seedClients;
