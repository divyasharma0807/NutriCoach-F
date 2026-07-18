/**
 * K6 Testing Infrastructure - Summary Reporter Helper
 * Builds stdout printout alongside summary.html and summary.json outputs.
 * Respects toggle settings inside config.js.
 */

import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { ENABLE_HTML_REPORT, ENABLE_JSON_REPORT } from '../config/config.js';

/**
 * Builds the handleSummary output mapping for K6 scenarios.
 * @param {object} data - K6 metrics summary structure
 * @returns {object} Summary reports output map
 */
export function generateSummary(data) {
  const reports = {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };

  if (ENABLE_HTML_REPORT) {
    reports['tests/k6/reports/summary.html'] = htmlReport(data);
  }

  if (ENABLE_JSON_REPORT) {
    reports['tests/k6/reports/summary.json'] = JSON.stringify(data, null, 2);
  }

  return reports;
}

export default {
  generateSummary,
};
