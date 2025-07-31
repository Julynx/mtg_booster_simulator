import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import styles from './PackSelector.module.css';

/**
 * PackSelector component for selecting different MTG booster pack types.
 * 
 * @param {Object} props - Component props
 * @param {string} props.currentPack - The currently selected pack type
 * @param {Function} props.setCurrentPack - Function to update the selected pack
 * @param {Object} props.packs - Available pack configurations
 * @returns {JSX.Element} The rendered pack selector component
 */
const PackSelector = ({ currentPack, setCurrentPack, packs }) => {
  const handlePackChange = useCallback((event) => {
    setCurrentPack(event.target.value);
  }, [setCurrentPack]);

  const animationProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay: 0.2 }
  };

  return (
    <motion.div
      className={styles.packSelector}
      {...animationProps}
    >
      <div className={styles.selectContainer}>
        <select
          value={currentPack}
          onChange={handlePackChange}
          className={styles.select}
        >
          {Object.entries(packs).map(([key, pack]) => (
            <option key={key} value={key}>{pack.name}</option>
          ))}
        </select>
        <Package className={styles.icon} size={24} />
      </div>
    </motion.div>
  );
};

export default PackSelector;
