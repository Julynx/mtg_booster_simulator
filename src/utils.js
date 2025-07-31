/**
 * Utility functions for MTG Booster Simulator.
 * Provides color mappings and other helper functions.
 */

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
