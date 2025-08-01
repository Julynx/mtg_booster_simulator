import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion'; // Import AnimatePresence and motion
import { ShoppingCart, DollarSign } from 'lucide-react'; // Import icons
import Header from './components/Header';
import PackDisplay from './components/PackDisplay';
import CardDisplay from './components/CardDisplay';
import ActionButtons from './components/ActionButtons';
import Collection from './components/Collection';
import BackgroundParticles from './components/BackgroundParticles';
import Store from './components/Store';
import { NotificationProvider, useNotification } from './components/NotificationProvider';
import { getRarityColor, getAuraColor, validateCard, generateCards, loadBoosters } from './utils';
import { fetchBoosterPack } from './mtg-api';
import { APP_CONFIG } from './config';
import styles from './App.module.css';

/**
 * Main application content component that uses notifications
 * @returns {JSX.Element} The rendered application content
 */
const AppContent = () => {
  const { addNotification } = useNotification();
  const [packs, setPacks] = useState({}); // State to store loaded booster packs
  const [currentPack, setCurrentPack] = useState(null); // Default to null, will be set after loading
  const [isOpening, setIsOpening] = useState(false);
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState(new Set());
  const [animatingOutCards, setAnimatingOutCards] = useState(false);
  const allCardsFlipped = useMemo(() => {
    if (cards.length === 0) return false; // No cards, so not all are flipped
    return cards.every(card => flippedCards.has(card.id));
  }, [cards, flippedCards]);
  const [collection, setCollection] = useState(() => {
    const savedCollection = localStorage.getItem('mtgCollection');
    if (savedCollection) {
      try {
        const parsedCollection = JSON.parse(savedCollection);
        if (Array.isArray(parsedCollection)) {
          return parsedCollection;
        }
      } catch (error) {
        console.error('Error loading collection from localStorage:', error);
      }
    }
    return [];
  });
  const [showCollection, setShowCollection] = useState(false);
  const [money, setMoney] = useState(() => {
    // Only set starting money for new users (no saved money in localStorage)
    const savedMoney = localStorage.getItem('mtgMoney');
    if (savedMoney) {
      try {
        return parseFloat(savedMoney);
      } catch (error) {
        console.error('Error parsing saved money:', error);
        return 0;
      }
    }
    return APP_CONFIG.startingMoney;
  });
  const [lastFreePack, setLastFreePack] = useState(null);
  const [nextFreePackTime, setNextFreePackTime] = useState(null);
  const [packInventory, setPackInventory] = useState(() => {
    const savedInventory = localStorage.getItem('mtgPackInventory');
    if (savedInventory) {
      try {
        return JSON.parse(savedInventory);
      } catch (error) {
        console.error('Error parsing saved pack inventory:', error);
        return {};
      }
    }
    return {};
  });
  const [showStore, setShowStore] = useState(false);

  // Load booster data on component mount
  useEffect(() => {
    const initializeBoosters = async () => {
      console.log('Attempting to load boosters...');
      const loadedPacks = await loadBoosters();
      console.log('Loaded packs:', loadedPacks);
      setPacks(loadedPacks);
      
      // Set initial currentPack to the first available pack
      const firstPackCode = Object.keys(loadedPacks)[0];
      if (firstPackCode) {
        setCurrentPack(firstPackCode);
      }

      // The pack inventory is now initialized directly from localStorage in useState.
      // No need to load it again here.
    };
    initializeBoosters();
  }, []);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedMoney = localStorage.getItem('mtgMoney');
    const savedLastFreePack = localStorage.getItem('mtgLastFreePack');
    
    if (savedMoney) {
      try {
        setMoney(parseFloat(savedMoney));
      } catch (error) {
        console.error('Error loading money from localStorage:', error);
      }
    }
    
    if (savedLastFreePack) {
      try {
        const lastFreePackTime = new Date(savedLastFreePack);
        const now = new Date();
        const diff = now.getTime() - lastFreePackTime.getTime();
        const packsEarned = Math.floor(diff / APP_CONFIG.freePackInterval);

        if (packsEarned > 0) {
          const packTypes = Object.keys(packs); // Use dynamically loaded packs
          let newPacks = {};
          for (let i = 0; i < packsEarned; i++) {
            const randomPackType = packTypes[Math.floor(Math.random() * packTypes.length)];
            newPacks[randomPackType] = (newPacks[randomPackType] || 0) + 1;
          }
          setPackInventory(prev => {
            const updatedInventory = { ...prev };
            for (const packType in newPacks) {
              updatedInventory[packType] = (updatedInventory[packType] || 0) + newPacks[packType];
            }
            return updatedInventory;
          });
          const newLastFreePackTime = new Date(lastFreePackTime.getTime() + packsEarned * APP_CONFIG.freePackInterval);
          setLastFreePack(newLastFreePackTime);
        } else {
          setLastFreePack(lastFreePackTime);
        }
      } catch (error) {
        console.error('Error loading last free pack time:', error);
      }
    } else {
      // If no last free pack time is saved, set it to now to start the timer
      setLastFreePack(new Date());
    }
  }, [packs]); // Depend on 'packs' to ensure they are loaded before calculating free packs

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

  /**
   * Claims a free booster pack
   */
  const claimFreePack = useCallback(() => {
    const now = new Date();
    // Add a random pack to inventory
    const packTypes = Object.keys(packs); // Use dynamically loaded packs
    if (packTypes.length === 0) {
      console.warn('No pack types available to claim a free pack.');
      return false;
    }
    const randomPackType = packTypes[Math.floor(Math.random() * packTypes.length)];
    
    setPackInventory(prev => ({
      ...prev,
      [randomPackType]: (prev[randomPackType] || 0) + 1
    }));
    
    setLastFreePack(now);
    addNotification({
      message: `A free ${packs[randomPackType]?.name || 'random'} pack has been added to your inventory!`,
      type: 'success'
    });
    return true;
  }, [addNotification, packs]);

  // Automatically claim free pack when time is up
  useEffect(() => {
    if (nextFreePackTime && new Date() >= nextFreePackTime) {
      claimFreePack();
    }
  }, [nextFreePackTime, claimFreePack]);

  // Calculate next free pack time
  useEffect(() => {
    const calculateNextFreePackTime = () => {
      if (lastFreePack) {
        const nextTime = new Date(lastFreePack.getTime() + APP_CONFIG.freePackInterval);
        setNextFreePackTime(nextTime);
      } else {
        setNextFreePackTime(null);
      }
    };

    calculateNextFreePackTime();
    const interval = setInterval(calculateNextFreePackTime, 1000);
    return () => clearInterval(interval);
  }, [lastFreePack]);

  /**
   * Opens a new booster pack with real MTG cards.
   */
  const openPack = useCallback(async (packType = currentPack) => {
    // Check if we have packs available
    if (!packInventory[packType] || packInventory[packType] <= 0) {
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
      const packConfig = packs[packType]; // Use dynamically loaded packs
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
  }, [currentPack, packInventory, addNotification, packs]); // Add 'packs' to dependencies

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
   * Handles actions related to cards: revealing all or collecting.
   * @param {string} actionType - 'reveal' to flip all cards, 'collect' to add to collection and clear.
   */
  const handleCardAction = useCallback((actionType) => {
    if (actionType === 'reveal') {
      const allCardIds = new Set(cards.map(c => c.id));
      setFlippedCards(allCardIds);
    } else if (actionType === 'collect') {
      setAnimatingOutCards(true); // Trigger exit animation

      setTimeout(() => {
        const validCards = cards.filter(validateCard);
        
        setCollection(prev => {
          if (prev.length + validCards.length > APP_CONFIG.maxCollectionSize) {
            console.warn('Collection size limit reached. Some cards will not be added.');
            const remainingSpace = APP_CONFIG.maxCollectionSize - prev.length;
            return [...prev, ...validCards.slice(0, remainingSpace)];
          }
          return [...prev, ...validCards];
        });
        
        setCards([]);
        setIsOpening(false);
        setAnimatingOutCards(false); // Reset after cards are cleared
      }, 1000); // Adjusted delay for new exit animation (will be 0.8s + some buffer)
    }
  }, [cards, setFlippedCards, setCollection]);



  /**
   * Memoized pack configuration
   */
  const packConfig = useMemo(() => packs, [packs]); // Use dynamically loaded packs

  return (
    <div className={styles.app}>
      <BackgroundParticles isOpening={isOpening} cards={cards} />
      <Header />

      {/* Store Button - Always visible */}
      <motion.div
        className={styles.storeButtonContainer}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <motion.button
          className={styles.storeButton}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowStore(true)}
        >
          <ShoppingCart size={24} />
          <div className={styles.moneyDisplay}>
            <DollarSign size={16} />
            <span>{money.toFixed(2)}</span>
          </div>
        </motion.button>
      </motion.div>

      <div className={styles.mainContent}>
        {!isOpening && Object.keys(packs).length > 0 && currentPack !== null ? ( // Conditionally render PackDisplay
          <PackDisplay
            packs={packConfig}
            currentPack={currentPack}
            openPack={openPack}
            packInventory={packInventory}
            onOpenStore={() => setShowStore(true)}
            nextFreePackTime={nextFreePackTime}
            claimFreePack={claimFreePack}
          />
        ) : !isOpening && (Object.keys(packs).length === 0 || currentPack === null) ? (
          <div>Loading packs...</div> // Or a loading spinner
        ) : (
          <div className={`${styles.cardDisplayContainer} ${styles.cardDisplayContainerWithPadding}`}>
            <CardDisplay
              cards={cards}
              flippedCards={flippedCards}
              flipCard={flipCard}
              getAuraColor={getAuraColor}
              animatingOut={animatingOutCards} // New prop
            />
            <ActionButtons
              flippedCards={flippedCards}
              cards={cards}
              onAction={handleCardAction}
              allCardsFlipped={allCardsFlipped}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showStore && (
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
            showCollection={showCollection}
            setShowCollection={setShowCollection}
          />
        )}
      </AnimatePresence>

      <Collection
        collection={collection}
        showCollection={showCollection}
        setShowCollection={setShowCollection}
        getRarityColor={getRarityColor}
        setCollection={setCollection}
        setMoney={setMoney}
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
