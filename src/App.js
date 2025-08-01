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
import { getRarityColor, getAuraColor, generateCards, loadBoosters } from './utils';
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
  const [isLoadingCards, setIsLoadingCards] = useState(false); // API in-flight
  const [readyToReveal, setReadyToReveal] = useState(false); // Cards data is ready to reveal
  const [exploding, setExploding] = useState(false); // Pack exit animation flag
  const [openingPackType, setOpeningPackType] = useState(null); // Which pack is currently opening (for targeted shake)
  const [minShakeDone, setMinShakeDone] = useState(false); // ensure a minimum shake duration before explosion
  const [shakeStartAt, setShakeStartAt] = useState(null); // precise shake start timestamp
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
   * Sequence:
   * - Click -> start shaking immediately
   * - Enforce minimum shake window (>= 900ms) even if API is instant
   * - When both min window elapsed AND data ready, explode
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
    setOpeningPackType(packType); // track which pack is opening
    setExploding(false); // reset explosion state
    setReadyToReveal(false); // We are not ready to reveal yet
    setMinShakeDone(false); // reset min shake flag
    setShakeStartAt(Date.now()); // mark shake start for enforcing minimum duration
    setIsLoadingCards(true); // Set loading to true when starting to open (triggers shake) - keep after timestamps
    setCards([]); // Reset cards to ensure PackDisplay renders during loading
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

      // Use per-slot fetching when slots exist; otherwise legacy fallback
      let realCards = [];
      if (Array.isArray(packConfig.slots) && packConfig.slots.length > 0) {
        realCards = await fetchBoosterPack(packConfig.setCode, packConfig.slots);
      } else {
        realCards = await fetchBoosterPack(packConfig.setCode);
      }

      console.log('Received real cards:', realCards);
      
      if (realCards && realCards.length > 0) {
        console.log('Setting real cards:', realCards.length);
        // Validate that we have real card data
        const validRealCards = realCards.filter(card => 
          card && card.name && card.image
        );
        
        if (validRealCards.length > 0) {
          console.log('Valid real cards count:', validRealCards.length);
          // Prepare cards but do not reveal yet
          setCollection(prev => {
            const remainingSpace = APP_CONFIG.maxCollectionSize - prev.length;
            const toAdd = remainingSpace >= validRealCards.length ? validRealCards : validRealCards.slice(0, Math.max(0, remainingSpace));
            return remainingSpace > 0 ? [...prev, ...toAdd] : prev;
          });
          setPendingOpenedIds(validRealCards.map(c => c.id));
          setCards(validRealCards);
        } else {
          console.warn('No valid real cards found, using generated cards as fallback');
          const gen = generateCards();
          setCollection(prev => {
            const remainingSpace = APP_CONFIG.maxCollectionSize - prev.length;
            const toAdd = remainingSpace >= gen.length ? gen : gen.slice(0, Math.max(0, remainingSpace));
            return remainingSpace > 0 ? [...prev, ...toAdd] : prev;
          });
          setPendingOpenedIds(gen.map(c => c.id));
          setCards(gen);
        }
      } else {
        // Fallback to generated cards if API fails
        console.warn('Failed to fetch real cards, using generated cards as fallback');
        const gen = generateCards();
        setCollection(prev => {
          const remainingSpace = APP_CONFIG.maxCollectionSize - prev.length;
          const toAdd = remainingSpace >= gen.length ? gen : gen.slice(0, Math.max(0, remainingSpace));
          return remainingSpace > 0 ? [...prev, ...toAdd] : prev;
        });
        setPendingOpenedIds(gen.map(c => c.id));
        setCards(gen);
      }
    } catch (error) {
      console.error('Error opening pack:', error);
      // Fallback to generated cards if API fails
      const gen = generateCards();
      setCollection(prev => {
        const remainingSpace = APP_CONFIG.maxCollectionSize - prev.length;
        const toAdd = remainingSpace >= gen.length ? gen : gen.slice(0, Math.max(0, remainingSpace));
        return remainingSpace > 0 ? [...prev, ...toAdd] : prev;
      });
      setPendingOpenedIds(gen.map(c => c.id));
      setCards(gen);
    } finally {
      // Data is ready; now enforce minimum shake time before explosion
      setReadyToReveal(true);

      const MIN_SHAKE_MS = 900;
      const nowTs = Date.now();
      const elapsed = shakeStartAt ? nowTs - shakeStartAt : 0;
      const remaining = Math.max(0, MIN_SHAKE_MS - elapsed);

      // Keep shaking visible until min window has elapsed
      setTimeout(() => {
        // Minimum shake window complete
        setMinShakeDone(true);
        // Stop the shake flag now so PackDisplay leaves shake variant
        setIsLoadingCards(false);
        // Trigger explode now that both conditions (min window + ready) are satisfied
        requestAnimationFrame(() => setExploding(true));
      }, remaining);
      // openingPackType stays set during explosion so the correct pack can exit
    }
  }, [currentPack, packInventory, addNotification, packs, shakeStartAt]); // deps simplified; minShakeDone is controlled inside

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
        // Collection was already updated on open; here we only clear UI state
        setCards([]);
        setIsOpening(false);
        setAnimatingOutCards(false); // Reset after cards are cleared
        // Clear pending opened marker
        setPendingOpenedIds([]);
        localStorage.removeItem('mtgPendingOpenedCards');
      }, 600); // snappier exit now that persistence already happened
    }
  }, [cards, setFlippedCards]); // setCollection is stable and not needed in deps



  /**
   * Memoized pack configuration
   */
  const packConfig = useMemo(() => packs, [packs]); // Use dynamically loaded packs

  // Ensure minimum shake window starts as soon as we begin opening
  useEffect(() => {
    if (isOpening && !minShakeDone) {
      const t = setTimeout(() => setMinShakeDone(true), 900); // minimum shake
      return () => clearTimeout(t);
    }
  }, [isOpening, minShakeDone]);

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
          {/* Sequence:
              click -> shake while loading
              loading done -> stop shake -> explode (pack exit)
              after explosion -> show cards
            */}
          {/* While opening and before explosion, show shaking packs.
              Only enter explosion branch AFTER min shake and when explicitly exploding */}
          {isOpening && !exploding ? (
            <motion.div key="packs-shaking" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {Object.keys(packs).length > 0 && currentPack !== null ? (
                <PackDisplay
                  packs={packConfig}
                  currentPack={currentPack}
                  openPack={openPack}
                  packInventory={packInventory}
                  onOpenStore={() => setShowStore(true)}
                  nextFreePackTime={nextFreePackTime}
                  claimFreePack={claimFreePack}
                  isShaking={true}
                  openingPackType={openingPackType}
                  exploding={false}
                />
              ) : (
                <div>Loading packs...</div>
              )}
            </motion.div>
          ) : isOpening && exploding && !(readyToReveal && cards.length > 0) ? (
            <motion.div key="packs-exploding" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {Object.keys(packs).length > 0 && currentPack !== null ? (
                <PackDisplay
                  packs={packConfig}
                  currentPack={currentPack}
                  openPack={openPack}
                  packInventory={packInventory}
                  onOpenStore={() => setShowStore(true)}
                  nextFreePackTime={nextFreePackTime}
                  claimFreePack={claimFreePack}
                  isShaking={false}
                  openingPackType={openingPackType}
                  exploding={true}
                  onExplosionComplete={() => {
                    setOpeningPackType(null);
                    setExploding(false);
                  }}
                />
              ) : (
                <div>Loading packs...</div>
              )}
            </motion.div>
          ) : isOpening && readyToReveal && cards.length > 0 ? (
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
          ) : (
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
                  openPack={openPack}
                  packInventory={packInventory}
                  onOpenStore={() => setShowStore(true)}
                  nextFreePackTime={nextFreePackTime}
                  claimFreePack={claimFreePack}
                  isShaking={isLoadingCards || (!minShakeDone && isOpening && Boolean(openingPackType))}
                  openingPackType={openingPackType}
                  readyToReveal={readyToReveal}
                />
              ) : (
                <div>Loading packs...</div>
              )}
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
