/**
 * Coach Seeding Module
 * Responsibility: Simulates/coordinates bulk seeding of Coaches.
 * Focuses on senior/junior hierarchy structure using Coach.seniorCoach.
 */

import mongoose from 'mongoose';
import logger from './helpers/logger.js';

/**
 * Seeds Coach accounts based on the preset configuration.
 * Sets up hierarchical relationships using seniorCoach.
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

  // Helper to recursively generate child coaches down to target hierarchy depth
  function generateLevel(parentCoachId, currentDepth) {
    if (currentDepth > depth) return;

    for (let i = 0; i < childPerCoach; i++) {
      const coachId = new mongoose.Types.ObjectId();
      coachIds.push(coachId);
      coachesToInsert.push({
        _id: coachId,
        seniorCoach: parentCoachId, // exact hierarchy field
        level: 'Coach',
        // Other fields like name, email, phone, password will be populated in Phase 2
      });

      // Recurse to generate next level of child coaches
      generateLevel(coachId, currentDepth + 1);
    }
  }

  // Generate top-level root coaches (Senior Coaches)
  for (let i = 0; i < rootCount; i++) {
    const coachId = new mongoose.Types.ObjectId();
    coachIds.push(coachId);
    coachesToInsert.push({
      _id: coachId,
      seniorCoach: null,
      level: 'Senior Coach',
    });

    // Generate child coaches for this senior coach starting at depth level 1
    generateLevel(coachId, 1);
  }

  if (options.dryRun) {
    logger.success(`[DRY RUN] Would seed ${coachesToInsert.length} Coach(es) with bulk insert.`);
  } else {
    // Phase 2: Implement Mongoose Coach.insertMany(coachesToInsert)
    logger.success(`Seeded ${coachesToInsert.length} Coach(es) (Framework Skeleton)`);
  }

  context.coachIds = coachIds;
  return context;
}

export default seedCoaches;
