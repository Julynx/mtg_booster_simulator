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
  try {
    console.log(`Fetching booster pack for set: ${setCode}`);
    
    // Generate completely fresh random cards each time to ensure true randomness
    console.log('Generating fresh random booster pack...');
    
    // Fetch a completely random booster pack using the random card endpoint
    const cards = [];
    const totalCards = 15;
    
    // Define booster pack distribution (typical MTG booster)
    const cardDistribution = {
      common: 10,
      uncommon: 3,
      rare: 1,
      mythic: 1
    };
    
    // Fetch cards for each rarity
    for (const [rarity, count] of Object.entries(cardDistribution)) {
      for (let i = 0; i < count; i++) {
        try {
          // Fetch a random card from the specific set with the required rarity
          const response = await fetch(`https://api.scryfall.com/cards/random?q=set:${setCode} rarity:${rarity}`);
          const card = await response.json();
          if (card) {
            cards.push(card);
            console.log(`Added ${rarity} card: ${card.name}`);
          }
        } catch (error) {
          console.warn(`Failed to fetch random ${rarity} card, trying generic random card...`, error);
          // Fallback to completely random card
          const randomCard = await fetchRandomCard();
          if (randomCard) {
            cards.push(randomCard);
          }
        }
      }
    }
    
    // Format all cards
    let formattedCards = cards.map(formatCardData).filter(card => card !== null);
    console.log('Formatted cards:', formattedCards.length);
    
    // Ensure we have exactly 15 cards (pad with more random cards if needed)
    if (formattedCards.length < 15) {
      const needed = 15 - formattedCards.length;
      console.log(`Need ${needed} more cards, fetching additional random cards...`);
      for (let i = 0; i < needed; i++) {
        const randomCard = await fetchRandomCard();
        if (randomCard) {
          formattedCards.push(randomCard);
        }
      }
    }
    
    // Ensure we have exactly 15 cards (trim if too many)
    formattedCards = formattedCards.slice(0, 15);
    
    console.log('Returning formatted cards:', formattedCards);
    return formattedCards;
  } catch (error) {
    console.error(`Error fetching booster pack for set ${setCode}:`, error);
    // Fallback to fetching individual cards
    return fetchCardsBySet(setCode, 15);
  }
};

/**
 * Formats Scryfall card data to match our application's expected structure
 * @param {Object} card - Raw card data from Scryfall API
 * @returns {Object} Formatted card object
 */
const formatCardData = (card) => {
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
  if (card.image_uris) {
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
    price: price,
    type: card.type_line || 'Unknown',
    set: card.set_name || 'Unknown Set',
    collectorNumber: card.collector_number || '',
    foil: card.foil || false
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
