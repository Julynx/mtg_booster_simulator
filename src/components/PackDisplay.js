import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { DollarSign, Gift, ShoppingCart } from 'lucide-react';
import styles from './PackDisplay.module.css';

// New component for individual sparkle animation
const SparkleAnimation = ({ delay }) => {
  const controls = useAnimation();
  const isMounted = React.useRef(true);

  useEffect(() => {
    const animateSparkle = async () => {
      try {
        const initialLeft = `${Math.random() * 100}%`;
        const initialTop = `${Math.random() * 80}%`;
        await controls.set({ scale: 0, rotate: 0, left: initialLeft, top: initialTop });

        await new Promise(resolve => setTimeout(resolve, delay * 1000));

        while (isMounted.current) {
          await controls.start({
            scale: 1,
            rotate: 180,
            transition: { duration: 2, ease: 'easeInOut' }
          });

          if (!isMounted.current) break;

          await controls.start({
            scale: 0,
            rotate: 360,
            transition: { duration: 2, ease: 'easeInOut' }
          });

          if (!isMounted.current) break;

          const newLeft = `${Math.random() * 100}%`;
          const newTop = `${Math.random() * 80}%`;
          await controls.set({ left: newLeft, top: newTop });
        }
      } catch (error) {
        console.warn('Sparkle animation error:', error);
      }
    };

    animateSparkle();

    return () => {
      isMounted.current = false;
      controls.stop();
    };
  }, [controls, delay]);

  return (
    <motion.div className={styles.sparkle} animate={controls}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
      </svg>
    </motion.div>
  );
};

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
        setTimeRemaining('Available now!');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  return <span>{timeRemaining}</span>;
};

/**
 * PackDisplay component that shows an interactive booster pack or pack inventory.
 * Users can click to open the pack and see the cards inside.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.packs - Available pack configurations
 * @param {string} props.currentPack - The currently selected pack type
 * @param {Function} props.openPack - Function to trigger pack opening
 * @param {Object} props.packInventory - Current pack inventory
 * @param {Function} props.onOpenStore - Function to open the store
 * @param {Date} props.nextFreePackTime - Time when next free pack is available
 * @param {Function} props.claimFreePack - Function to claim free pack
 * @returns {JSX.Element} The rendered pack display component
 */
const PackDisplay = ({
  packs,
  currentPack,
  openPack,
  packInventory,
  onOpenStore,
  nextFreePackTime,
  claimFreePack
}) => {
  const totalPacks = Object.values(packInventory).reduce((sum, count) => sum + count, 0);

  // Get the first available pack type that has inventory
  const getFirstAvailablePack = () => {
    for (const [packType, count] of Object.entries(packInventory)) {
      if (count > 0) {
        return packType;
      }
    }
    return currentPack; // fallback to current pack
  };

  const availablePackType = getFirstAvailablePack();
  const packConfig = packs[availablePackType];

  const handleStoreClick = useCallback(() => {
    onOpenStore();
  }, [onOpenStore]);

  // Animation configurations
  const containerAnimation = {
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.95 },
    initial: { opacity: 0, scale: 0 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.6, type: 'spring', bounce: 0.4 }
  };

  // If no packs available, show store link
  if (totalPacks === 0) {
    return (
      <div className={styles.packDisplayContainer} style={{ marginTop: '13rem' }}>
        <motion.div className={styles.packDisplay} onClick={handleStoreClick} {...containerAnimation}>
          <motion.div className={`${styles.pack} bg-gradient-to-br from-gray-600 to-gray-800 ${styles.packNoPacksBorder}`}>
            <div className={styles.label}>
              <ShoppingCart size={48} style={{ marginBottom: '0.5rem' }} />
              <span className={styles.packName}>You have no packs</span>
              <span className={styles.cardCount}>Click to visit the Store</span>
            </div>
          </motion.div>
        </motion.div>

        <div className={styles.storeInfo}>
          <div className={styles.moneyInfo}>
            <DollarSign size={20} />
            <span className={styles.moneyText}>Free pack every 6 hours</span>
          </div>
          <div className={styles.freePackInfo}>
            <Gift size={20} />
            <span className={styles.freePackText}>
              {nextFreePackTime ? <CountdownTimer targetTime={nextFreePackTime} /> : 'Free pack every 6 hours'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!packConfig) {
    return (
      <div className={styles.packDisplayContainer}>
        <motion.div className={styles.packDisplay} onClick={handleStoreClick} {...containerAnimation}>
          <motion.div className={`${styles.pack} bg-gradient-to-br from-gray-600 to-gray-800`}>
            <div className={styles.label}>
              <ShoppingCart size={48} style={{ marginBottom: '0.5rem' }} />
              <span className={styles.packName}>Loading Packs...</span>
              <span className={styles.cardCount}>Please wait</span>
            </div>
          </motion.div>
        </motion.div>
        <div className={styles.storeInfo}>
          <div className={styles.moneyInfo}>
            <DollarSign size={20} />
            <span className={styles.moneyText}>Free pack every 6 hours</span>
          </div>
          <div className={styles.freePackInfo}>
            <Gift size={20} />
            <span className={styles.freePackText}>
              {nextFreePackTime ? <CountdownTimer targetTime={nextFreePackTime} /> : 'Free pack every 6 hours'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.packDisplayContainer}>
      <div className={styles.packsContainer}>
        {Object.entries(packInventory).map(([packType, count]) => {
          if (count <= 0) return null;
          const config = packs[packType];
          if (!config) {
            console.warn(`PackDisplay: Skipping rendering of packType "${packType}" because its configuration is missing.`);
            return null;
          }

          return (
            <motion.div
              key={packType}
              className={styles.packDisplay}
              onClick={() => openPack(packType)}
              {...containerAnimation}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${config.name}-${packType}`}
                  className={styles.pack}
                  style={{ transformOrigin: '50% 50%' }}
                  initial={false}
                  animate="idle" // Always idle, no more shake/explode
                  transition={undefined}
                >
                  {/* Shine Overlay */}
                  <motion.div
                    className={styles.shine}
                    initial={{ x: '-120%' }}
                    animate={{ x: '120%' }} // Simplified shine animation
                    transition={{
                      duration: 1.3,
                      repeat: Infinity,
                      ease: 'linear',
                      repeatDelay: 0.9
                    }}
                    style={{
                      maskImage: `url(${packConfig.image})`,
                      maskMode: 'alpha',
                      WebkitMaskImage: `url(${packConfig.image})`,
                      WebkitMaskMode: 'alpha'
                    }}
                  />

                  {/* Booster Image */}
                  <motion.img
                    src={config.image}
                    alt={config.name}
                    className={styles.packImage}
                    animate={{
                      filter: [
                            'drop-shadow(0 0 0px rgba(147, 51, 234, 0))',
                            'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))',
                            'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))',
                            'drop-shadow(0 0 0px rgba(147, 51, 234, 0))'
                          ],
                      scale: 1
                    }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                  />

                  {/* Pack info below image */}
                  <div className={styles.packInfoContainer}>
                    <span className={styles.packName}>{config.name}</span>
                    <span className={styles.cardCount}>{count} packs owned</span>
                  </div>

                  {/* Sparkle effects */}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SparkleAnimation key={i} delay={i * 0.2} />
                  ))}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Store Info */}
      <div className={styles.storeInfo}>
        <div className={styles.moneyInfo}>
          <DollarSign size={20} />
          <span className={styles.moneyText}>Free pack every 6 hours</span>
        </div>
        <div className={styles.freePackInfo}>
          <Gift size={20} />
          <span className={styles.freePackText}>
            {nextFreePackTime ? <CountdownTimer targetTime={nextFreePackTime} /> : 'Free pack every 6 hours'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PackDisplay;
