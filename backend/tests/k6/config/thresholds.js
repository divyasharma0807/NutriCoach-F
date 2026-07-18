/**
 * K6 Testing Infrastructure - Performance SLAs and Thresholds
 * Defines standard success and duration constraints to validate application health under load.
 * Supports profile-specific thresholds and environment runtime overrides.
 */

import { TEST_PROFILE } from './config.js';

// Base SLA configurations per execution profile
export const PROFILE_THRESHOLDS = {
  smoke: {
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<1500', 'p(99)<2500'], // More tolerant to WAN latency
    'checks': ['rate>0.99'],
    'http_reqs': ['count>0'],
  },
  load: {
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // Stricter targets for steady state
    'iteration_duration': ['p(95)<2000'],
    'checks': ['rate>0.99'],
    'http_reqs': ['count>0'],
  },
  stress: {
    'http_req_failed': ['rate<0.05'], // Allows up to 5% failure under extreme stress
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    'iteration_duration': ['p(95)<3000'],
    'checks': ['rate>0.95'],
    'http_reqs': ['count>0'],
  },
  spike: {
    'http_req_failed': ['rate<0.10'], // Allows up to 10% failure during spikes
    'http_req_duration': ['p(95)<1500', 'p(99)<3000'],
    'iteration_duration': ['p(95)<4000'],
    'checks': ['rate>0.90'],
    'http_reqs': ['count>0'],
  },
  soak: {
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'iteration_duration': ['p(95)<2000'],
    'checks': ['rate>0.99'],
    'http_reqs': ['count>0'],
  },
};

/**
 * Resolves active performance thresholds based on the execution profile.
 * Supports overriding the p(95) latency threshold using `LOGIN_P95_THRESHOLD`.
 * @param {string} profileName - Selected preset profile name (default: TEST_PROFILE)
 * @returns {object} SLA thresholds mapping
 */
export function getThresholdsForProfile(profileName = TEST_PROFILE) {
  const defaults = PROFILE_THRESHOLDS[profileName] || PROFILE_THRESHOLDS.smoke;
  
  // Clone thresholds to prevent side-effect state mutations
  const activeThresholds = Object.assign({}, defaults);

  const p95Override = __ENV.LOGIN_P95_THRESHOLD;
  if (p95Override) {
    const overrideVal = Number(p95Override);
    if (!isNaN(overrideVal)) {
      activeThresholds['http_req_duration'] = [`p(95)<${overrideVal}`, `p(99)<${overrideVal * 2}`];
      if (profileName !== 'smoke') {
        activeThresholds['iteration_duration'] = [`p(95)<${overrideVal + 1500}`];
      }
    }
  }

  return activeThresholds;
}

export default {
  PROFILE_THRESHOLDS,
  getThresholdsForProfile,
};
