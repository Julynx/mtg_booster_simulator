import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import styles from './Store.module.css';
import { useNotification } from './NotificationProvider';

/**
 * CountdownTimer component that displays a countdown to a target time
 * @param {Object} props - Component props
 * @param {Date} props.targetTime - The target time to count down to
 * @returns {JSX.Element} The rendered countdown timer
 */
const CountdownTimer = ({ targetTime }) => {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = targetTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('00:00:00');
        return;
      }
      
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [targetTime]);

  return <span className={styles.countdownText}>{timeRemaining}</span>;
};

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
 * @param {boolean} props.showCollection - Whether collection is visible
 * @param {Function} props.setShowCollection - Function to set collection visibility
 * @returns {JSX.Element} The rendered store component
 */
const Store = ({ money, setMoney, collection, setCollection, openPack, packs, currentPack, showStore, setShowStore, setPackInventory, packInventory, nextFreePackTime, claimFreePack, showCollection, setShowCollection }) => {
  const { addNotification } = useNotification();

  const handleBuyPack = useCallback((key, pack, price) => {
    if (money >= price) {
      setMoney(prev => prev - price);
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
  }, [money, setMoney, setPackInventory, addNotification]);


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
      <Helmet>
        <title>MTG Booster Store | Buy Virtual Booster Packs</title>
        <meta
          name="description"
          content="Buy virtual MTG booster packs using in-app currency. Explore latest sets and add packs to your inventory."
        />
        <link rel="canonical" href="https://julynx.github.io/mtg_booster_simulator/store" />
        <meta property="og:title" content="MTG Booster Store | Buy Virtual Booster Packs" />
        <meta property="og:description" content="Buy virtual MTG booster packs using in-app currency. Explore latest sets and add packs to your inventory." />
        <meta property="og:url" content="https://julynx.github.io/mtg_booster_simulator/store" />
        <meta property="og:image" content="https://julynx.github.io/mtg_booster_simulator/readme_assets/homescreen.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MTG Booster Store | Buy Virtual Booster Packs" />
        <meta name="twitter:description" content="Buy virtual MTG booster packs using in-app currency. Explore latest sets and add packs to your inventory." />
        <meta name="twitter:image" content="https://julynx.github.io/mtg_booster_simulator/readme_assets/homescreen.png" />
      </Helmet>
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
              <h2 className={styles.modalTitle}>MTG Booster Pack Store</h2>
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
                  <span className={styles.moneyAmount}>${money.toFixed(2)}</span>
                </div>
                <div className={styles.freePackTimer}>
                  <Gift size={20} />
                  <span className={styles.freePackText}>
                    {nextFreePackTime && new Date() < nextFreePackTime ? (
                      <>
                        Next free pack in <CountdownTimer targetTime={nextFreePackTime} />
                      </>
                    ) : (
                      'A free pack has been added to your inventory!'
                    )}
                  </span>
                </div>
              </div>

              {/* Buy Section */}
              <div className={styles.buySection}>
                <h3>Buy Booster Packs</h3>
                <div className={styles.packOptions}>
                  {Object.entries(packs).map(([key, pack]) => {
                    const price = pack.price;
                    const canAfford = money >= price;
                    
                    return (
                      <motion.div
                        key={key}
                        className={`${styles.packOption} ${key === currentPack ? styles.selected : ''} ${!canAfford ? styles.cannotAfford : ''}`}
                      >
                        <motion.img
                          src={pack.image}
                          alt={pack.name}
                          className={styles.packImage}
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        />
                        <div className={styles.packInfo}>
                          <h4>{pack.name}</h4>
                          <p className={styles.packPrice}>${price.toFixed(2)}</p>
                        </div>
                        <button
                          className={styles.buyButton}
                          onClick={() => handleBuyPack(key, pack, price)}
                          disabled={!canAfford}
                        >
                          Buy Pack
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Collection Link */}
              <div className={styles.collectionLinkSection}>
                <button
                  className={styles.sellToggleButton}
                  onClick={() => {
                    setShowStore(false);
                    setShowCollection(true);
                  }}
                >
                  Sell Cards
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default Store;
