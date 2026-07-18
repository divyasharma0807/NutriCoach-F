/**
 * K6 Testing Infrastructure - Generic Authentication Helpers
 * Provides reusable header, cookie, extraction, and active authentication methods.
 */

import http from 'k6/http';
import { BASE_URL, REQUEST_TIMEOUT, DEFAULT_HEADERS } from '../config/config.js';
import { validateLoginResponse } from './responseValidators.js';

/**
 * Formats a raw JWT token string into a standard Bearer token.
 * @param {string} token
 * @returns {string} Formatted Bearer token
 */
export function formatBearerToken(token) {
  if (!token) return '';
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

/**
 * Builds an Authorization header mapping with Bearer token.
 * @param {string} token
 * @returns {object} Header map containing Authorization key
 */
export function buildAuthHeader(token) {
  if (!token) return {};
  return {
    'Authorization': formatBearerToken(token),
  };
}

/**
 * Builds a Cookie header mapping.
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @returns {object} Header map containing Cookie key
 */
export function buildCookieHeader(name, value) {
  if (!name || !value) return {};
  return {
    'Cookie': `${name}=${value}`,
  };
}

/**
 * Safely extracts a token from response body JSON properties or HTTP Set-Cookie headers.
 * Supports dot notation for nested keys (e.g. 'data.token').
 * @param {object} res - K6 response object
 * @param {string} keyPath - Target property key or cookie name
 * @returns {string|null} Extracted token value
 */
export function extractTokenFromResponse(res, keyPath = 'token') {
  if (!res || !res.body) return null;

  // Try parsing response body as JSON
  try {
    const data = JSON.parse(res.body);
    const keys = keyPath.split('.');
    let value = data;
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        value = null;
        break;
      }
    }
    if (value) return value;
  } catch (e) {
    // Fail-safe fallback to cookie headers search
  }

  // Fallback: search cookie headers
  if (res.headers) {
    const setCookie = res.headers['Set-Cookie'] || res.headers['set-cookie'];
    if (setCookie) {
      const match = setCookie.match(new RegExp(`${keyPath}=([^;]+)`));
      if (match && match[1]) {
        return match[1];
      }
    }
  }

  return null;
}

/**
 * Reusable login authentication helper.
 * Fires a POST request to login the user and returns the token and data.
 * @param {object} credentials - User credentials object ({ phone, password, role })
 * @returns {object} Auth payload ({ token, user, response, duration })
 */
export function loginAndGetToken(credentials) {
  const { phone, password, role } = credentials || {};
  const url = `${BASE_URL}/api/auth/login`;
  
  const payload = JSON.stringify({
    phone,
    password,
    role: role ? role.toLowerCase() : '',
  });

  const params = {
    headers: Object.assign({}, DEFAULT_HEADERS),
    timeout: REQUEST_TIMEOUT,
  };

  let response;
  try {
    response = http.post(url, payload, params);
  } catch (err) {
    // Gracefully propagate connection errors
    return {
      token: null,
      user: null,
      response: { status: 0, body: err.message, timings: { duration: 0 } },
      duration: 0,
      validation: { valid: false, errors: [err.message], data: null },
    };
  }

  const duration = response.timings ? response.timings.duration : 0;
  const validation = validateLoginResponse(response);
  const token = extractTokenFromResponse(response);
  const user = (validation.valid && validation.data) ? validation.data.data : null;

  return {
    token,
    user,
    response,
    duration,
    validation,
  };
}

export default {
  formatBearerToken,
  buildAuthHeader,
  buildCookieHeader,
  extractTokenFromResponse,
  loginAndGetToken,
};
