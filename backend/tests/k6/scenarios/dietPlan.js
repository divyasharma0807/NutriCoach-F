/**
 * K6 Load Test Scenario - Client Diet Plan GET /api/diet-plans/my-plan
 * Responsibility: Performs authentication for client accounts, queries client's active diet plan,
 * asserts core API payload contracts, and tracks performance SLAs.
 */

import http from 'k6/http';
import exec from 'k6/execution';
import { check } from 'k6';
import { getProfileOptions, BASE_URL, REQUEST_TIMEOUT, DEFAULT_HEADERS, CSV_FILE_PATH, TEST_PROFILE } from '../config/config.js';
import { getThresholdsForProfile } from '../config/thresholds.js';
import { parseCSV } from '../utils/csv.js';
import { loginAndGetToken, buildAuthHeader } from '../utils/auth.js';
import { validateDietPlanResponse } from '../utils/responseValidators.js';
import { sleepRandom } from '../utils/helpers.js';
import { generateSummary } from '../utils/reporter.js';
import { dietPlanDuration, dietPlanSuccess, dietPlanFailure, dietPlanFailureRate } from '../customMetrics/metrics.js';

// 1. Global Scope: Load CSV credentials file
const rawCredentials = open(`../${CSV_FILE_PATH}`);

// 2. Pre-execution Validation: Verify file is not empty and filter Client accounts only
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
  return roleVal.toLowerCase() === 'client';
});

if (credentials.length === 0) {
  throw new Error('K6 Initialization Error: No client credentials found in CSV.');
}

// 3. Configure K6 stage profile options and profile-specific thresholds using spread syntax
export const options = {
  ...getProfileOptions(),
  thresholds: getThresholdsForProfile(TEST_PROFILE),
};

// 4. Default VU Loop function
export default function () {
  // Pin each Virtual User consistently to the same Client account row
  const vuId = exec.vu.idInTest;
  const accountIndex = (vuId - 1) % credentials.length;
  const clientAccount = credentials[accountIndex];

  if (!clientAccount) {
    dietPlanFailure.add(1);
    dietPlanFailureRate.add(true);
    console.error(`[VU CONFIG ERROR] No Client account resolved for VU ${vuId} at index ${accountIndex}`);
    return;
  }

  const phone = clientAccount[phoneKey];
  const password = clientAccount[passwordKey];
  const role = clientAccount[roleKey];

  // Re-use authentication helper
  const auth = loginAndGetToken({ phone, password, role });
  
  if (!auth.token || !auth.validation.valid) {
    dietPlanFailure.add(1);
    dietPlanFailureRate.add(true);
    console.warn(`[DIET PLAN ABORT] Client login authentication failed for phone ${phone}, skipping iteration.`);
    return;
  }

  const url = `${BASE_URL}/api/diet-plans/my-plan`;
  const params = {
    headers: Object.assign({}, DEFAULT_HEADERS, buildAuthHeader(auth.token)),
    timeout: REQUEST_TIMEOUT,
  };

  let res;
  try {
    res = http.get(url, params);
  } catch (err) {
    dietPlanFailure.add(1);
    dietPlanFailureRate.add(true);
    console.error(`[NETWORK EXCEPTION] GET /diet-plans/my-plan failed for Phone: ${phone}. Error: ${err.message}`);
    return;
  }

  const duration = res.timings ? res.timings.duration : 0;
  const validation = validateDietPlanResponse(res);

  // Map contract validations to K6 assertions checks
  const isOk = check(res, {
    'DietPlan - status code is 200': (r) => r.status === 200,
    'DietPlan - contract validations pass': () => validation.valid,
  });

  if (isOk) {
    // Record Success Metrics
    dietPlanSuccess.add(1);
    dietPlanFailureRate.add(false);
    dietPlanDuration.add(duration);
  } else {
    // Record Failure Metrics
    dietPlanFailure.add(1);
    dietPlanFailureRate.add(true);
    dietPlanDuration.add(duration);

    // Limit failure body output to keep console logs readable
    const bodyPreview = res && res.body ? res.body.slice(0, 300) : 'No Response';

    // Secure diagnostic logging
    console.warn(
      `[DIET PLAN FAIL] Phone: ${phone}, Status: ${res ? res.status : 'None'}, ` +
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
