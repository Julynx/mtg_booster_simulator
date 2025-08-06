import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import styles from './ActionButtons.module.css';

/**
 * ActionButtons component that provides controls for collecting cards.
 * 
 * @param {Object} props - Component props
 * @param {Set} props.flippedCards - Set of card IDs that are currently flipped
 * @param {Array} props.cards - Array of current cards
 * @param {Function} props.onAction - Function to handle button click (either reveal or collect)
 * @param {boolean} props.allCardsFlipped - True if all cards are flipped, false otherwise
 * @returns {JSX.Element} The rendered action buttons component
 */
const ActionButtons = ({ flippedCards, cards, onAction, allCardsFlipped }) => {
  const buttonText = allCardsFlipped ? 'Continue' : 'Reveal All';
  const actionType = allCardsFlipped ? 'collect' : 'reveal';

  const handleButtonClick = useCallback(() => {
    onAction(actionType);
  }, [onAction, actionType]);

  const containerAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: 1 }
  };

  const buttonAnimation = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 }
  };

  return (
    <motion.div
      className={styles.actionButtons}
      {...containerAnimation}
    >
      <motion.button
        className={`${styles.button} ${styles.collectButton}`}
        {...buttonAnimation}
        onClick={handleButtonClick}
      >
        {buttonText}
      </motion.button>
    </motion.div>
  );
};

export default ActionButtons;
