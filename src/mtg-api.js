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
export const fetchBoosterPack = async (setCode, slots = null) => {
  // Helper to fetch a raw card with specific constraints; returns raw Scryfall card
  const fetchRawCard = async ({ rarity = null, queryFoil = null, pool = null, type = null }) => {
    let query = `set:${setCode}`;
    if (rarity) query += ` rarity:${rarity}`;
    if (type) query += ` type:${type}`;
    if (pool === 'land') {
      // Land pool: caller will set rarity/type as needed; keep here as generic
      query += ` t:land`;
    }
    if (queryFoil === true) query += ` is:foil`;
    if (queryFoil === false) query += ` is:nonfoil`;

    try {
      const response = await fetch(`https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`);
      const card = await response.json();
      if (card && card.object !== 'error') {
        return card;
      }
    } catch (error) {
      console.warn(`Failed to fetch raw card with query "${query}":`, error);
    }
    // Fallback to generic random card if specific fetch fails
    try {
      const randomCardResponse = await fetch('https://api.scryfall.com/cards/random');
      const randomCard = await randomCardResponse.json();
      if (randomCard && randomCard.object !== 'error') {
        return randomCard;
      }
    } catch {}
    return null;
  };

  const pushIfCard = (arr, raw, explicitFoil = null) => {
    if (raw) arr.push(formatCardData(raw, explicitFoil));
  };

  // If slots provided, honor them; otherwise fall back to legacy 14-card logic
  if (Array.isArray(slots) && slots.length > 0) {
    const formatted = [];

    // Per-slot processing
    for (const slot of slots) {
      const count = typeof slot.count === 'function' ? Number(slot.count({})) : Number(slot.count || 0);
      for (let i = 0; i < count; i++) {
        // Resolve slot parameters
        let resolved = null;
        if (typeof slot.resolver === 'function') {
          try {
            resolved = slot.resolver({});
          } catch (e) {
            console.warn('Slot resolver error:', e);
          }
        }

        // Determine rarity via odds if provided
        let rarity = resolved?.rarity || null;
        if (!rarity && slot.odds && typeof slot.odds === 'object') {
          const entries = Object.entries(slot.odds);
          let r = Math.random();
          for (const [rar, weight] of entries) {
            r -= Number(weight) || 0;
            if (r <= 0) {
              rarity = rar;
              break;
            }
          }
          if (!rarity && entries.length > 0) {
            rarity = entries[entries.length - 1][0];
          }
        }
        // Fallback rarity based on pool
        if (!rarity && slot.pool && ['common','uncommon','rare','mythic'].includes(slot.pool)) {
          rarity = slot.pool;
        }

        // Determine foil flag
        const foil = typeof slot.foil === 'boolean' ? slot.foil : (resolved?.foil ?? null);

        // Determine type/pool-specific behavior
        let type = null;
        if (slot.pool === 'land' || resolved?.pool === 'land') {
          // Implement: 95% basic land from set, 5% non-basic land from set
          const pickBasic = Math.random() < 0.95;
          if (pickBasic) {
            // Basic lands are type:basic land; try within set
            const raw = await fetchRawCard({ rarity: null, queryFoil: foil, pool: 'land', type: 'basic' });
            pushIfCard(formatted, raw, foil);
          } else {
            // Non-basic land in set: t:land -t:basic
            let query = `set:${setCode} t:land -t:basic`;
            if (foil === true) query += ' is:foil';
            if (foil === false) query += ' is:nonfoil';
            try {
              const response = await fetch(`https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`);
              const card = await response.json();
              if (card && card.object !== 'error') {
                pushIfCard(formatted, card, foil);
              } else {
                // fallback to any land
                const fallback = await fetchRawCard({ rarity: null, queryFoil: foil, pool: 'land' });
                pushIfCard(formatted, fallback, foil);
              }
            } catch {
              const fallback = await fetchRawCard({ rarity: null, queryFoil: foil, pool: 'land' });
              pushIfCard(formatted, fallback, foil);
            }
          }
          continue; // land slot handled
        }

        // Wildcard or generic pool: use rarity if resolved/odds selected, otherwise any
        const raw = await fetchRawCard({
          rarity: rarity || null,
          queryFoil: foil,
          pool: slot.pool || resolved?.pool || null,
          type
        });
        pushIfCard(formatted, raw, foil);
      }
    }

    return formatted;
  }

  // Legacy fallback: 14-card construction similar to previous behavior
  const rawCards = [];
  const foilStatuses = [];

  // 7 Common cards
  for (let i = 0; i < 7; i++) {
    rawCards.push(await fetchRawCard({ rarity: 'common', queryFoil: false }));
    foilStatuses.push(false);
  }

  // 3 Uncommon cards
  for (let i = 0; i < 3; i++) {
    rawCards.push(await fetchRawCard({ rarity: 'uncommon', queryFoil: false }));
    foilStatuses.push(false);
  }

  // 1 Rare or Mythic Rare
  const isMythic = Math.random() < (1 / 7);
  rawCards.push(await fetchRawCard({ rarity: isMythic ? 'mythic' : 'rare', queryFoil: false }));
  foilStatuses.push(false);

  // Land slot: 95% basic in-set, 5% non-basic in-set
  const pickBasic = Math.random() < 0.95;
  if (pickBasic) {
    rawCards.push(await fetchRawCard({ rarity: null, queryFoil: null, pool: 'land', type: 'basic' }));
    foilStatuses.push(false);
  } else {
    // non-basic land in set
    try {
      const query = `set:${setCode} t:land -t:basic`;
      const response = await fetch(`https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`);
      const card = await response.json();
      if (card && card.object !== 'error') {
        rawCards.push(card);
        foilStatuses.push(false);
      } else {
        const fallback = await fetchRawCard({ rarity: null, queryFoil: false, pool: 'land' });
        rawCards.push(fallback);
        foilStatuses.push(false);
      }
    } catch {
      const fallback = await fetchRawCard({ rarity: null, queryFoil: false, pool: 'land' });
      rawCards.push(fallback);
      foilStatuses.push(false);
    }
  }

  // 1 Non-foil wildcard (any rarity)
  rawCards.push(await fetchRawCard({ rarity: null, queryFoil: false }));
  foilStatuses.push(false);

  // 1 Foil wildcard (any rarity)
  rawCards.push(await fetchRawCard({ rarity: null, queryFoil: true }));
  foilStatuses.push(true);

  // Format and pad/trim to 14
  let finalFormattedCards = [];
  for (let i = 0; i < rawCards.length; i++) {
    if (rawCards[i]) {
      finalFormattedCards.push(formatCardData(rawCards[i], foilStatuses[i]));
    }
  }
  while (finalFormattedCards.length < 14) {
    try {
      const randomCardResponse = await fetch('https://api.scryfall.com/cards/random');
      const randomCard = await randomCardResponse.json();
      if (randomCard && randomCard.object !== 'error') {
        finalFormattedCards.push(formatCardData(randomCard, false));
      } else {
        finalFormattedCards.push({
          id: `placeholder_${Date.now()}_${Math.random()}`,
          name: 'Placeholder Card',
          rarity: 'common',
          image: 'https://placehold.co/200x280/cccccc/000000?text=Error',
          foil: false,
          type: 'unknown'
        });
      }
    } catch {
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
  
  // Get price with foil handling: prefer usd_foil for foil cards, fallback to usd
  let price = 0;
  if (card.prices) {
    const rawFoil = typeof card.prices.usd_foil === 'string' ? parseFloat(card.prices.usd_foil) : NaN;
    const rawUsd = typeof card.prices.usd === 'string' ? parseFloat(card.prices.usd) : NaN;
    const isFoil = explicitFoil !== null ? explicitFoil : (card.foil || false);

    if (isFoil && !isNaN(rawFoil)) {
      price = rawFoil;
    } else if (!isNaN(rawUsd)) {
      price = rawUsd;
    } else if (!isNaN(rawFoil)) {
      // As a last resort, if usd is missing but usd_foil exists (and even if card isn't marked foil), use it
      price = rawFoil;
    } else {
      price = 0;
    }
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
