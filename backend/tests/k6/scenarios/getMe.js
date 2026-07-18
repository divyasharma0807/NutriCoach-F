/**
 * K6 Load Test Scenario - Authenticated User Identity GET /api/auth/me
 * Responsibility: Performs authentication, calls /api/auth/me with the token,
 * asserts the contract and role/phone fields matches, and tracks identity query SLAs.
 */

import http from 'k6/http';
import exec from 'k6/execution';
import { check } from 'k6';
import { getProfileOptions, BASE_URL, REQUEST_TIMEOUT, DEFAULT_HEADERS, CSV_FILE_PATH, TEST_PROFILE } from '../config/config.js';
import { getThresholdsForProfile } from '../config/thresholds.js';
import { parseCSV } from '../utils/csv.js';
import { loginAndGetToken, buildAuthHeader } from '../utils/auth.js';
import { validateGetMeResponse } from '../utils/responseValidators.js';
import { sleepRandom } from '../utils/helpers.js';
import { generateSummary } from '../utils/reporter.js';
import { authGetMeDuration, authGetMeSuccess, authGetMeFailure, authGetMeFailureRate } from '../customMetrics/metrics.js';

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
    authGetMeFailure.add(1);
    authGetMeFailureRate.add(true);
    console.error(`[VU CONFIG ERROR] No account resolved for VU ${vuId} at index ${accountIndex}`);
    return;
  }

  const phone = account[phoneKey];
  const password = account[passwordKey];
  const role = account[roleKey];

  // Re-use authentication helper
  const auth = loginAndGetToken({ phone, password, role });
  
  if (!auth.token || !auth.validation.valid) {
    authGetMeFailure.add(1);
    authGetMeFailureRate.add(true);
    console.warn(`[GET_ME ABORT] Login authentication failed for phone ${phone}, skipping iteration.`);
    return;
  }

  const url = `${BASE_URL}/api/auth/me`;
  const params = {
    headers: Object.assign({}, DEFAULT_HEADERS, buildAuthHeader(auth.token)),
    timeout: REQUEST_TIMEOUT,
  };

  let res;
  try {
    res = http.get(url, params);
  } catch (err) {
    authGetMeFailure.add(1);
    authGetMeFailureRate.add(true);
    console.error(`[NETWORK EXCEPTION] GET /me failed for Phone: ${phone}, Role: ${role}. Error: ${err.message}`);
    return;
  }

  const duration = res.timings ? res.timings.duration : 0;
  const validation = validateGetMeResponse(res);

  // Validate that response phone matches credential phone if phone is returned in payload
  const resPhone = validation.valid && validation.data && validation.data.data ? validation.data.data.phone : null;
  const phoneMatches = resPhone ? String(resPhone).trim() === String(phone).trim() : true;

  // Map contract validations to K6 assertions checks
  const isOk = check(res, {
    'GetMe - status code is 200': (r) => r.status === 200,
    'GetMe - contract validations pass': () => validation.valid,
    'GetMe - role matches credentials': () => validation.valid && validation.data.data.role.toLowerCase() === role.toLowerCase(),
    'GetMe - phone matches credentials': () => phoneMatches,
  });

  if (isOk) {
    // Record Success Metrics
    authGetMeSuccess.add(1);
    authGetMeFailureRate.add(false);
    authGetMeDuration.add(duration);
  } else {
    // Record Failure Metrics
    authGetMeFailure.add(1);
    authGetMeFailureRate.add(true);
    authGetMeDuration.add(duration);

    // Limit failure body output to keep console logs readable
    const bodyPreview = res && res.body ? res.body.slice(0, 300) : 'No Response';

    // Secure diagnostic logging
    console.warn(
      `[GET_ME FAIL] Phone: ${phone}, Role: ${role}, Status: ${res ? res.status : 'None'}, ` +
      `Latency: ${duration}ms, Phone Match: ${phoneMatches}, Validation Errors: [${validation.errors.join(', ')}], ` +
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
