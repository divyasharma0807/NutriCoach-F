/**
 * K6 Testing Infrastructure - Miscellaneous Helper Utilities
 * Provides sleep pacing and random helpers.
 */

import { sleep } from 'k6';

/**
 * Suspends iteration execution for a randomized duration to model think-time.
 * @param {number} min - Minimum seconds (default: 1)
 * @param {number} max - Maximum seconds (default: 3)
 */
export function sleepRandom(min = 1, max = 3) {
  const duration = Math.random() * (max - min) + min;
  sleep(duration);
}

/**
 * Returns a random element from an array.
 * @param {Array} arr
 * @returns {any|null}
 */
export function getRandomItem(arr) {
  if (!arr || arr.length === 0) return null;
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

export default {
  sleepRandom,
  getRandomItem,
};
