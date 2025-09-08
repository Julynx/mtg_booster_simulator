import React from 'react';
import { motion } from 'framer-motion';
import styles from './Header.module.css';
 
/**
 * Header component for the MTG Booster Simulator application.
 * Displays the main title and subtitle with animation effects.
 *
 * @returns {JSX.Element} The rendered header component.
 */
const Header = () => {
  const animationProps = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8 }
  };
 
  return (
    <motion.div
      className={styles.header}
      {...animationProps}
    >
      <h1 className={styles.title}>
        MTG Booster Pack Simulator
      </h1>
      <p className={styles.subtitle}>Experience virtual booster pack opening with realistic animations</p>
    </motion.div>
  );
};
 
export default Header;
