/**
 * Admin Seeding Module
 * Responsibility: Generates and inserts Admin accounts with unique bcrypt hashes.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import logger from './helpers/logger.js';
import Admin from '../../models/Admin.js';
import {
  generateIndianName,
  generateEmail,
  generatePhoneNumber,
  generateCity,
  generateGender,
  generateAge
} from './helpers/index.js';

/**
 * Seeds Admin accounts based on the preset configuration.
 * @param {object} config - Seeding configuration preset.
 * @param {object} context - Shared ID tracking context.
 * @param {object} options - Execution options (e.g. dryRun).
 * @returns {Promise<object>} Updated context.
 */
export async function seedAdmins(config, context, options = {}) {
  const count = config.admins || 0;
  logger.info(`Starting Admin seeding: target count is ${count}`);

  const mockAdmins = [];
  const adminIds = [];
  const rawAdminData = [];

  for (let i = 0; i < count; i++) {
    const adminId = new mongoose.Types.ObjectId();
    const gender = generateGender();
    const name = generateIndianName(gender);
    const email = i === 0 ? 'admin@test.com' : generateEmail(name); // Standard login fallback
    const phone = i === 0 ? '9999999999' : generatePhoneNumber();

    adminIds.push(adminId);
    
    // Save raw credentials data for CSV export
    rawAdminData.push({
      _id: adminId,
      Role: 'Admin',
      Name: name,
      Phone: phone,
      Email: email,
      Password: 'Password123'
    });

    mockAdmins.push({
      _id: adminId,
      name,
      email,
      phone,
      password: 'Password123', // Will be hashed in the next step
      role: 'admin',
      age: String(generateAge()),
      gender,
      city: generateCity(),
      experience: '5 years',
      coachName: ''
    });
  }

  // Generate unique bcrypt hashes in parallel
  logger.info('Generating unique bcrypt hashes for Admins...');
  const hashedAdmins = await Promise.all(
    mockAdmins.map(async (admin) => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(admin.password, salt);
      return { ...admin, password: hashedPassword };
    })
  );

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${count} Admin(s) with bulk insert.`);
  } else {
    try {
      const result = await Admin.insertMany(hashedAdmins);
      logger.success(`Created ${result.length} Admin(s)`);
    } catch (err) {
      logger.error('Failed to bulk insert Admins', err);
      throw err;
    }
  }

  // Save admin details and IDs in context
  context.adminIds = adminIds;
  context.admins = rawAdminData;
  context.adminsToInsert = hashedAdmins;

  return context;
}

export default seedAdmins;
