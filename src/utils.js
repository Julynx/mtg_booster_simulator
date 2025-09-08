

/**
 * Utility functions for MTG Booster Simulator.
 * Provides color mappings and other helper functions.
 */

/**
 * Loads booster pack data from the boosters.json file.
 * @returns {Promise<Object>} An object where keys are booster codes and values are booster pack details.
 */
import { BOOSTERS } from './data/boosters';

/**
 * Loads booster pack data from the boosters module.
 * @returns {Promise<Object>} An object where keys are booster codes (lowercase) and values are booster pack details.
 */
export const loadBoosters = async () => {
  try {
    // BOOSTERS is a static array; map to the object shape used by the app
    const boostersObject = BOOSTERS.reduce((acc, booster) => {
      acc[booster.code.toLowerCase()] = {
        name: booster.name,
        image: `${process.env.PUBLIC_URL}/assets/${booster.image}`,
        price: booster.price,
        setCode: booster.code,
        // expose slot config so per-pack odds/logic can be customized
        slots: booster.slots
      };
      return acc;
    }, {});
    return boostersObject;
  } catch (error) {
    console.error('Error loading boosters:', error);
    return {};
  }
};

/**
 * Gets the hex color for a given card rarity.
 * 
 * @param {string} rarity - The card rarity ('common', 'uncommon', 'rare', 'mythic')
 * @returns {string} The hex color code for the rarity
 */
export const getRarityColor = (rarity) => {
  const rarityColors = {
    common: '#999999',
    uncommon: '#33cc33',
    rare: '#ffcc00',
    mythic: '#ff6600'
  };

  return rarityColors[rarity] || rarityColors.common;
};

/**
 * Gets the rgba color for a given card rarity (used for aura effects).
 * 
 * @param {string} rarity - The card rarity ('common', 'uncommon', 'rare', 'mythic')
 * @returns {string} The rgba color code for the rarity
 */
export const getAuraColor = (rarity) => {
  const auraColors = {
    common: 'rgba(153, 153, 153, 0.6)',
    uncommon: 'rgba(51, 204, 51, 0.6)',
    rare: 'rgba(255, 204, 0, 0.6)',
    mythic: 'rgba(255, 102, 0, 0.6)'
  };

  return auraColors[rarity] || auraColors.common;
};

/**
 * Validates if a given rarity is valid.
 * 
 * @param {string} rarity - The rarity to validate
 * @returns {boolean} Whether the rarity is valid
 */
export const isValidRarity = (rarity) => {
  const validRarities = ['common', 'uncommon', 'rare', 'mythic'];
  return validRarities.includes(rarity);
};

/**
 * Validates card data structure.
 * @param {object} card - The card object to validate
 * @returns {boolean} Whether the card is valid
 */
export const validateCard = (card) => {
  if (!card) return false;
  if (typeof card.id === 'undefined') return false;
  if (!card.name || typeof card.name !== 'string') return false;
  if (!card.rarity || typeof card.rarity !== 'string') return false;
  if (!card.image || typeof card.image !== 'string') return false;
  return true;
};

/**
 * Enhanced logging utility for debugging crashes and performance issues
 */
export const logger = {
  log: (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    if (data) {
      console.log(logEntry, data);
    } else {
      console.log(logEntry);
    }
  },

  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ERROR: ${message}`;
    if (error) {
      console.error(logEntry, error);
    } else {
      console.error(logEntry);
    }
  },

  warn: (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] WARNING: ${message}`;
    if (data) {
      console.warn(logEntry, data);
    } else {
      console.warn(logEntry);
    }
  },

  performance: (operation, startTime) => {
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] PERFORMANCE: ${operation} took ${duration}ms`);
  }
};

/**
 * Performance monitoring utility
 */
export const performanceMonitor = {
  start: (operation) => {
    const startTime = Date.now();
    logger.log(`Starting ${operation}`);
    return startTime;
  },

  end: (operation, startTime) => {
    logger.performance(operation, startTime);
  },

  measure: async (operation, asyncFn) => {
    const startTime = performanceMonitor.start(operation);
    try {
      const result = await asyncFn();
      performanceMonitor.end(operation, startTime);
      return result;
    } catch (error) {
      performanceMonitor.end(operation, startTime);
      logger.error(`${operation} failed`, error);
      throw error;
    }
  }
};
