import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion'; // Added AnimatePresence, useAnimation
import { DollarSign, Gift, ShoppingCart } from 'lucide-react';
import styles from './PackDisplay.module.css';

// New component for individual sparkle animation
const SparkleAnimation = ({ delay }) => {
  const controls = useAnimation();

  useEffect(() => {
    const animateSparkle = async () => {
      // Set initial random position and scale to 0
      const initialLeft = `${Math.random() * 100}%`;
      const initialTop = `${(Math.random() * 80)}%`; // Removed initialTopOffset
      await controls.set({ scale: 0, rotate: 0, left: initialLeft, top: initialTop });

      // Wait for initial delay
      await new Promise(resolve => setTimeout(resolve, delay * 1000));

      while (true) {
        // Appear and rotate (from current position)
        await controls.start({
          scale: 1,
          rotate: 180,
          transition: { duration: 2, ease: "easeInOut" } // Increased duration
        });

        // Disappear and rotate further
        await controls.start({
          scale: 0,
          rotate: 360,
          transition: { duration: 2, ease: "easeInOut" } // Increased duration
        });

        // Move invisibly to new random position
        const newLeft = `${Math.random() * 100}%`;
        const newTop = `${(Math.random() * 80)}%`; // Removed initialTopOffset
        await controls.set({ left: newLeft, top: newTop }); // Set new position while invisible
      }
    };

    animateSparkle();
  }, [controls, delay]);

  return (
    <motion.div
      className={styles.sparkle} // Keep only the base sparkle class for positioning
      animate={controls}
    >
      {/* A simple 4-point star SVG. Elongated points and curved sides are complex for direct SVG path. */}
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
const PackDisplay = ({ packs, currentPack, openPack, packInventory, onOpenStore, nextFreePackTime, claimFreePack }) => {
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
  const packCount = packInventory[availablePackType] || 0;

  const handleOpenPack = useCallback(() => {
    if (packConfig) { // Only open if packConfig is valid
      openPack(availablePackType);
    }
  }, [openPack, availablePackType, packConfig]);

  const handleStoreClick = useCallback(() => {
    onOpenStore();
  }, [onOpenStore]);


  // Animation configurations
  const containerAnimation = {
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.95 },
    initial: { opacity: 0, scale: 0 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.6, type: "spring", bounce: 0.4 }
  };

  const packAnimation = {
    // This animation is no longer used for the pack container itself,
    // but the variable is kept for consistency if needed elsewhere.
    // The image overlay handles the visual animation.
    transition: { duration: 2, repeat: Infinity }
  };

  // If no packs available, show store link
  if (totalPacks === 0) {
    return (
      <div className={styles.packDisplayContainer}>
        <motion.div
          className={styles.packDisplay}
          onClick={handleStoreClick}
          {...containerAnimation}
        >
            <motion.div
              className={`${styles.pack} bg-gradient-to-br from-gray-600 to-gray-800 ${styles.packNoPacksBorder}`}
              {...packAnimation}
            >
            {/* Pack label */}
            <div className={styles.label}>
              <ShoppingCart size={48} style={{ marginBottom: '0.5rem' }} />
              <span className={styles.packName}>No Packs Left</span>
              <span className={styles.cardCount}>Visit Store to Buy More</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Store Info */}
        <div className={styles.storeInfo}>
          <div className={styles.moneyInfo}>
            <DollarSign size={20} />
            <span className={styles.moneyText}>Free pack every 6 hours</span>
          </div>
          <div className={styles.freePackInfo}>
            <Gift size={20} />
            <span className={styles.freePackText}>
              {nextFreePackTime ? (
                <CountdownTimer targetTime={nextFreePackTime} />
              ) : (
                'Claim your free pack!'
              )}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!packConfig) {
    return (
      <div className={styles.packDisplayContainer}>
        <motion.div
          className={styles.packDisplay}
          onClick={handleStoreClick} // Direct to store if no pack config
          {...containerAnimation}
        >
          <motion.div
            className={`${styles.pack} bg-gradient-to-br from-gray-600 to-gray-800`}
            {...packAnimation}
          >
            {/* Pack label */}
            <div className={styles.label}>
              <ShoppingCart size={48} style={{ marginBottom: '0.5rem' }} />
              <span className={styles.packName}>Loading Packs...</span>
              <span className={styles.cardCount}>Please wait</span>
            </div>
          </motion.div>
        </motion.div>
        {/* Store Info */}
        <div className={styles.storeInfo}>
          <div className={styles.moneyInfo}>
            <DollarSign size={20} />
            <span className={styles.moneyText}>Free pack every 6 hours</span>
          </div>
          <div className={styles.freePackInfo}>
            <Gift size={20} />
            <span className={styles.freePackText}>
              {nextFreePackTime ? (
                <CountdownTimer targetTime={nextFreePackTime} />
              ) : (
                'Claim your free pack!'
              )}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.packDisplayContainer}>
      <motion.div
        className={styles.packDisplay}
        onClick={handleOpenPack}
        {...containerAnimation}
      >
        <AnimatePresence>
          {packConfig && ( // Only render pack if packConfig exists
            <motion.div
              key={packConfig.name} // Key for AnimatePresence to track
              className={styles.pack}
              exit={{ opacity: 0, scale: 1.5, rotate: 360, y: -100, transition: { duration: 0.5 } }} // Explosion animation
            >
              {/* New Shine Overlay */}
              <motion.div
                className={styles.shine}
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
              style={{
                maskImage: `url(${packConfig.image})`, // Use booster image as mask
                maskMode: 'alpha', // Mask based on alpha channel
                WebkitMaskImage: `url(${packConfig.image})`, // Webkit prefix
                WebkitMaskMode: 'alpha', // Webkit prefix
              }}
            />
            
            {/* Booster Image */}
            <motion.img
              src={packConfig.image}
              alt={packConfig.name}
              className={styles.packImage}
              animate={{
                filter: [
                  'drop-shadow(0 0 0px rgba(147, 51, 234, 0))',
                  'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))',
                  'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))', // Hold the shining state
                  'drop-shadow(0 0 0px rgba(147, 51, 234, 0))'
                ]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", times: [0, 0.35, 0.65, 1] }} // Adjusted times for longer hold
            />

            {/* Pack info below image */}
            <div className={styles.packInfoContainer}>
              <span className={styles.packName}>{packConfig.name}</span>
              <span className={styles.cardCount}>{packCount} packs available</span>
            </div>

          {/* Sparkle effects */}
          {Array.from({ length: 5 }).map((_, i) => ( // Render 5 SparkleAnimation components
            <SparkleAnimation key={i} delay={i * 0.2} />
          ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Store Info */}
      <div className={styles.storeInfo}>
        <div className={styles.moneyInfo}>
          <DollarSign size={20} />
          <span className={styles.moneyText}>Free pack every 6 hours</span>
        </div>
        <div className={styles.freePackInfo}>
          <Gift size={20} />
          <span className={styles.freePackText}>
            {nextFreePackTime ? (
              <CountdownTimer targetTime={nextFreePackTime} />
            ) : (
              'Claim your free pack!'
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PackDisplay;
