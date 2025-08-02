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
import PackOpeningScreen from './components/PackOpeningScreen'; // Import PackOpeningScreen
import { NotificationProvider, useNotification } from './components/NotificationProvider';
import { getRarityColor, getAuraColor, loadBoosters } from './utils';
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
  // Simplified animation states
  const [isOpening, setIsOpening] = useState(false); // Whether we're in the opening sequence
  const [openingPackType, setOpeningPackType] = useState(null); // Which pack is currently opening
  const [, setAnimationPhase] = useState('idle'); // 'idle', 'shaking', 'exploding', 'cards'
  const [isLoading, setIsLoading] = useState(false); // New state for global loading overlay
  const [triggerPackExplosion, setTriggerPackExplosion] = useState(false); // New state to trigger explosion
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
  // Track pending opened cards to make adding robust against reloads
  const [pendingOpenedIds, setPendingOpenedIds] = useState(() => {
    const saved = localStorage.getItem('mtgPendingOpenedCards');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
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

    // Reconcile any pending opened cards (in case of reload/crash before UI "Continue")
    try {
      const savedPending = localStorage.getItem('mtgPendingOpenedCards');
      if (savedPending) {
        const pendingIds = JSON.parse(savedPending);
        if (Array.isArray(pendingIds) && pendingIds.length > 0) {
          // If collection already contains them, clear marker; otherwise we trust the persisted collection effect
          // and simply clear the marker to avoid re-adding duplicates.
          setPendingOpenedIds(pendingIds);
          // If needed, a more complex reconciliation could verify presence; our IDs are unique per instance.
          localStorage.removeItem('mtgPendingOpenedCards');
          setPendingOpenedIds([]);
        }
      }
    } catch (err) {
      console.warn('Error reconciling pending opened cards:', err);
    }
  }, [packs]); // Depend on 'packs' to ensure they are loaded before calculating free packs

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mtgCollection', JSON.stringify(collection));
  }, [collection]);

  useEffect(() => {
    localStorage.setItem('mtgPendingOpenedCards', JSON.stringify(pendingOpenedIds));
  }, [pendingOpenedIds]);

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
   * Simplified animation sequence:
   * 1. Start shaking
   * 2. Load cards
   * 3. Explode
   * 4. Show cards
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

    setIsLoading(true); // Start loading
    // Start opening sequence
    setIsOpening(true);
    setOpeningPackType(packType);
    setCards([]);
    setFlippedCards(new Set());

    // Use the pack from inventory
    setPackInventory(prev => ({
      ...prev,
      [packType]: Math.max(0, (prev[packType] || 0) - 1)
    }));

    try {
      console.log('Opening pack for set:', packType);
      const packConfig = packs[packType];

      // Fetch cards
      let fetchedCards;
      if (Array.isArray(packConfig.slots) && packConfig.slots.length > 0) {
        fetchedCards = await fetchBoosterPack(packConfig.setCode, packConfig.slots);
      } else {
        fetchedCards = await fetchBoosterPack(packConfig.setCode);
      }

      // Process cards - fail loudly if no valid cards
      if (!fetchedCards || fetchedCards.length === 0) {
        throw new Error('No cards returned from API');
      }

      const validCards = fetchedCards.filter(card => card && card.name && card.image);
      if (validCards.length === 0) {
        throw new Error('No valid cards returned from API');
      }
      
      // Add cards to collection
      const now = Date.now(); // Get current timestamp in Unix milliseconds
      const cardsWithTimestamp = validCards.map(card => ({
        ...card,
        dateObtained: now // Add dateObtained property
      }));

      setCollection(prev => {
        const remainingSpace = APP_CONFIG.maxCollectionSize - prev.length;
        const toAdd = remainingSpace >= cardsWithTimestamp.length ? cardsWithTimestamp : cardsWithTimestamp.slice(0, Math.max(0, remainingSpace));
        return remainingSpace > 0 ? [...prev, ...toAdd] : prev;
      });
      
      setPendingOpenedIds(cardsWithTimestamp.map(c => c.id)); // Use cardsWithTimestamp here
      setCards(cardsWithTimestamp); // Use cardsWithTimestamp here

      // Show cards immediately after fetching
      setAnimationPhase('cards');
      setTriggerPackExplosion(true); // Trigger explosion in PackOpeningScreen

    } catch (error) {
      console.error('Error opening pack:', error);
      addNotification({
        message: `API Error: ${error.message}`,
        type: 'error',
        duration: 5000
      });

      // Reset animation states
      setIsOpening(false);
      setOpeningPackType(null);
      setAnimationPhase('idle');
      setIsLoading(false); // End loading on error
      setTriggerPackExplosion(false); // Reset explosion trigger on error
    }
  }, [currentPack, packInventory, addNotification, packs, setAnimationPhase]);

  const handlePackOpeningAnimationComplete = useCallback(() => {
    setIsLoading(false); // End loading when PackOpeningScreen animation is complete
    setTriggerPackExplosion(false); // Reset explosion trigger after animation
  }, []);

  /**
   * Flips a card to reveal its face.
   * @param {number} cardId The ID of the card to flip.
   * @param {string} rarity The rarity of the card.
   */
  const flipCard = useCallback((cardId, rarity) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      // Only add to set if not already present (flip once)
      if (!newSet.has(cardId)) {
        newSet.add(cardId);
        // Play sound only on first flip
        const flipSound = new Audio(`${process.env.PUBLIC_URL}/assets/flash1.wav`);
        const rarityPitchMap = {
          'common': 1,
          'uncommon': 0.9,
          'rare': 0.7,
          'mythic': 0.5,
          'special': 1.6,
          'bonus': 1.8
        };
        const pitch = rarityPitchMap[rarity] || 1.0; // Default to 1.0 if rarity not found
        flipSound.playbackRate = pitch;
        flipSound.preservesPitch = false;
        flipSound.play().catch(e => console.error("Error playing flip sound:", e));
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
      // Iterate through cards and flip unflipped ones, playing sound for each
      cards.forEach(card => {
        if (!flippedCards.has(card.id)) {
          flipCard(card.id, card.rarity);
        }
      });
    } else if (actionType === 'collect') {
      setAnimatingOutCards(true); // Trigger exit animation

      setTimeout(() => {
        // Reset all animation states
        setCards([]);
        setIsOpening(false);
        setAnimatingOutCards(false);
        setAnimationPhase('idle');
        setOpeningPackType(null);
        setIsLoading(false); // Ensure loading is false when returning to idle

        // Clear pending opened marker
      setPendingOpenedIds([]);
      localStorage.removeItem('mtgPendingOpenedCards');
    }, 600);
  }
}, [cards, setAnimationPhase, flipCard, flippedCards]);



  /**
   * Memoized pack configuration
   */
  const packConfig = useMemo(() => packs, [packs]); // Use dynamically loaded packs

  // No longer needed with simplified animation flow

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
        <AnimatePresence mode="wait">
          {/* Simplified animation sequence with clear phases */}
          {!isOpening ? (
            // Default state - show packs
            <motion.div
              key="packs"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {Object.keys(packs).length > 0 && currentPack !== null ? (
                <PackDisplay
                  packs={packConfig}
                  currentPack={currentPack}
                  openPack={(packType) => {
                    // Reset any lingering animation states before starting a new opening
                    setOpeningPackType(null);
                    setAnimationPhase('idle');
                    // Then start the new opening sequence
                    openPack(packType);
                  }}
                  packInventory={packInventory}
                  onOpenStore={() => setShowStore(true)}
                  nextFreePackTime={nextFreePackTime}
                  claimFreePack={claimFreePack}
                />
              ) : (
                <div>Loading packs...</div>
              )}
            </motion.div>
          ) : (
            // Show cards
            <motion.div
              key="cards"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`${styles.cardDisplayContainer} ${styles.cardDisplayContainerWithPadding}`}
            >
              <CardDisplay
                cards={cards}
                flippedCards={flippedCards}
                flipCard={flipCard}
                getAuraColor={getAuraColor}
                animatingOut={animatingOutCards}
              />
              <ActionButtons
                flippedCards={flippedCards}
                cards={cards}
                onAction={handleCardAction}
                allCardsFlipped={allCardsFlipped}
              />
            </motion.div>
          )}
        </AnimatePresence>
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

      {/* Legal disclaimer at bottom of main screen */}
      <footer className={styles.legalDisclaimer}>
        <p>All currency used within this simulation is entirely fictional and holds no real-world monetary value. All products presented are simulated and do not represent or replicate real-world goods. All referenced items, including card designs, names, and intellectual property, are the copyrighted property of Wizards of the Coast and Hasbro. This simulation is a fan-created experience and is not affiliated with, endorsed by, or associated with Wizards of the Coast or Hasbro.</p>
      </footer>
      <AnimatePresence>
        {isLoading && (
          <PackOpeningScreen packConfig={packs[openingPackType]} onAnimationComplete={handlePackOpeningAnimationComplete} triggerExplosion={triggerPackExplosion} />
        )}
      </AnimatePresence>
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
