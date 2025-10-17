/**
 * @fileoverview Centralized logging utility with environment-aware output
 * Production logs are suppressed for debug/info, only warnings and errors are shown
 * 
 * @module utils/logger
 */

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

/**
 * Structured logger with environment-aware output
 * In production, only warnings and errors are logged
 * In development, all levels are logged
 */
export const logger = {
  /**
   * Debug-level logging (development only)
   * @param {...any} args - Arguments to log
   */
  debug: (...args) => {
    if (isDev) {
      console.debug('[DEBUG]', ...args);
    }
  },

  /**
   * Info-level logging (development only)
   * @param {...any} args - Arguments to log
   */
  info: (...args) => {
    if (isDev) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Warning-level logging (all environments)
   * @param {...any} args - Arguments to log
   */
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error-level logging (all environments)
   * @param {...any} args - Arguments to log
   */
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Performance logging (development only)
   * @param {string} label - Performance mark label
   * @param {number} duration - Duration in milliseconds
   */
  perf: (label, duration) => {
    if (isDev) {
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    }
  },

  /**
   * Create a scoped logger for a specific module
   * @param {string} scope - Module or component name
   * @returns {Object} Scoped logger instance
   */
  scope: (scope) => ({
    debug: (...args) => logger.debug(`[${scope}]`, ...args),
    info: (...args) => logger.info(`[${scope}]`, ...args),
    warn: (...args) => logger.warn(`[${scope}]`, ...args),
    error: (...args) => logger.error(`[${scope}]`, ...args),
  }),
};

export default logger;

