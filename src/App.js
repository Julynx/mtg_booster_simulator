import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Header from './components/Header';
import PackDisplay from './components/PackDisplay';
import CardDisplay from './components/CardDisplay';
import ActionButtons from './components/ActionButtons';
import Collection from './components/Collection';
import BackgroundParticles from './components/BackgroundParticles';
import Store from './components/Store';
import { NotificationProvider, useNotification } from './components/NotificationProvider';
import { getRarityColor, getAuraColor, isValidRarity } from './utils';
import { fetchBoosterPack } from './mtg-api';
import styles from './App.module.css';

/**
 * Configuration constants for the application
 */
const PACK_CONFIG = {
  modern: { 
    name: 'Modern Masters', 
    color: 'from-purple-600 to-blue-600',
    setCode: 'mm2' // Scryfall set code
  },
  zendikar: { 
    name: 'Zendikar Rising', 
    color: 'from-green-600 to-teal-600',
    setCode: 'znr'
  },
  throne: { 
    name: 'Throne of Eldraine', 
    color: 'from-pink-600 to-red-600',
    setCode: 'eld'
  },
  kamigawa: { 
    name: 'Kamigawa Neon', 
    color: 'from-cyan-600 to-purple-600',
    setCode: 'neo'
  }
};

const STARTING_PACKS = {
  modern: 2,
  zendikar: 1,
  throne: 1,
  kamigawa: 0
};

const RARITY_CONFIG = {
  rarities: ['common', 'uncommon', 'rare', 'mythic'],
  weights: [12, 4, 1, 0.15],
  totalWeight: 16 // Sum of weights
};

const APP_CONFIG = {
  defaultCardCount: 15, // Standard booster pack size
  maxCollectionSize: 1000,
  startingMoney: 100.00
};

/**
 * Validates card data structure.
 * @param {object} card - The card object to validate
 * @returns {boolean} Whether the card is valid
 */
const validateCard = (card) => {
  if (!card) return false;
  if (typeof card.id === 'undefined') return false;
  if (!card.name || typeof card.name !== 'string') return false;
  if (!card.rarity || typeof card.rarity !== 'string') return false;
  if (!card.image || typeof card.image !== 'string') return false;
  return true;
};

/**
 * Generates a new set of cards with random rarities (fallback for when API fails).
 * @param {number} count - Number of cards to generate
 * @returns {Array<object>} An array of card objects.
 */
const generateCards = (count = APP_CONFIG.defaultCardCount) => {
  const { rarities, weights, totalWeight } = RARITY_CONFIG;
  
  return Array.from({ length: count }, (_, index) => {
    const rand = Math.random() * totalWeight;
    let cumulative = 0;
    let rarity = rarities[0]; // Default to common
    
    for (let j = 0; j < rarities.length; j++) {
      cumulative += weights[j];
      if (rand < cumulative) {
        rarity = rarities[j];
        break;
      }
    }
    
    // Validate rarity and fallback if needed
    if (!isValidRarity(rarity)) {
      rarity = 'common';
    }
    
    return {
      id: index,
      name: `Card ${index + 1}`,
      rarity,
      image: `https://placehold.co/200x280/${getRarityColor(rarity).replace('#', '')}/ffffff?text=${rarity.charAt(0).toUpperCase()}`
    };
  });
};

/**
 * Main application content component that uses notifications
 * @returns {JSX.Element} The rendered application content
 */
const AppContent = () => {
  const { addNotification } = useNotification();
  const [currentPack] = useState('modern');
  const [isOpening, setIsOpening] = useState(false);
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState(new Set());
  const [collection, setCollection] = useState([]);
  const [showCollection, setShowCollection] = useState(false);
  const [money, setMoney] = useState(APP_CONFIG.startingMoney);
  const [lastFreePack, setLastFreePack] = useState(null);
  const [nextFreePackTime, setNextFreePackTime] = useState(null);
  const [packInventory, setPackInventory] = useState(() => {
    // Load pack inventory from localStorage or use starting packs
    const savedInventory = localStorage.getItem('mtgPackInventory');
    if (savedInventory) {
      try {
        return JSON.parse(savedInventory);
      } catch (error) {
        console.error('Error loading pack inventory:', error);
      }
    }
    return { ...STARTING_PACKS };
  });
  const [showStore, setShowStore] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedCollection = localStorage.getItem('mtgCollection');
    const savedMoney = localStorage.getItem('mtgMoney');
    const savedLastFreePack = localStorage.getItem('mtgLastFreePack');
    
    if (savedCollection) {
      try {
        setCollection(JSON.parse(savedCollection));
      } catch (error) {
        console.error('Error loading collection from localStorage:', error);
      }
    }
    
    if (savedMoney) {
      try {
        setMoney(parseFloat(savedMoney));
      } catch (error) {
        console.error('Error loading money from localStorage:', error);
      }
    }
    
    if (savedLastFreePack) {
      try {
        setLastFreePack(new Date(savedLastFreePack));
      } catch (error) {
        console.error('Error loading last free pack time:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mtgCollection', JSON.stringify(collection));
  }, [collection]);

  useEffect(() => {
    localStorage.setItem('mtgMoney', money.toString());
  }, [money]);

  useEffect(() => {
    if (lastFreePack) {
      localStorage.setItem('mtgLastFreePack', lastFreePack.toISOString());
    }
  }, [lastFreePack]);

  useEffect(() => {
    localStorage.setItem('mtgPackInventory', JSON.stringify(packInventory));
  }, [packInventory]);

  // Calculate next free pack time
  useEffect(() => {
    const calculateNextFreePackTime = () => {
      if (lastFreePack) {
        const nextTime = new Date(lastFreePack.getTime() + 6 * 60 * 60 * 1000); // 6 hours
        setNextFreePackTime(nextTime);
      } else {
        setNextFreePackTime(null);
      }
    };

    calculateNextFreePackTime();
  }, [lastFreePack]);

  /**
   * Claims a free booster pack
   */
  const claimFreePack = useCallback(() => {
    const now = new Date();
    if (!nextFreePackTime || now < nextFreePackTime) {
      return false; // Not eligible for free pack yet
    }

    // Add a random pack to inventory
    const packTypes = Object.keys(PACK_CONFIG);
    const randomPackType = packTypes[Math.floor(Math.random() * packTypes.length)];
    
    setPackInventory(prev => ({
      ...prev,
      [randomPackType]: (prev[randomPackType] || 0) + 1
    }));
    
    setLastFreePack(now);
    setNextFreePackTime(new Date(now.getTime() + 6 * 60 * 60 * 1000)); // 6 hours from now
    return true;
  }, [nextFreePackTime]);

  /**
   * Opens a new booster pack with real MTG cards.
   */
  const openPack = useCallback(async (packType = currentPack) => {
    // Check if we have packs available
    if (packInventory[packType] <= 0) {
      addNotification({
        message: 'No packs available! Visit the store to buy more.',
        type: 'error',
        duration: 3000
      });
      return;
    }

    setIsOpening(true);
    setFlippedCards(new Set());
    
    // Use the pack from inventory
    setPackInventory(prev => ({
      ...prev,
      [packType]: Math.max(0, (prev[packType] || 0) - 1)
    }));
    
    try {
      console.log('Opening pack for set:', packType);
      const packConfig = PACK_CONFIG[packType];
      console.log('Pack config:', packConfig);
      
      console.log('Fetching booster pack for set code:', packConfig.setCode);
      const realCards = await fetchBoosterPack(packConfig.setCode);
      console.log('Received real cards:', realCards);
      
      if (realCards && realCards.length > 0) {
        console.log('Setting real cards:', realCards.length);
        // Validate that we have real card data
        const validRealCards = realCards.filter(card => 
          card && card.name && card.image // && card.image.includes('scryfall') - removed strict scryfall check
        );
        
        if (validRealCards.length > 0) {
          console.log('Valid real cards count:', validRealCards.length);
          setCards(realCards);
        } else {
          console.warn('No valid real cards found, using generated cards as fallback');
          setCards(generateCards());
        }
      } else {
        // Fallback to generated cards if API fails
        console.warn('Failed to fetch real cards, using generated cards as fallback');
        setCards(generateCards());
      }
    } catch (error) {
      console.error('Error opening pack:', error);
      // Fallback to generated cards if API fails
      setCards(generateCards());
    }
  }, [currentPack, packInventory, addNotification]);

  /**
   * Flips a card to reveal its face.
   * @param {number} cardId The ID of the card to flip.
   */
  const flipCard = useCallback((cardId) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  }, []);

  /**
   * Adds the currently displayed cards to the collection.
   */
  const collectCards = useCallback(() => {
    // Validate cards before collecting
    const validCards = cards.filter(validateCard);
    
    setCollection(prev => {
      // Prevent excessive collection size
      if (prev.length + validCards.length > APP_CONFIG.maxCollectionSize) {
        console.warn('Collection size limit reached. Some cards will not be added.');
        const remainingSpace = APP_CONFIG.maxCollectionSize - prev.length;
        return [...prev, ...validCards.slice(0, remainingSpace)];
      }
      return [...prev, ...validCards];
    });
    
    setCards([]);
    setIsOpening(false);
  }, [cards]);

  /**
   * Resets the current pack opening state.
   */
  const resetPack = useCallback(() => {
    setCards([]);
    setFlippedCards(new Set());
    setIsOpening(false);
  }, []);


  /**
   * Memoized pack configuration
   */
  const packConfig = useMemo(() => PACK_CONFIG, []);

  return (
    <div className={styles.app}>
      <BackgroundParticles isOpening={isOpening} cards={cards} />
      <Header />

      <div className={styles.mainContent}>
        {!isOpening ? (
          <PackDisplay
            packs={packConfig}
            currentPack={currentPack}
            openPack={openPack}
            packInventory={packInventory}
            onOpenStore={() => setShowStore(true)}
            nextFreePackTime={nextFreePackTime}
            claimFreePack={claimFreePack}
          />
        ) : (
          <div className={styles.cardDisplayContainer}>
            <CardDisplay
              cards={cards}
              flippedCards={flippedCards}
              flipCard={flipCard}
              getAuraColor={getAuraColor}
            />
            <ActionButtons
              flippedCards={flippedCards}
              cards={cards}
              collectCards={collectCards}
            />
          </div>
        )}
      </div>

      <Store
        money={money}
        setMoney={setMoney}
        collection={collection}
        setCollection={setCollection}
        openPack={openPack}
        packs={packConfig}
        currentPack={currentPack}
        showStore={showStore}
        setShowStore={setShowStore}
        setPackInventory={setPackInventory}
        packInventory={packInventory}
        nextFreePackTime={nextFreePackTime}
        claimFreePack={claimFreePack}
      />

      <Collection
        collection={collection}
        showCollection={showCollection}
        setShowCollection={setShowCollection}
        getRarityColor={getRarityColor}
        setCollection={setCollection}
      />
    </div>
  );
};

/**
 * The main application component.
 * @returns {JSX.Element} The rendered application.
 */
const App = () => {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
};

export default App;
