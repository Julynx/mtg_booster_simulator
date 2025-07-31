import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, DollarSign, Gift } from 'lucide-react';
import styles from './Store.module.css';
import { useNotification } from './NotificationProvider';

/**
 * Store component for buying booster packs and selling cards
 * @param {Object} props - Component props
 * @param {number} props.money - Current money amount
 * @param {Function} props.setMoney - Function to update money
 * @param {Array} props.collection - User's card collection
 * @param {Function} props.setCollection - Function to update collection
 * @param {Function} props.openPack - Function to open a booster pack
 * @param {Object} props.packs - Available pack configurations
 * @param {string} props.currentPack - Current selected pack
 * @param {boolean} props.showStore - Whether store is visible
 * @param {Function} props.setShowStore - Function to set store visibility
 * @param {Function} props.setPackInventory - Function to update pack inventory
 * @param {Object} props.packInventory - Current pack inventory
 * @param {Date} props.nextFreePackTime - Time when next free pack is available
 * @param {Function} props.claimFreePack - Function to claim free pack
 * @returns {JSX.Element} The rendered store component
 */
const Store = ({ money, setMoney, collection, setCollection, openPack, packs, currentPack, showStore, setShowStore, setPackInventory, packInventory, nextFreePackTime, claimFreePack }) => {
  const { addNotification } = useNotification();
  const [sellMode, setSellMode] = useState(false);
  const [selectedCards, setSelectedCards] = useState(new Set());

  // Booster pack prices (memoized to prevent re-renders)
  const BOOSTER_PRICES = useMemo(() => ({
    modern: 3.99,
    zendikar: 4.99,
    throne: 5.99,
    kamigawa: 6.99
  }), []);

  /**
   * Toggles card selection for selling
   * @param {string} cardId - The card ID to toggle
   */
  const toggleCardSelection = useCallback((cardId) => {
    setSelectedCards(prev => {
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
   * Sells selected cards
   */
  const sellSelectedCards = useCallback(() => {
    if (selectedCards.size === 0) return;

    let totalValue = 0;
    const cardsToSell = [];
    
    // Calculate total value and collect cards to remove
    collection.forEach(card => {
      if (selectedCards.has(card.id)) {
        totalValue += card.price || 0.10; // Minimum value of $0.10
        cardsToSell.push(card.id);
      }
    });

    // Remove sold cards from collection
    setCollection(prev => prev.filter(card => !cardsToSell.includes(card.id)));
    
    // Add money
    setMoney(prev => prev + totalValue);
    
    // Clear selection
    setSelectedCards(new Set());
    setSellMode(false);
  }, [selectedCards, collection, setCollection, setMoney]);

  /**
   * Cancels sell mode
   */
  const cancelSellMode = useCallback(() => {
    setSellMode(false);
    setSelectedCards(new Set());
  }, []);

  /**
   * Gets the hex color for a given card rarity
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

  // Format time remaining for display
  const formatTimeRemaining = (targetTime) => {
    if (!targetTime) return '';
    const now = new Date();
    const diff = targetTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 'Available now!';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m ${seconds}s`;
    }
  };

  // Handle free pack claim
  const handleClaimFreePack = useCallback((e) => {
    e.preventDefault();
    if (claimFreePack) {
      const success = claimFreePack();
      if (success) {
        // Show notification or update UI
        console.log('Free pack claimed!');
      }
    }
  }, [claimFreePack]);

  // Animation configurations
  const storeButtonAnimation = {
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.9 }
  };

  const modalOverlayAnimation = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const modalContentAnimation = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 }
  };

  return (
    <>
      <motion.div
        className={styles.storeButtonContainer}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <motion.button
          className={styles.storeButton}
          {...storeButtonAnimation}
          onClick={() => setShowStore(true)}
        >
          <ShoppingCart size={24} />
          <div className={styles.moneyDisplay}>
            <DollarSign size={16} />
            <span>{money.toFixed(2)}</span>
          </div>
        </motion.button>
      </motion.div>

      {showStore && (
        <motion.div
          className={styles.modalOverlay}
          {...modalOverlayAnimation}
          onClick={() => setShowStore(false)}
        >
          <motion.div
            className={styles.modalContent}
            {...modalContentAnimation}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Magic Card Store</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowStore(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.storeContent}>
              {/* Money Display */}
              <div className={styles.moneySection}>
                <div className={styles.moneyInfo}>
                  <DollarSign size={24} />
                  <span className={styles.moneyAmount}>${money.toFixed(2)}</span>
                </div>
                <div className={styles.freePackTimer}>
                  <Gift size={20} />
                  <span className={styles.freePackText}>
                    {nextFreePackTime ? (
                      <>
                        Next free pack: {formatTimeRemaining(nextFreePackTime)}
                        {formatTimeRemaining(nextFreePackTime) === 'Available now!' && (
                          <button 
                            className={styles.claimButton}
                            onClick={handleClaimFreePack}
                          >
                            Claim Now!
                          </button>
                        )}
                      </>
                    ) : (
                      'Free booster every 6 hours!'
                    )}
                  </span>
                </div>
              </div>

              {/* Buy Section */}
              <div className={styles.buySection}>
                <h3>Buy Booster Packs</h3>
                <div className={styles.packOptions}>
                  {Object.entries(packs).map(([key, pack]) => {
                    const price = BOOSTER_PRICES[key] || 4.99;
                    const canAfford = money >= price;
                    
                    return (
                      <div
                        key={key}
                        className={`${styles.packOption} ${key === currentPack ? styles.selected : ''} ${!canAfford ? styles.cannotAfford : ''}`}
                      >
                        <div className={styles.packInfo}>
                          <h4>{pack.name}</h4>
                          <p className={styles.packPrice}>${price.toFixed(2)}</p>
                        </div>
                        <button
                          className={styles.buyButton}
                          onClick={() => {
                            const packPrice = BOOSTER_PRICES[key] || 4.99;
                            if (money >= packPrice) {
                              setMoney(prev => prev - packPrice);
                              // Add pack to inventory instead of opening it
                              setPackInventory(prev => ({
                                ...prev,
                                [key]: (prev[key] || 0) + 1
                              }));
                              addNotification({
                                message: `Added ${pack.name} pack to your collection!`,
                                type: 'success',
                                duration: 3000
                              });
                            } else {
                              addNotification({
                                message: 'Not enough money to buy this booster pack!',
                                type: 'error',
                                duration: 3000
                              });
                            }
                          }}
                          disabled={!canAfford}
                        >
                          Buy Pack
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sell Section */}
              <div className={styles.sellSection}>
                <div className={styles.sellHeader}>
                  <h3>Sell Cards from Collection</h3>
                  {!sellMode ? (
                    <button
                      className={styles.sellToggleButton}
                      onClick={() => setSellMode(true)}
                      disabled={collection.length === 0}
                    >
                      Start Selling
                    </button>
                  ) : (
                    <div className={styles.sellActions}>
                      <button
                        className={styles.sellConfirmButton}
                        onClick={sellSelectedCards}
                        disabled={selectedCards.size === 0}
                      >
                        Sell Selected ({selectedCards.size})
                      </button>
                      <button
                        className={styles.sellCancelButton}
                        onClick={cancelSellMode}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                
                {sellMode && (
                  <div className={styles.sellInstructions}>
                    <p>Click on cards to select them for selling</p>
                    <p>Selected cards will have a red border</p>
                  </div>
                )}

                {collection.length > 0 ? (
                  <div className={styles.collectionPreview}>
                    {collection.map((card) => (
                      <div
                        key={card.id}
                        className={`${styles.cardPreview} ${sellMode && selectedCards.has(card.id) ? styles.selected : ''}`}
                        onClick={() => sellMode && toggleCardSelection(card.id)}
                        style={{
                          borderColor: sellMode && selectedCards.has(card.id) ? '#ff0000' : getRarityColor(card.rarity)
                        }}
                      >
                        <img
                          src={card.image}
                          alt={card.name}
                          className={styles.cardImage}
                        />
                        <div className={styles.cardValue}>
                          ${card.price ? card.price.toFixed(2) : '0.10'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyCollection}>No cards to sell. Open some packs first!</p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default Store;
