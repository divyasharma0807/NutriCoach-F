/**
 * Seeding Engine Logger
 * Standardizes log formatting and timestamps across the seeding pipeline.
 */

const getTimestamp = () => {
  return new Date().toISOString();
};

export const logger = {
  info: (message) => {
    console.log(`[${getTimestamp()}] INFO: ${message}`);
  },
  success: (message) => {
    console.log(`[${getTimestamp()}] ✓ ${message}`);
  },
  warn: (message) => {
    console.warn(`[${getTimestamp()}] ⚠ ${message}`);
  },
  error: (message, err = null) => {
    console.error(`[${getTimestamp()}] ✗ ${message}`);
    if (err) {
      console.error(err);
    }
  },
  divider: () => {
    console.log('==================================================');
  }
};

export default logger;
