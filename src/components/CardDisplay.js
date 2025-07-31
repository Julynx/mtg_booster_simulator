import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, X } from 'lucide-react';
import styles from './CardDisplay.module.css';
import { isValidRarity } from '../utils';

/**
 * CardDisplay component that shows a grid of MTG cards that can be flipped.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.cards - Array of card objects to display
 * @param {Set} props.flippedCards - Set of card IDs that are currently flipped
 * @param {Function} props.flipCard - Function to flip a card
 * @param {Function} props.getAuraColor - Function to get aura color for rarity
 * @returns {JSX.Element} The rendered card display component
 */
const CardDisplay = ({ cards, flippedCards, flipCard, getAuraColor }) => {
  const [previewCard, setPreviewCard] = useState(null);
  
  const handleCardClick = useCallback((cardId) => {
    flipCard(cardId);
  }, [flipCard]);

  const showCardPreview = useCallback((card) => {
    setPreviewCard(card);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewCard(null);
  }, []);

  const getCardAnimationProps = (index) => ({
    initial: {
      opacity: 0,
      scale: 0,
      rotateY: 180,
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100
    },
    animate: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      x: 0,
      y: 0
    },
    transition: {
      duration: 0.8,
      delay: 0.1 * index,
      type: "spring",
      bounce: 0.3
    }
  });

  const getRarityAuraStyle = (rarity) => {
    // Fallback to common rarity if invalid
    const safeRarity = isValidRarity(rarity) ? rarity : 'common';
    const auraColor = getAuraColor(safeRarity);
    return {
      backgroundColor: auraColor,
      boxShadow: `0 0 20px ${auraColor}`
    };
  };

  // Validate card data before rendering
  const validateCard = (card) => {
    if (!card) return false;
    if (typeof card.id === 'undefined') return false;
    if (!card.name || typeof card.name !== 'string') return false;
    if (!card.rarity || typeof card.rarity !== 'string') return false;
    if (!card.image || typeof card.image !== 'string') return false;
    return true;
  };

  return (
    <div className={styles.cardGrid}>
      <AnimatePresence>
        {cards.map((card, index) => {
          console.log('Rendering card:', card); // Debug log
          // Skip invalid cards
          if (!validateCard(card)) {
            console.warn('Invalid card data:', card);
            return null;
          }
          
          // Additional validation for real cards
          if (card.image && (card.image.includes('placehold') || card.image.includes('placeholder'))) {
            console.log('Rendering placeholder card:', card.name);
          } else {
            console.log('Rendering real card:', card.name, card.image ? 'with image' : 'no image');
          }
          
          // Log card details for debugging
          console.log('Card details:', {
            id: card.id,
            name: card.name,
            rarity: card.rarity,
            image: card.image ? '✓ has image' : '✗ no image',
            price: card.price
          });

          return (
            <motion.div
              key={card.id}
              className={styles.cardContainer}
              {...getCardAnimationProps(index)}
              onClick={() => handleCardClick(card.id)}
            >
              <motion.div
                className={styles.cardWrapper}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  className={styles.card}
                  animate={flippedCards.has(card.id) ? { rotateY: 180 } : {}}
                  transition={{ duration: 0.6 }}
                >
                  {/* Card back */}
                  <div className={styles.cardBack}>
                    <div className={styles.cardBackContent}>
                      <Package size={24} style={{ margin: '0 auto 0.25rem' }} />
                      <span className={styles.cardBackText}>MTG</span>
                    </div>
                  </div>

                  {/* Card front (hidden initially) */}
                  <motion.div
                    className={styles.cardFront}
                    initial={{ opacity: 0 }}
                    animate={flippedCards.has(card.id) ? { opacity: 1 } : {}}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <img
                      src={card.image}
                      alt={card.name}
                      className={styles.cardImage}
                      onClick={(e) => {
                        e.stopPropagation();
                        showCardPreview(card);
                      }}
                    />
                  </motion.div>

                  {/* Rarity aura */}
                  <motion.div
                    className={styles.rarityAura}
                    style={getRarityAuraStyle(card.rarity)}
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 0.6, scale: 1.2 }}
                    animate={flippedCards.has(card.id) ? { opacity: 0.6, scale: 1.2 } : {}}
                    transition={{ duration: 0.5 }}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Card Preview Overlay */}
      <AnimatePresence>
        {previewCard && (
          <motion.div
            className={styles.previewOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePreview}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(5px)'
            }}
          >
            <motion.div
              className={styles.previewContent}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <button
                className={styles.previewCloseButton}
                onClick={closePreview}
                style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '0',
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <X size={24} />
              </button>
              <img
                src={previewCard.image}
                alt={previewCard.name}
                style={{
                  maxWidth: '80vw',
                  maxHeight: '70vh',
                  borderRadius: '12px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                  border: '3px solid white'
                }}
              />
              <div style={{
                textAlign: 'center',
                marginTop: '20px',
                color: 'white'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  margin: '0 0 10px 0'
                }}>{previewCard.name}</h3>
                <div style={{
                  display: 'flex',
                  gap: '20px',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <span style={{
                    textTransform: 'capitalize',
                    fontWeight: '600',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }}>{previewCard.rarity}</span>
                  <span style={{
                    color: '#10b981',
                    fontWeight: '700',
                    fontSize: '1.2rem'
                  }}>${previewCard.price ? previewCard.price.toFixed(2) : '0.10'}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CardDisplay;
