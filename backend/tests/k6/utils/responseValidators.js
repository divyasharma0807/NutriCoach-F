/**
 * K6 Testing Infrastructure - Pure Response Contract Validators
 * Responsibilities: Checks response payloads against expected API contracts.
 * Reusable across all scenarios. Does not trigger logs, network requests, or metrics.
 */

/**
 * Validates the response contract of POST /api/auth/login.
 * @param {object} res - K6 HTTP response object
 * @returns {{valid: boolean, errors: Array<string>}} Validation result
 */
export function validateLoginResponse(res) {
  const errors = [];
  let parsedData = null;

  if (!res) {
    errors.push('No response object received.');
    return { valid: false, errors, data: null };
  }

  if (res.status !== 200) {
    errors.push(`Expected HTTP status 200, got ${res.status}.`);
  }

  if (!res.body) {
    errors.push('Response body is empty.');
    return { valid: false, errors, data: null };
  }

  try {
    const data = JSON.parse(res.body);
    parsedData = data;

    if (data.success !== true) {
      errors.push(`Expected success flag to be true, got ${data.success}.`);
    }

    if (!data.message || typeof data.message !== 'string') {
      errors.push('Response message is missing or invalid.');
    }

    if (!data.data || typeof data.data !== 'object') {
      errors.push('Response data object is missing.');
    } else {
      if (!data.data.id || typeof data.data.id !== 'string') {
        errors.push('User id (data.id) is missing or invalid.');
      }
      if (!data.data.role || typeof data.data.role !== 'string') {
        errors.push('User role (data.role) is missing or invalid.');
      }
    }

    if (!data.token || typeof data.token !== 'string' || data.token.length === 0) {
      errors.push('Auth token string is missing or empty.');
    }
  } catch (err) {
    errors.push(`Response body is not valid JSON: ${err.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    data: parsedData,
  };
}

/**
 * Validates the response contract of GET /api/auth/me.
 * @param {object} res - K6 HTTP response object
 * @returns {{valid: boolean, errors: Array<string>, data: object|null}} Validation result
 */
export function validateGetMeResponse(res) {
  const errors = [];
  let parsedData = null;

  if (!res) {
    errors.push('No response object received.');
    return { valid: false, errors, data: null };
  }

  if (res.status !== 200) {
    errors.push(`Expected HTTP status 200, got ${res.status}.`);
  }

  if (!res.body) {
    errors.push('Response body is empty.');
    return { valid: false, errors, data: null };
  }

  try {
    const data = JSON.parse(res.body);
    parsedData = data;

    if (data.success !== true) {
      errors.push(`Expected success flag to be true, got ${data.success}.`);
    }

    if (!data.data || typeof data.data !== 'object') {
      errors.push('Response data object is missing.');
    } else {
      if (!data.data.id || typeof data.data.id !== 'string') {
        errors.push('User id (data.id) is missing or invalid.');
      }
      if (!data.data.role || typeof data.data.role !== 'string') {
        errors.push('User role (data.role) is missing or invalid.');
      }
    }
  } catch (err) {
    errors.push(`Response body is not valid JSON: ${err.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    data: parsedData,
  };
}

/**
 * Validates the core response contract of GET /api/clients/dashboard.
 * Checks status, JSON format, success flag, and presence of a data object.
 * Does not assert optional client collections like parameterHistory, measurementHistory, etc.
 * @param {object} res - K6 HTTP response object
 * @returns {{valid: boolean, errors: Array<string>, data: object|null}} Validation result
 */
export function validateClientDashboardResponse(res) {
  const errors = [];
  let parsedData = null;

  if (!res) {
    errors.push('No response object received.');
    return { valid: false, errors, data: null };
  }

  if (res.status !== 200) {
    errors.push(`Expected HTTP status 200, got ${res.status}.`);
  }

  if (!res.body) {
    errors.push('Response body is empty.');
    return { valid: false, errors, data: null };
  }

  try {
    const data = JSON.parse(res.body);
    parsedData = data;

    if (data.success !== true) {
      errors.push(`Expected success flag to be true, got ${data.success}.`);
    }

    if (!data.data || typeof data.data !== 'object') {
      errors.push('Response data object is missing.');
    }
  } catch (err) {
    errors.push(`Response body is not valid JSON: ${err.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    data: parsedData,
  };
}

/**
 * Validates the core response contract of GET /api/notifications.
 * Checks status, JSON format, success flag, and presence of a data array.
 * @param {object} res - K6 HTTP response object
 * @returns {{valid: boolean, errors: Array<string>, data: object|null}} Validation result
 */
export function validateNotificationsResponse(res) {
  const errors = [];
  let parsedData = null;

  if (!res) {
    errors.push('No response object received.');
    return { valid: false, errors, data: null };
  }

  if (res.status !== 200) {
    errors.push(`Expected HTTP status 200, got ${res.status}.`);
  }

  if (!res.body) {
    errors.push('Response body is empty.');
    return { valid: false, errors, data: null };
  }

  try {
    const data = JSON.parse(res.body);
    parsedData = data;

    if (data.success !== true) {
      errors.push(`Expected success flag to be true, got ${data.success}.`);
    }

    if (!Array.isArray(data.data)) {
      errors.push('Response data object is missing or is not an array.');
    }
  } catch (err) {
    errors.push(`Response body is not valid JSON: ${err.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    data: parsedData,
  };
}

/**
 * Validates the core response contract of GET /api/sessions.
 * Checks status, JSON format, success flag, and presence of a data array.
 * @param {object} res - K6 HTTP response object
 * @returns {{valid: boolean, errors: Array<string>, data: object|null}} Validation result
 */
export function validateSessionsResponse(res) {
  const errors = [];
  let parsedData = null;

  if (!res) {
    errors.push('No response object received.');
    return { valid: false, errors, data: null };
  }

  if (res.status !== 200) {
    errors.push(`Expected HTTP status 200, got ${res.status}.`);
  }

  if (!res.body) {
    errors.push('Response body is empty.');
    return { valid: false, errors, data: null };
  }

  try {
    const data = JSON.parse(res.body);
    parsedData = data;

    if (data.success !== true) {
      errors.push(`Expected success flag to be true, got ${data.success}.`);
    }

    if (!Array.isArray(data.data)) {
      errors.push('Response data object is missing or is not an array.');
    }
  } catch (err) {
    errors.push(`Response body is not valid JSON: ${err.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    data: parsedData,
  };
}

/**
 * Validates the core response contract of GET /api/coaches/dashboard.
 * Checks status, JSON format, success flag, and presence of a data object.
 * Resiliently checks optional dashboard arrays/objects type signatures if present.
 * @param {object} res - K6 HTTP response object
 * @returns {{valid: boolean, errors: Array<string>, data: object|null}} Validation result
 */
export function validateCoachDashboardResponse(res) {
  const errors = [];
  let parsedData = null;

  if (!res) {
    errors.push('No response object received.');
    return { valid: false, errors, data: null };
  }

  if (res.status !== 200) {
    errors.push(`Expected HTTP status 200, got ${res.status}.`);
  }

  if (!res.body) {
    errors.push('Response body is empty.');
    return { valid: false, errors, data: null };
  }

  try {
    const data = JSON.parse(res.body);
    parsedData = data;

    if (data.success !== true) {
      errors.push(`Expected success flag to be true, got ${data.success}.`);
    }

    if (!data.data || typeof data.data !== 'object') {
      errors.push('Response data object is missing.');
    } else {
      const d = data.data;
      
      // Resiliently validate type formats of optional properties if present
      if (d.stats !== undefined && (typeof d.stats !== 'object' || d.stats === null)) {
        errors.push('stats property is present but is not a valid object.');
      }
      if (d.clients !== undefined && !Array.isArray(d.clients)) {
        errors.push('clients property is present but is not a valid array.');
      }
      if (d.sessions !== undefined && !Array.isArray(d.sessions)) {
        errors.push('sessions property is present but is not a valid array.');
      }
      if (d.prospects !== undefined && !Array.isArray(d.prospects)) {
        errors.push('prospects property is present but is not a valid array.');
      }
      if (d.coaches !== undefined && !Array.isArray(d.coaches)) {
        errors.push('coaches property is present but is not a valid array.');
      }
      if (d.notifications !== undefined && !Array.isArray(d.notifications)) {
        errors.push('notifications property is present but is not a valid array.');
      }
      if (d.results !== undefined && !Array.isArray(d.results)) {
        errors.push('results property is present but is not a valid array.');
      }
      if (d.referrals !== undefined && !Array.isArray(d.referrals)) {
        errors.push('referrals property is present but is not a valid array.');
      }
      if (d.dietPlan !== undefined && (typeof d.dietPlan !== 'object' || d.dietPlan === null)) {
        errors.push('dietPlan property is present but is not a valid object.');
      }
    }
  } catch (err) {
    errors.push(`Response body is not valid JSON: ${err.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    data: parsedData,
  };
}

/**
 * Validates the core response contract of GET /api/diet-plans/my-plan.
 * Checks status, JSON format, success flag, and presence of a data object.
 * @param {object} res - K6 HTTP response object
 * @returns {{valid: boolean, errors: Array<string>, data: object|null}} Validation result
 */
export function validateDietPlanResponse(res) {
  const errors = [];
  let parsedData = null;

  if (!res) {
    errors.push('No response object received.');
    return { valid: false, errors, data: null };
  }

  if (res.status !== 200) {
    errors.push(`Expected HTTP status 200, got ${res.status}.`);
  }

  if (!res.body) {
    errors.push('Response body is empty.');
    return { valid: false, errors, data: null };
  }

  try {
    const data = JSON.parse(res.body);
    parsedData = data;

    if (data.success !== true) {
      errors.push(`Expected success flag to be true, got ${data.success}.`);
    }

    if (!data.data || typeof data.data !== 'object') {
      errors.push('Response data object is missing.');
    }
  } catch (err) {
    errors.push(`Response body is not valid JSON: ${err.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    data: parsedData,
  };
}

/**
 * Validates the core response contract of GET /api/referrals.
 * Checks status, JSON format, success flag, and presence of a data array.
 * @param {object} res - K6 HTTP response object
 * @returns {{valid: boolean, errors: Array<string>, data: object|null}} Validation result
 */
export function validateReferralsResponse(res) {
  const errors = [];
  let parsedData = null;

  if (!res) {
    errors.push('No response object received.');
    return { valid: false, errors, data: null };
  }

  if (res.status !== 200) {
    errors.push(`Expected HTTP status 200, got ${res.status}.`);
  }

  if (!res.body) {
    errors.push('Response body is empty.');
    return { valid: false, errors, data: null };
  }

  try {
    const data = JSON.parse(res.body);
    parsedData = data;

    if (data.success !== true) {
      errors.push(`Expected success flag to be true, got ${data.success}.`);
    }

    if (!Array.isArray(data.data)) {
      errors.push('Response data object is missing or is not an array.');
    }
  } catch (err) {
    errors.push(`Response body is not valid JSON: ${err.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    data: parsedData,
  };
}

/**
 * Validates the core response contract of GET /api/admin/dashboard.
 * Checks status, JSON format, success flag, and presence of a data object.
 * Resiliently checks optional dashboard arrays/objects type signatures if present.
 * @param {object} res - K6 HTTP response object
 * @returns {{valid: boolean, errors: Array<string>, data: object|null}} Validation result
 */
export function validateAdminDashboardResponse(res) {
  const errors = [];
  let parsedData = null;

  if (!res) {
    errors.push('No response object received.');
    return { valid: false, errors, data: null };
  }

  if (res.status !== 200) {
    errors.push(`Expected HTTP status 200, got ${res.status}.`);
  }

  if (!res.body) {
    errors.push('Response body is empty.');
    return { valid: false, errors, data: null };
  }

  try {
    const data = JSON.parse(res.body);
    parsedData = data;

    if (data.success !== true) {
      errors.push(`Expected success flag to be true, got ${data.success}.`);
    }

    if (!data.data || typeof data.data !== 'object') {
      errors.push('Response data object is missing.');
    } else {
      const d = data.data;

      // Resiliently validate type formats of optional properties if present
      if (d.stats !== undefined && (typeof d.stats !== 'object' || d.stats === null)) {
        errors.push('stats property is present but is not a valid object.');
      }
      if (d.coaches !== undefined && !Array.isArray(d.coaches)) {
        errors.push('coaches property is present but is not a valid array.');
      }
      if (d.clients !== undefined && !Array.isArray(d.clients)) {
        errors.push('clients property is present but is not a valid array.');
      }
      if (d.sessions !== undefined && !Array.isArray(d.sessions)) {
        errors.push('sessions property is present but is not a valid array.');
      }
      if (d.referrals !== undefined && !Array.isArray(d.referrals)) {
        errors.push('referrals property is present but is not a valid array.');
      }
      if (d.results !== undefined && !Array.isArray(d.results)) {
        errors.push('results property is present but is not a valid array.');
      }
      if (d.notifications !== undefined && !Array.isArray(d.notifications)) {
        errors.push('notifications property is present but is not a valid array.');
      }
      if (d.dietPlan !== undefined && (typeof d.dietPlan !== 'object' || d.dietPlan === null)) {
        errors.push('dietPlan property is present but is not a valid object.');
      }
    }
  } catch (err) {
    errors.push(`Response body is not valid JSON: ${err.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    data: parsedData,
  };
}

export default {
  validateLoginResponse,
  validateGetMeResponse,
  validateClientDashboardResponse,
  validateNotificationsResponse,
  validateSessionsResponse,
  validateCoachDashboardResponse,
  validateDietPlanResponse,
  validateReferralsResponse,
  validateAdminDashboardResponse,
};
