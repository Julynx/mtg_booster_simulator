import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Sparkles, DollarSign, Gift, ShoppingCart } from 'lucide-react';
import styles from './PackDisplay.module.css';

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
    openPack(availablePackType);
  }, [openPack, availablePackType]);

  const handleStoreClick = useCallback(() => {
    onOpenStore();
  }, [onOpenStore]);

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
    e.stopPropagation();
    if (claimFreePack) {
      const success = claimFreePack();
      if (success) {
        // Show notification or update UI
        console.log('Free pack claimed!');
      }
    }
  }, [claimFreePack]);

  // Animation configurations
  const containerAnimation = {
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.95 },
    initial: { opacity: 0, scale: 0 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.6, type: "spring", bounce: 0.4 }
  };

  const packAnimation = {
    animate: {
      boxShadow: [
        "0 0 20px rgba(147, 51, 234, 0.5)",
        "0 0 40px rgba(147, 51, 234, 0.8)",
        "0 0 20px rgba(147, 51, 234, 0.5)"
      ]
    },
    transition: { duration: 2, repeat: Infinity }
  };

  const shineAnimation = {
    animate: { x: [-200, 200] },
    transition: { duration: 3, repeat: Infinity, ease: "linear" }
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
            className={`${styles.pack} bg-gradient-to-br from-gray-600 to-gray-800`}
            {...packAnimation}
          >
            {/* Pack shine effect */}
            <motion.div
              className={styles.shine}
              {...shineAnimation}
            />
            
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
            <span className={styles.moneyText}>$100.00</span>
          </div>
          <div className={styles.freePackInfo}>
            <Gift size={20} />
            <span className={styles.freePackText}>Free pack every 6 hours</span>
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
        <motion.div
          className={`${styles.pack} bg-gradient-to-br ${packConfig.color}`}
          {...packAnimation}
        >
          {/* Pack shine effect */}
          <motion.div
            className={styles.shine}
            {...shineAnimation}
          />
          
          {/* Pack label */}
          <div className={styles.label}>
            <Package size={48} style={{ marginBottom: '0.5rem' }} />
            <span className={styles.packName}>{packConfig.name}</span>
            <span className={styles.cardCount}>{packCount} packs available</span>
          </div>

          {/* Sparkle effects */}
          {Array.from({ length: Math.min(5, packCount) }).map((_, i) => (
            <motion.div
              key={i}
              className={styles.sparkle}
              style={{
                left: `${20 + i * 15}%`,
                top: `${20 + (i % 3) * 20}%`,
              }}
              animate={{ 
                scale: [0, 1, 0],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            >
              <Sparkles size={16} />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Store Info */}
      <div className={styles.storeInfo}>
        <div className={styles.moneyInfo}>
          <DollarSign size={20} />
          <span className={styles.moneyText}>$100.00</span>
        </div>
        <div className={styles.freePackInfo}>
          <Gift size={20} />
          <span className={styles.freePackText}>Free pack every 6 hours</span>
        </div>
      </div>
    </div>
  );
};

export default PackDisplay;
