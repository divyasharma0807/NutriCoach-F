/**
 * Seeding Configuration Presets
 * Controls dataset scale parameters for development, QA, load testing, and stress testing.
 * Future generator modules should read only from this configuration.
 */

const PRESETS = {
  DEV: {
    name: 'DEV',
    admins: 1,
    rootCoaches: 2,
    hierarchyDepth: 1, // 0 = only root, 1 = root -> level 1
    childCoachesPerCoach: 2,
    clientsPerCoach: 3,
    resultsPerClient: 2,
    notificationsPerCoach: 3,
    sessionsPerCoach: 4,
    dietPlansPerClient: 2,
    measurementsPerClient: 2,
    bodyParameterEntriesPerClient: 2,
    prospects: 5,
    referrals: 3
  },
  QA: {
    name: 'QA',
    admins: 2,
    rootCoaches: 4,
    hierarchyDepth: 2, // root -> level 1 -> level 2
    childCoachesPerCoach: 3,
    clientsPerCoach: 10,
    resultsPerClient: 5,
    notificationsPerCoach: 10,
    sessionsPerCoach: 10,
    dietPlansPerClient: 5,
    measurementsPerClient: 5,
    bodyParameterEntriesPerClient: 5,
    prospects: 20,
    referrals: 15
  },
  LOAD_TEST: {
    name: 'LOAD_TEST',
    admins: 5,
    rootCoaches: 10,
    hierarchyDepth: 2,
    childCoachesPerCoach: 5,
    clientsPerCoach: 50,
    resultsPerClient: 20,
    notificationsPerCoach: 30,
    sessionsPerCoach: 40,
    dietPlansPerClient: 20,
    measurementsPerClient: 25,
    bodyParameterEntriesPerClient: 20,
    prospects: 200,
    referrals: 150
  },
  STRESS_TEST: {
    name: 'STRESS_TEST',
    admins: 10,
    rootCoaches: 20,
    hierarchyDepth: 3,
    childCoachesPerCoach: 5,
    clientsPerCoach: 100,
    resultsPerClient: 50,
    notificationsPerCoach: 100,
    sessionsPerCoach: 100,
    dietPlansPerClient: 50,
    measurementsPerClient: 50,
    bodyParameterEntriesPerClient: 50,
    prospects: 1000,
    referrals: 800
  }
};

// Select preset based on environment variable, defaulting to DEV
const activePresetName = (process.env.SEED_PRESET || 'DEV').toUpperCase();
const config = PRESETS[activePresetName] || PRESETS.DEV;

export { PRESETS, config };
export default config;
