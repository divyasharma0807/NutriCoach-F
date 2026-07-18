/**
 * K6 Testing Infrastructure - Generic CSV Utilities
 * Pure javascript helpers to parse CSV text content and search rows.
 * Note: File loading must be called at global scope in K6, and the raw text passed here.
 */

/**
 * Parses raw CSV string content into an array of row objects.
 * Automatically uses the first line as object property headers.
 * Supports quote-enclosures and comma splits.
 * @param {string} rawContent - Raw text content
 * @param {string} delimiter - Delimiter character (default: ',')
 * @returns {Array<object>} Array of parsed row objects
 */
export function parseCSV(rawContent, delimiter = ',') {
  if (!rawContent) return [];

  const lines = rawContent.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  // Parse header line (stripping enclosing quotes)
  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    const values = [];
    let insideQuote = false;
    let valBuffer = '';

    for (let j = 0; j < row.length; j++) {
      const char = row[j];
      if (char === '"' || char === "'") {
        insideQuote = !insideQuote;
      } else if (char === delimiter && !insideQuote) {
        values.push(valBuffer.trim().replace(/^["']|["']$/g, ''));
        valBuffer = '';
      } else {
        valBuffer += char;
      }
    }
    values.push(valBuffer.trim().replace(/^["']|["']$/g, ''));

    const rowObj = {};
    headers.forEach((header, index) => {
      rowObj[header] = values[index] !== undefined ? values[index] : '';
    });
    records.push(rowObj);
  }

  return records;
}

/**
 * Returns rows matching specific column filters.
 * @param {Array<object>} records - Array of parsed objects
 * @param {string} key - Target header/property key
 * @param {any} value - Value to match
 * @returns {Array<object>} Filtered row objects
 */
export function findRows(records, key, value) {
  if (!records || !key) return [];
  const targetStr = String(value).trim().toLowerCase();
  return records.filter((r) => String(r[key]).trim().toLowerCase() === targetStr);
}

/**
 * Returns a random row from the parsed array.
 * @param {Array<object>} records
 * @returns {object|null}
 */
export function getRandomRow(records) {
  if (!records || records.length === 0) return null;
  const index = Math.floor(Math.random() * records.length);
  return records[index];
}

export default {
  parseCSV,
  findRows,
  getRandomRow,
};
