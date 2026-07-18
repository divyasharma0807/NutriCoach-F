/**
 * K6 Testing Infrastructure - Configuration Mappings
 * Exposes core load testing parameters driven by environment variables with local fallbacks.
 * Supports multi-environment configurations (Development, Staging, Production).
 */

export const TEST_ENV = __ENV.TEST_ENV || 'development';

// Pre-configured environments settings
export const ENV_CONFIGS = {
  development: {
    baseUrl: 'http://localhost:5001',
  },
  staging: {
    baseUrl: 'https://staging-api.nutricoach.com',
  },
  production: {
    baseUrl: 'https://api.nutricoach.com',
  },
};

// Select the base URL matching the target environment configuration
const currentEnvConfig = ENV_CONFIGS[TEST_ENV] || ENV_CONFIGS.development;
export const BASE_URL = __ENV.BASE_URL || currentEnvConfig.baseUrl;

export const REQUEST_TIMEOUT = parseInt(__ENV.REQUEST_TIMEOUT || '60000', 10);
export const TEST_PROFILE = __ENV.TEST_PROFILE || 'smoke';
export const ENABLE_HTML_REPORT = (__ENV.ENABLE_HTML_REPORT || 'true') === 'true';
export const ENABLE_JSON_REPORT = (__ENV.ENABLE_JSON_REPORT || 'true') === 'true';
export const CSV_FILE_PATH = __ENV.CSV_FILE_PATH || 'data/credentials.csv';

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Reusable stage configurations for K6 load testing profiles
export const PROFILES = {
  smoke: {
    vus: 1,
    duration: '10s',
  },
  load: {
    stages: [
      { duration: '30s', target: 10 }, // Ramp up to 10 VUs
      { duration: '1m', target: 10 },  // Steady state 10 VUs
      { duration: '30s', target: 0 },  // Ramp down to 0 VUs
    ],
  },
  stress: {
    stages: [
      { duration: '30s', target: 25 }, // Ramp up to stress level 25 VUs
      { duration: '1m', target: 25 },  // Sustained stress level
      { duration: '30s', target: 0 },  // Ramp down
    ],
  },
  spike: {
    stages: [
      { duration: '10s', target: 50 }, // Rapid spike to 50 VUs
      { duration: '30s', target: 50 }, // Short duration hold
      { duration: '10s', target: 0 },  // Rapid ramp down
    ],
  },
  soak: {
    stages: [
      { duration: '1m', target: 5 },   // Ramp up to low-intensity load
      { duration: '10m', target: 5 },  // Long-duration soak hold
      { duration: '1m', target: 0 },   // Ramp down
    ],
  },
  ramp: {
    stages: [
      { duration: '30s', target: 1 },  // Stage 1: target 1 VU
      { duration: '1m', target: 5 },   // Stage 2: target 5 VUs
      { duration: '2m', target: 10 },  // Stage 3: target 10 VUs
      { duration: '2m', target: 20 },  // Stage 4: target 20 VUs
      { duration: '2m', target: 50 },  // Stage 5: target 50 VUs
      { duration: '1m', target: 20 },  // Stage 6: target 20 VUs
      { duration: '30s', target: 5 },   // Stage 7: target 5 VUs
      { duration: '10s', target: 0 },   // Stage 8: fully ramp down to 0
    ],
  },
};

/**
 * Returns stage options matching the selected test profile name.
 * Respects dynamic overrides for VUs, duration, and stages.
 * @param {string} profileName
 * @returns {object} K6 option parameters
 */
export function getProfileOptions(profileName = TEST_PROFILE) {
  const baseProfile = PROFILES[profileName] || PROFILES.smoke;

  // Deep clone profile options to avoid shared-state modifications
  const resolvedOptions = JSON.parse(JSON.stringify(baseProfile));

  // 1. Dynamic Override: TEST_STAGES
  const envStages = __ENV.TEST_STAGES;
  if (envStages) {
    try {
      resolvedOptions.stages = JSON.parse(envStages);
      // Clean up single VU/duration mappings if switching to stages
      delete resolvedOptions.vus;
      delete resolvedOptions.duration;
    } catch (e) {
      console.warn(`[K6 CONFIG WARNING] Failed to parse TEST_STAGES env variable: ${e.message}. Using profile default stages.`);
    }
  }

  const envVus = __ENV.TEST_VUS || __ENV.K6_VUS;
  const envDuration = __ENV.TEST_DURATION || __ENV.K6_DURATION;

  // If using stages, apply overrides to stages
  if (resolvedOptions.stages) {
    if (envVus !== undefined) {
      const targetVus = parseInt(envVus, 10);
      if (!isNaN(targetVus)) {
        // Proportionally scale stage targets relative to peak target VUs
        const maxDefaultTarget = Math.max(...baseProfile.stages.map((s) => s.target));
        if (maxDefaultTarget > 0) {
          resolvedOptions.stages = resolvedOptions.stages.map((stage) => {
            stage.target = Math.round((stage.target / maxDefaultTarget) * targetVus);
            return stage;
          });
        } else {
          // If no positive peak, fallback to flat setting
          resolvedOptions.stages = resolvedOptions.stages.map((stage) => {
            if (stage.target > 0) stage.target = targetVus;
            return stage;
          });
        }
      }
    }
    if (envDuration !== undefined) {
      // Apply duration override to every stage evenly
      resolvedOptions.stages = resolvedOptions.stages.map((stage) => {
        stage.duration = envDuration;
        return stage;
      });
    }
  } else {
    // If using single VU / duration setting (like smoke profile)
    if (envVus !== undefined) {
      const targetVus = parseInt(envVus, 10);
      if (!isNaN(targetVus)) {
        resolvedOptions.vus = targetVus;
      }
    }
    if (envDuration !== undefined) {
      resolvedOptions.duration = envDuration;
    }
  }

  return resolvedOptions;
}

export default {
  TEST_ENV,
  BASE_URL,
  REQUEST_TIMEOUT,
  TEST_PROFILE,
  ENABLE_HTML_REPORT,
  ENABLE_JSON_REPORT,
  CSV_FILE_PATH,
  DEFAULT_HEADERS,
  PROFILES,
  getProfileOptions,
};
