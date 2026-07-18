/**
 * K6 Testing Infrastructure - Generic Response Validation Checks
 * Wraps K6 assertions for status codes and response headers.
 */

import { check } from 'k6';

/**
 * Asserts response status code, body presence, and JSON headers.
 * @param {object} res - K6 HTTP response object
 * @param {string} label - Context prefix label for reports
 * @param {number} expectedStatus - Target HTTP code (default: 200)
 * @returns {boolean} Check success status
 */
export function checkResponse(res, label, expectedStatus = 200) {
  if (!res) return false;

  return check(res, {
    [`${label} - status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
    [`${label} - body is not empty`]: (r) => r.body && r.body.length > 0,
    [`${label} - response content-type is json`]: (r) => {
      const contentType = r.headers['Content-Type'] || r.headers['content-type'] || '';
      return contentType.includes('application/json');
    },
  });
}

export default {
  checkResponse,
};
