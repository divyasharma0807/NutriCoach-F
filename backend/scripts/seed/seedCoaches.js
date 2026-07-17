/**
 * Coach Seeding Module
 * Responsibility: Generates and inserts Coach hierarchy tree with unique bcrypt hashes.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import logger from './helpers/logger.js';
import Coach from '../../models/Coach.js';
import {
  generateIndianName,
  generateEmail,
  generatePhoneNumber,
  generateCity,
  generateGender
} from './helpers/index.js';

/**
 * Seeds Coach accounts based on the preset configuration.
 * Sets up hierarchical relationships using Coach.seniorCoach.
 * @param {object} config - Seeding configuration preset.
 * @param {object} context - Shared ID tracking context.
 * @param {object} options - Execution options (e.g. dryRun).
 * @returns {Promise<object>} Updated context.
 */
export async function seedCoaches(config, context, options = {}) {
  const rootCount = config.rootCoaches || 0;
  const depth = config.hierarchyDepth || 0;
  const childPerCoach = config.childCoachesPerCoach || 0;

  logger.info(`Starting Coach seeding: rootCount=${rootCount}, depth=${depth}, childrenPerCoach=${childPerCoach}`);

  const coachesToInsert = [];
  const coachIds = [];
  const rawCoachData = [];

  // Helper to recursively generate child coaches down to target hierarchy depth
  function generateLevel(parentCoachId, currentDepth) {
    if (currentDepth > depth) return;

    for (let i = 0; i < childPerCoach; i++) {
      const coachId = new mongoose.Types.ObjectId();
      const gender = generateGender();
      const name = generateIndianName(gender);
      const email = generateEmail(name);
      const phone = generatePhoneNumber();

      coachIds.push(coachId);
      rawCoachData.push({
        _id: coachId,
        Role: 'Coach',
        Name: name,
        Phone: phone,
        Email: email,
        Password: 'Password123'
      });

      coachesToInsert.push({
        _id: coachId,
        name,
        email,
        phone,
        password: 'Password123',
        role: 'coach',
        level: 'Coach',
        city: generateCity(),
        gender,
        experience: '3 years',
        activeStatus: 'Active',
        seniorCoach: parentCoachId
      });

      // Recurse to generate next level of child coaches
      generateLevel(coachId, currentDepth + 1);
    }
  }

  // Generate top-level root coaches (Senior Coaches)
  for (let i = 0; i < rootCount; i++) {
    const coachId = new mongoose.Types.ObjectId();
    const gender = generateGender();
    const name = generateIndianName(gender);
    // Standard login fallback for testing
    const email = i === 0 ? 'coach@test.com' : generateEmail(name);
    const phone = i === 0 ? '9876543210' : generatePhoneNumber();

    coachIds.push(coachId);
    rawCoachData.push({
      _id: coachId,
      Role: 'Coach',
      Name: name,
      Phone: phone,
      Email: email,
      Password: 'Password123'
    });

    coachesToInsert.push({
      _id: coachId,
      name,
      email,
      phone,
      password: 'Password123',
      role: 'coach',
      level: 'Senior Coach',
      city: generateCity(),
      gender,
      experience: '8 years',
      activeStatus: 'Active',
      seniorCoach: null
    });

    // Generate child coaches for this senior coach starting at depth level 1
    generateLevel(coachId, 1);
  }

  // Generate unique bcrypt hashes in parallel
  logger.info(`Generating unique bcrypt hashes for ${coachesToInsert.length} Coaches...`);
  const hashedCoaches = await Promise.all(
    coachesToInsert.map(async (coach) => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(coach.password, salt);
      return { ...coach, password: hashedPassword };
    })
  );

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${coachesToInsert.length} Coach(es) with bulk insert.`);
  } else {
    try {
      const result = await Coach.insertMany(hashedCoaches);
      logger.success(`Created ${result.length} Coach(es)`);
    } catch (err) {
      logger.error('Failed to bulk insert Coaches', err);
      throw err;
    }
  }

  // Save coach details and IDs in context
  context.coachIds = coachIds;
  context.coaches = rawCoachData;
  context.coachesToInsert = hashedCoaches;

  return context;
}

export default seedCoaches;
