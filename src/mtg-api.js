/**
 * MTG API utility functions for fetching real card data using direct fetch calls
 */

// Cache for storing fetched cards to avoid repeated API calls
const cardCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches a random card from Scryfall API
 * @returns {Promise<Object>} Card data object
 */
export const fetchRandomCard = async () => {
  try {
    const response = await fetch('https://api.scryfall.com/cards/random');
    const card = await response.json();
    return formatCardData(card);
  } catch (error) {
    console.error('Error fetching random card:', error);
    return null;
  }
};

/**
 * Fetches cards by set code from Scryfall API
 * @param {string} setCode - The set code (e.g., 'mm2', 'znr')
 * @param {number} count - Number of cards to fetch
 * @returns {Promise<Array>} Array of card objects
 */
export const fetchCardsBySet = async (setCode, count = 15) => {
  try {
    // Check if we have cached results
    const cacheKey = `set_${setCode}_${count}`;
    const cached = cardCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // Fetch cards from the specified set
    const response = await fetch(`https://api.scryfall.com/cards/search?q=set:${setCode}`);
    const result = await response.json();
    
    // Take only the requested number of cards
    const cards = result.data.slice(0, count).map(formatCardData);
    
    // Cache the results
    cardCache.set(cacheKey, {
      data: cards,
      timestamp: Date.now()
    });
    
    return cards;
  } catch (error) {
    console.error(`Error fetching cards for set ${setCode}:`, error);
    return [];
  }
};

/**
 * Fetches a booster pack worth of cards from a specific set
 * @param {string} setCode - The set code
 * @returns {Promise<Array>} Array of 15 cards representing a booster pack
 */
export const fetchBoosterPack = async (setCode) => {
  const rawCards = [];
  const foilStatuses = []; // To store the intended foil status for each card

  // Helper to fetch a raw card with specific rarity, foil status, and type
  // This helper will now return the raw Scryfall card object
  const fetchRawCard = async (rarity, queryFoil = null, type = null) => {
    let query = `set:${setCode}`;
    if (rarity) query += ` rarity:${rarity}`;
    if (type) query += ` type:${type}`;
    if (queryFoil === true) query += ` is:foil`;
    if (queryFoil === false) query += ` is:nonfoil`;

    try {
      const response = await fetch(`https://api.scryfall.com/cards/random?q=${query}`);
      const card = await response.json();
      if (card && card.object !== 'error') {
        return card;
      }
    } catch (error) {
      console.warn(`Failed to fetch raw card with query "${query}":`, error);
    }
    // Fallback to generic random card if specific fetch fails
    const randomCardResponse = await fetch('https://api.scryfall.com/cards/random');
    const randomCard = await randomCardResponse.json();
    if (randomCard && randomCard.object !== 'error') {
      return randomCard;
    }
    return null;
  };

  // 7 Common cards
  for (let i = 0; i < 7; i++) {
    rawCards.push(await fetchRawCard('common'));
    foilStatuses.push(false); // Commons are non-foil
  }

  // 3 Uncommon cards
  for (let i = 0; i < 3; i++) {
    rawCards.push(await fetchRawCard('uncommon'));
    foilStatuses.push(false); // Uncommons are non-foil
  }

  // 1 Rare or Mythic Rare
  const isMythic = Math.random() < (1 / 7);
  rawCards.push(await fetchRawCard(isMythic ? 'mythic' : 'rare'));
  foilStatuses.push(false); // Rare/Mythic slot is non-foil by default

  // 1 Land (20% chance of being foil)
  const isLandFoil = Math.random() < 0.2;
  rawCards.push(await fetchRawCard(null, isLandFoil, 'basic'));
  foilStatuses.push(isLandFoil);

  // 1 Non-foil wildcard (any rarity)
  rawCards.push(await fetchRawCard(null, false));
  foilStatuses.push(false);

  // 1 Foil wildcard (any rarity)
  rawCards.push(await fetchRawCard(null, true));
  foilStatuses.push(true);

  // Filter out any nulls from failed fetches and ensure 14 cards
  let finalFormattedCards = [];
  for (let i = 0; i < rawCards.length; i++) {
    if (rawCards[i]) {
      finalFormattedCards.push(formatCardData(rawCards[i], foilStatuses[i]));
    }
  }

  // Pad with random cards if less than 14 (shouldn't happen often with fallbacks)
  while (finalFormattedCards.length < 14) {
    // For padding, just fetch a random card and assume non-foil
    const randomCardResponse = await fetch('https://api.scryfall.com/cards/random');
    const randomCard = await randomCardResponse.json();
    if (randomCard && randomCard.object !== 'error') {
      finalFormattedCards.push(formatCardData(randomCard, false));
    } else {
      // If even random fails, use a placeholder
      finalFormattedCards.push({
        id: `placeholder_${Date.now()}_${Math.random()}`,
        name: 'Placeholder Card',
        rarity: 'common',
        image: 'https://placehold.co/200x280/cccccc/000000?text=Error',
        foil: false,
        type: 'unknown'
      });
    }
  }

  // Trim to exactly 14 cards
  finalFormattedCards = finalFormattedCards.slice(0, 14);

  return finalFormattedCards;
};

/**
 * Formats Scryfall card data to match our application's expected structure
 * @param {Object} card - Raw card data from Scryfall API
 * @param {boolean} explicitFoil - Optional: Force the foil status of the card
 * @returns {Object} Formatted card object
 */
const formatCardData = (card, explicitFoil = null) => {
  if (!card) return null;
  
  // Determine rarity (Scryfall uses different terms)
  let rarity = 'common';
  if (card.rarity) {
    switch (card.rarity.toLowerCase()) {
      case 'common':
        rarity = 'common';
        break;
      case 'uncommon':
        rarity = 'uncommon';
        break;
      case 'rare':
        rarity = 'rare';
        break;
      case 'mythic':
      case 'mythic rare':
        rarity = 'mythic';
        break;
      default:
        rarity = 'common';
    }
  }
  
  // Get image URL (prefer normal size, fallback to large)
  let imageUrl = '';
  let cardFaces = null;

  if (card.card_faces && card.card_faces.length === 2 && card.card_faces[0].image_uris && card.card_faces[1].image_uris) {
    // Handle double-sided cards
    imageUrl = card.card_faces[0].image_uris.normal || card.card_faces[0].image_uris.large;
    cardFaces = [
      card.card_faces[0].image_uris.normal || card.card_faces[0].image_uris.large,
      card.card_faces[1].image_uris.normal || card.card_faces[1].image_uris.large
    ];
  } else if (card.image_uris) {
    // Handle single-faced cards
    imageUrl = card.image_uris.normal || card.image_uris.large || card.image_uris.small || '';
  }
  
  // Fallback to placeholder if no image
  if (!imageUrl) {
    imageUrl = `https://placehold.co/200x280/${getRarityColor(rarity).replace('#', '')}/ffffff?text=${card.name || 'MTG Card'}`;
  }
  
  // Get price (USD)
  let price = 0;
  if (card.prices && card.prices.usd) {
    price = parseFloat(card.prices.usd) || 0;
  }
  
  // Generate a unique ID for each card instance to handle duplicates properly
  // This ensures each physical card can be flipped independently
  const uniqueInstanceId = `${card.id || Math.random().toString(36).substr(2, 9)}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: uniqueInstanceId,
    originalId: card.id, // Keep original ID for reference
    name: card.name || 'Unknown Card',
    rarity: rarity,
    image: imageUrl,
    card_faces: cardFaces,
    price: price,
    type: card.type_line || 'Unknown',
    set: card.set_name || 'Unknown Set',
    setCode: card.set || 'Unknown', // Add setCode to formatted card data
    collectorNumber: card.collector_number || '',
    foil: explicitFoil !== null ? explicitFoil : (card.foil || false)
  };
};

/**
 * Gets the hex color for a given card rarity (copied from utils.js for consistency)
 * @param {string} rarity - The card rarity
 * @returns {string} The hex color code
 */
const getRarityColor = (rarity) => {
  const rarityColors = {
    common: '#999999',
    uncommon: '#33cc33',
    rare: '#ffcc00',
    mythic: '#ff6600'
  };
  return rarityColors[rarity] || rarityColors.common;
};

/**
 * Gets card price category for sorting/filtering
 * @param {number} price - Card price in USD
 * @returns {string} Price category
 */
export const getPriceCategory = (price) => {
  if (price === 0) return 'free';
  if (price < 1) return 'cheap';
  if (price < 5) return 'medium';
  if (price < 20) return 'expensive';
  return 'premium';
};
