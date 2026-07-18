/**
 * K6 Load Test Scenario - Authentication POST /api/auth/login
 * Responsibility: Coordinates Virtual Users, runs active authentication loops
 * using generic helpers, and logs execution SLA statistics.
 */

import exec from 'k6/execution';
import { check } from 'k6';
import { getProfileOptions, TEST_PROFILE, CSV_FILE_PATH } from '../config/config.js';
import { getThresholdsForProfile } from '../config/thresholds.js';
import { parseCSV } from '../utils/csv.js';
import { loginAndGetToken } from '../utils/auth.js';
import { sleepRandom } from '../utils/helpers.js';
import { generateSummary } from '../utils/reporter.js';
import { authLoginDuration, authLoginSuccess, authLoginFailure, authLoginFailureRate } from '../customMetrics/metrics.js';

// 1. Global Scope: Load CSV credentials file
const rawCredentials = open(`../${CSV_FILE_PATH}`);

// 2. Pre-execution Validation: Verify file is not empty and contains required columns
const credentials = parseCSV(rawCredentials);
if (!credentials || credentials.length === 0) {
  throw new Error(`K6 Initialization Error: CSV file is empty at tests/k6/${CSV_FILE_PATH}`);
}

const firstRow = credentials[0];
const phoneKey = Object.keys(firstRow).find((k) => k.toLowerCase() === 'phone');
const passwordKey = Object.keys(firstRow).find((k) => k.toLowerCase() === 'password');
const roleKey = Object.keys(firstRow).find((k) => k.toLowerCase() === 'role');

if (!phoneKey || !passwordKey || !roleKey) {
  throw new Error('K6 Initialization Error: CSV credentials file is missing required columns (Phone, Password, Role) case-insensitively.');
}

// 3. Configure K6 stage profile options and profile-specific thresholds using spread syntax
export const options = {
  ...getProfileOptions(),
  thresholds: getThresholdsForProfile(TEST_PROFILE),
};

// 4. Default VU Loop function
export default function () {
  // Pin each Virtual User consistently to the same account row
  const vuId = exec.vu.idInTest;
  const accountIndex = (vuId - 1) % credentials.length;
  const account = credentials[accountIndex];

  if (!account) {
    authLoginFailure.add(1);
    authLoginFailureRate.add(true);
    console.error(`[VU CONFIG ERROR] No account resolved for VU ${vuId} at index ${accountIndex}`);
    return;
  }

  const phone = account[phoneKey];
  const password = account[passwordKey];
  const role = account[roleKey];

  // Call the flexible, reusable authentication utility helper
  const auth = loginAndGetToken({ phone, password, role });
  const res = auth.response;
  const validation = auth.validation;

  // Map contract validations to K6 assertions checks
  const isOk = check(res, {
    'Login - status code is 200': (r) => r.status === 200,
    'Login - contract validations pass': () => validation.valid,
  });

  if (isOk) {
    // Record Success Metrics
    authLoginSuccess.add(1);
    authLoginFailureRate.add(false);
    authLoginDuration.add(auth.duration);
  } else {
    // Record Failure Metrics
    authLoginFailure.add(1);
    authLoginFailureRate.add(true);
    authLoginDuration.add(auth.duration);

    // Limit failure body output to keep console logs readable
    const bodyPreview = res && res.body ? res.body.slice(0, 300) : 'No Response';

    // Secure diagnostic logging (excludes password for privacy)
    console.warn(
      `[LOGIN FAIL] Phone: ${phone}, Role: ${role}, Status: ${res ? res.status : 'None'}, ` +
      `Latency: ${auth.duration}ms, Validation Errors: [${validation.errors.join(', ')}], ` +
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
