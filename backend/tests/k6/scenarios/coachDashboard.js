/**
 * K6 Load Test Scenario - Coach Dashboard GET /api/coaches/dashboard
 * Responsibility: Performs authentication for coach accounts, queries coach dashboard stats/lists,
 * asserts core API payload contracts, and tracks dashboard performance SLAs.
 */

import http from 'k6/http';
import exec from 'k6/execution';
import { check } from 'k6';
import { getProfileOptions, BASE_URL, REQUEST_TIMEOUT, DEFAULT_HEADERS, CSV_FILE_PATH, TEST_PROFILE } from '../config/config.js';
import { getThresholdsForProfile } from '../config/thresholds.js';
import { parseCSV } from '../utils/csv.js';
import { loginAndGetToken, buildAuthHeader } from '../utils/auth.js';
import { validateCoachDashboardResponse } from '../utils/responseValidators.js';
import { sleepRandom } from '../utils/helpers.js';
import { generateSummary } from '../utils/reporter.js';
import { coachDashboardDuration, coachDashboardSuccess, coachDashboardFailure, coachDashboardFailureRate } from '../customMetrics/metrics.js';

// 1. Global Scope: Load CSV credentials file
const rawCredentials = open(`../${CSV_FILE_PATH}`);

// 2. Pre-execution Validation: Verify file is not empty and filter Coach accounts only
const allCredentials = parseCSV(rawCredentials);
if (!allCredentials || allCredentials.length === 0) {
  throw new Error(`K6 Initialization Error: CSV file is empty at tests/k6/${CSV_FILE_PATH}`);
}

const firstRow = allCredentials[0];
const phoneKey = Object.keys(firstRow).find((k) => k.toLowerCase() === 'phone');
const passwordKey = Object.keys(firstRow).find((k) => k.toLowerCase() === 'password');
const roleKey = Object.keys(firstRow).find((k) => k.toLowerCase() === 'role');

if (!phoneKey || !passwordKey || !roleKey) {
  throw new Error('K6 Initialization Error: CSV credentials file is missing required columns (Phone, Password, Role) case-insensitively.');
}

const credentials = allCredentials.filter((row) => {
  const roleVal = row[roleKey] || '';
  return roleVal.toLowerCase() === 'coach';
});

if (credentials.length === 0) {
  throw new Error('K6 Initialization Error: No coach credentials found in CSV.');
}

// 3. Configure K6 stage profile options and profile-specific thresholds using spread syntax
export const options = {
  ...getProfileOptions(),
  thresholds: getThresholdsForProfile(TEST_PROFILE),
};

// 4. Default VU Loop function
export default function () {
  // Pin each Virtual User consistently to the same Coach account row
  const vuId = exec.vu.idInTest;
  const accountIndex = (vuId - 1) % credentials.length;
  const coachAccount = credentials[accountIndex];

  if (!coachAccount) {
    coachDashboardFailure.add(1);
    coachDashboardFailureRate.add(true);
    console.error(`[VU CONFIG ERROR] No Coach account resolved for VU ${vuId} at index ${accountIndex}`);
    return;
  }

  const phone = coachAccount[phoneKey];
  const password = coachAccount[passwordKey];
  const role = coachAccount[roleKey];

  // Re-use authentication helper
  const auth = loginAndGetToken({ phone, password, role });
  
  if (!auth.token || !auth.validation.valid) {
    coachDashboardFailure.add(1);
    coachDashboardFailureRate.add(true);
    console.warn(`[COACH DASHBOARD ABORT] Coach login authentication failed for phone ${phone}, skipping iteration.`);
    return;
  }

  const url = `${BASE_URL}/api/coaches/dashboard`;
  const params = {
    headers: Object.assign({}, DEFAULT_HEADERS, buildAuthHeader(auth.token)),
    timeout: REQUEST_TIMEOUT,
  };

  let res;
  try {
    res = http.get(url, params);
  } catch (err) {
    coachDashboardFailure.add(1);
    coachDashboardFailureRate.add(true);
    console.error(`[NETWORK EXCEPTION] GET /coaches/dashboard failed for Phone: ${phone}. Error: ${err.message}`);
    return;
  }

  const duration = res.timings ? res.timings.duration : 0;
  const validation = validateCoachDashboardResponse(res);

  // Map contract validations to K6 assertions checks
  const isOk = check(res, {
    'CoachDashboard - status code is 200': (r) => r.status === 200,
    'CoachDashboard - contract validations pass': () => validation.valid,
  });

  if (isOk) {
    // Record Success Metrics
    coachDashboardSuccess.add(1);
    coachDashboardFailureRate.add(false);
    coachDashboardDuration.add(duration);
  } else {
    // Record Failure Metrics
    coachDashboardFailure.add(1);
    coachDashboardFailureRate.add(true);
    coachDashboardDuration.add(duration);

    // Limit failure body output to keep console logs readable
    const bodyPreview = res && res.body ? res.body.slice(0, 300) : 'No Response';

    // Secure diagnostic logging
    console.warn(
      `[COACH DASHBOARD FAIL] Phone: ${phone}, Status: ${res ? res.status : 'None'}, ` +
      `Latency: ${duration}ms, Validation Errors: [${validation.errors.join(', ')}], ` +
      `Body Preview: ${bodyPreview}`
    );
  }

  // Think-time pacing simulation
  sleepRandom(1, 3);
}

// 5. Output Summary Reporter Hook
export function handleSummary(data) {
  return generateSummary(data);
}
