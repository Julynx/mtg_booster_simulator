/**
 * MTG API utility functions for fetching real card data using direct fetch calls
 */

import { logger } from './utils';

// Cache for storing fetched cards to avoid repeated API calls
const cardCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches a random card from Scryfall API
 * @returns {Promise<Object>} Card data object
 */
export const fetchRandomCard = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch('https://api.scryfall.com/cards/random', {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const card = await response.json();
    return formatCardData(card);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Request timed out while fetching random card');
    } else {
      console.error('Error fetching random card:', error);
    }
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    // Fetch cards from the specified set
    const response = await fetch(`https://api.scryfall.com/cards/search?q=set:${setCode}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.data || !Array.isArray(result.data)) {
      throw new Error('Invalid response format from Scryfall API');
    }

    // Take only the requested number of cards
    const cards = result.data.slice(0, count).map(formatCardData);

    // Cache the results
    cardCache.set(cacheKey, {
      data: cards,
      timestamp: Date.now()
    });

    return cards;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`Request timed out while fetching cards for set ${setCode}`);
    } else {
      console.error(`Error fetching cards for set ${setCode}:`, error);
    }
    return [];
  }
};

/**
 * Fetches a booster pack worth of cards from a specific set
 * @param {string} setCode - The set code
 * @returns {Promise<Array>} Array of 15 cards representing a booster pack
 */
export const fetchBoosterPack = async (setCode, slots = null) => {
  const operationId = `fetchBoosterPack_${setCode}_${Date.now()}`;
  logger.log(`Starting booster pack fetch`, { setCode, operationId, hasSlots: !!slots });

  // Helper to fetch a raw card with specific constraints; returns raw Scryfall card
  const fetchRawCard = async ({ rarity = null, queryFoil = undefined, pool = null, type = null }) => {
    let query = `set:${setCode}`;
    if (rarity) query += ` rarity:${rarity}`;
    if (type) query += ` type:${type}`;
    if (pool === 'land') {
      query += ` t:land`;
    }
    // Only constrain foil if explicitly requested
    if (queryFoil === true) query += ` is:foil`;
    if (queryFoil === false) query += ` is:nonfoil`;

    // LOG the composed query for debugging foil issues
    console.log('[mtg-api] fetchRawCard query:', {
      setCode,
      rarity,
      type,
      pool,
      queryFoil,
      finalQuery: query
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(`https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const card = await response.json();
      console.log('[mtg-api] fetchRawCard response:', {
        ok: !!card && card.object !== 'error',
        finishes: card?.finishes,
        foilField: card?.foil,
        nonfoilField: card?.nonfoil,
        rarity: card?.rarity,
        name: card?.name,
        id: card?.id
      });
      if (card && card.object !== 'error') {
        return card;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`Request timed out for query "${query}"`);
      } else {
        console.warn(`Failed to fetch raw card with query "${query}":`, error);
      }
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for fallback

      const randomCardResponse = await fetch('https://api.scryfall.com/cards/random', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!randomCardResponse.ok) {
        throw new Error(`HTTP ${randomCardResponse.status}: ${randomCardResponse.statusText}`);
      }

      const randomCard = await randomCardResponse.json();
      console.log('[mtg-api] fetchRawCard fallback /cards/random response:', {
        ok: !!randomCard && randomCard.object !== 'error',
        finishes: randomCard?.finishes,
        foilField: randomCard?.foil,
        nonfoilField: randomCard?.nonfoil,
        rarity: randomCard?.rarity,
        name: randomCard?.name,
        id: randomCard?.id
      });
      if (randomCard && randomCard.object !== 'error') {
        return randomCard;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Fallback request timed out');
      } else {
        console.warn('Fallback request failed:', error);
      }
    }
    return null;
  };

  const pushIfCard = (arr, raw, explicitFoil = null) => {
    if (raw) arr.push(formatCardData(raw, explicitFoil));
  };

  // If slots provided, honor them; otherwise, refuse legacy fallback to avoid inconsistent pack sizes.
  if (Array.isArray(slots) && slots.length > 0) {
    const formatted = [];
    console.log('[mtg-api] fetchBoosterPack per-slot mode enabled. slots:', slots);

    for (const slot of slots) {
      const count = typeof slot.count === 'function' ? Number(slot.count({})) : Number(slot.count || 0);
      for (let i = 0; i < count; i++) {
        let resolved = null;
        if (typeof slot.resolver === 'function') {
          try { resolved = slot.resolver({}); } catch (e) { console.warn('Slot resolver error:', e); }
        }

        let rarity = resolved?.rarity || null;
        if (!rarity && slot.odds && typeof slot.odds === 'object') {
          const entries = Object.entries(slot.odds);
          let r = Math.random();
          for (const [rar, weight] of entries) {
            r -= Number(weight) || 0;
            if (r <= 0) { rarity = rar; break; }
          }
          if (!rarity && entries.length > 0) rarity = entries[entries.length - 1][0];
        }
        if (!rarity && slot.pool && ['common','uncommon','rare','mythic'].includes(slot.pool)) {
          rarity = slot.pool;
        }

        // Only set foil if slot explicitly defines it (boolean) or resolver returned it (boolean).
        // Otherwise, leave undefined so API does not force foil/nonfoil.
        const hasExplicitFoil = typeof slot.foil === 'boolean' || typeof resolved?.foil === 'boolean';
        const foilFlag = typeof resolved?.foil === 'boolean' ? resolved.foil :
                         typeof slot.foil === 'boolean' ? slot.foil : undefined;

        if (slot.pool === 'land' || resolved?.pool === 'land') {
          console.log('[mtg-api] slot land:', { resolved, slot, foilFlag, rarity });
          const pickBasic = Math.random() < 0.95;
          if (pickBasic) {
            const raw = await fetchRawCard({ rarity: null, queryFoil: foilFlag, pool: 'land', type: 'basic' });
            pushIfCard(formatted, raw, hasExplicitFoil ? foilFlag : null);
          } else {
            let query = `set:${setCode} t:land -t:basic`;
            if (foilFlag === true) query += ' is:foil';
            if (foilFlag === false) query += ' is:nonfoil';
            console.log('[mtg-api] land non-basic query:', { finalQuery: query, foilFlag });
            try {
              const response = await fetch(`https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`);
              const card = await response.json();
              console.log('[mtg-api] land non-basic response:', {
                ok: !!card && card.object !== 'error',
                finishes: card?.finishes,
                foilField: card?.foil,
                nonfoilField: card?.nonfoil,
                name: card?.name,
                id: card?.id
              });
              if (card && card.object !== 'error') {
                pushIfCard(formatted, card, hasExplicitFoil ? foilFlag : null);
              } else {
                const fallback = await fetchRawCard({ rarity: null, queryFoil: foilFlag, pool: 'land' });
                pushIfCard(formatted, fallback, hasExplicitFoil ? foilFlag : null);
              }
            } catch (e) {
              console.warn('[mtg-api] land non-basic error:', e);
              const fallback = await fetchRawCard({ rarity: null, queryFoil: foilFlag, pool: 'land' });
              pushIfCard(formatted, fallback, hasExplicitFoil ? foilFlag : null);
            }
          }
          continue;
        }

        console.log('[mtg-api] slot generic/wildcard request:', {
          rarity,
          pool: slot.pool || resolved?.pool || null,
          foilFlag
        });
        const raw = await fetchRawCard({
          rarity: rarity || null,
          queryFoil: foilFlag,
          pool: slot.pool || resolved?.pool || null,
          type: null
        });
        pushIfCard(formatted, raw, hasExplicitFoil ? foilFlag : null);
      }
    }

    logger.log(`Booster pack fetch completed successfully`, { setCode, operationId, cardCount: formatted.length });
    return formatted;
  } else {
    logger.warn(`No valid slots provided for set ${setCode}`, { operationId });
    console.warn('[mtg-api] No valid slots provided for set', setCode, '- refusing legacy fallback to avoid inconsistent pack sizes. Ensure slots are defined in boosters config.');
    return [];
  }
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
    // Only treat as foil when caller explicitly marks it as foil.
    // Do NOT infer foil from Scryfall's card.foil, which only indicates availability.
    foil: explicitFoil === true ? true : false
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
 
/**
 * Fetch all unique print cards for a given set code from Scryfall, with pagination and caching.
 * Returns lightweight normalized objects suitable for Collection missing entries.
 * @param {string} setCode
 * @returns {Promise<Array>} Array of normalized card entries
 */
export const fetchAllCardsInSet = async (setCode) => {
  if (!setCode || typeof setCode !== 'string') {
    throw new Error('fetchAllCardsInSet requires a non-empty setCode string');
  }
  const cacheKey = `all_set_${setCode.toLowerCase()}`;
  const cached = cardCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const baseUrl = `https://api.scryfall.com/cards/search?q=e%3A${encodeURIComponent(setCode)}&unique=prints`;
  let url = baseUrl;
  const results = [];

  try {
    while (url) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout for large requests

      const resp = await fetch(url, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const json = await resp.json();
      if (json.object === 'error') {
        throw new Error(json.details || 'Scryfall error object returned');
      }

      const data = Array.isArray(json.data) ? json.data : [];
      for (const card of data) {
        // Skip tokens and cards without usable imagery
        if (card.layout === 'token' || card.set_type === 'token') continue;

        // Determine image URL, preferring normal PNG. For double-faced, use front face image.
        let imageUrl = '';
        if (card.image_uris && (card.image_uris.normal || card.image_uris.large || card.image_uris.small)) {
          imageUrl = card.image_uris.normal || card.image_uris.large || card.image_uris.small || '';
        } else if (Array.isArray(card.card_faces) && card.card_faces.length > 0) {
          const front = card.card_faces[0];
          if (front && front.image_uris) {
            imageUrl = front.image_uris.normal || front.image_uris.large || front.image_uris.small || '';
          }
        }
        if (!imageUrl) continue; // skip entries without usable images

        // Normalize rarity exactly as in formatCardData
        let rarity = 'common';
        if (card.rarity) {
          switch ((card.rarity || '').toLowerCase()) {
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

        let price = 0;
        // if (card.prices) {
        //   const rawFoil = typeof card.prices.usd_foil === 'string' ? parseFloat(card.prices.usd_foil) : NaN;
        //   const rawUsd = typeof card.prices.usd === 'string' ? parseFloat(card.prices.usd) : NaN;
        //   const isFoil = false; // For fetchAllCardsInSet, we assume non-foil by default for collection view

        //   if (isFoil && !isNaN(rawFoil)) {
        //     price = rawFoil;
        //   } else if (!isNaN(rawUsd)) {
        //     price = rawUsd;
        //   } else if (!isNaN(rawFoil)) {
        //     price = rawFoil;
        //   } else {
        //     price = 0;
        //   }
        // }

        const normalized = {
          originalId: card.id,
          name: card.name || 'Unknown Card',
          rarity,
          type: card.type_line || 'Unknown',
          set: card.set_name || 'Unknown Set',
          setCode: card.set || (setCode.toLowerCase()),
          collectorNumber: String(card.collector_number || ''),
          image: imageUrl,
          foil: false,
          price: price
        };
        results.push(normalized);
      }

      url = json.has_more ? json.next_page : null;
    }

    // Cache and return
    cardCache.set(cacheKey, { data: results, timestamp: Date.now() });
    return results;
  } catch (err) {
    // Wrap with context and rethrow a clean Error
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to fetch all cards for set "${setCode}": ${message}`);
  }
};
