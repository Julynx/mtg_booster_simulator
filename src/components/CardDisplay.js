import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './CardDisplay.module.css';
import { isValidRarity, validateCard } from '../utils';

const Card = ({ card, index, isFlipped, onFlip, getAuraColor, onPreview, animatingOut }) => {
  const controls = useAnimation();

  useEffect(() => {
    if (!animatingOut) { // Only animate rarityAura if not animating out
      if (isFlipped) {
        controls.start({ opacity: 0.6, scale: 1.2, transition: { duration: 0.4 } });
      } else {
        controls.start({ opacity: 0, scale: 1, transition: { duration: 0.4 } });
      }
    }
  }, [isFlipped, controls, animatingOut]);

  const handleHoverStart = useCallback(() => {
    if (!isFlipped) {
      controls.start({ opacity: 0.6, scale: 1.2, transition: { duration: 0.3 } });
    }
  }, [isFlipped, controls]);

  const handleHoverEnd = useCallback(() => {
    if (!isFlipped) {
      controls.start({ opacity: 0, scale: 1, transition: { duration: 0.3 } });
    }
  }, [isFlipped, controls]);
  
  const getRarityAuraStyle = (rarity) => {
    const safeRarity = isValidRarity(rarity) ? rarity : 'common';
    const auraColor = getAuraColor(safeRarity);
    return {
      backgroundColor: auraColor,
      boxShadow: `0 0 30px 10px ${auraColor}`,
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: -100 }} // Only for initial mount
      animate={animatingOut ? {} : { opacity: 1, scale: 1, y: 0 }} // Animate to visible, or empty if animating out
      transition={{ duration: 0.5, delay: index * 0.05 }}
      exit={{ opacity: 0, scale: 0, y: 100, rotateY: 360, transition: { duration: 0.8 } }} // Exit animation
      className={styles.cardContainer}
      onClick={() => {
        if (isFlipped) { // If already flipped, preview
          onPreview(card);
        } else { // Otherwise, flip
          onFlip(card.id);
        }
      }}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
    >
      <motion.div className={styles.cardWrapper} whileHover={{ scale: 1.05 }}>
        <motion.div
          className={styles.card}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* BACK: for single-face cards show card back, for double-faced show the second face */}
          <div className={styles.cardBack}>
            <img
              src={card.card_faces ? (card.card_faces[1] || card.image) : "/assets/card_back.jpg"}
              alt={card.name}
              className={styles.cardBackImage}
            />
            {/* Optional subtle foil overlay on back face if foil */}
            {card.foil && card.card_faces && (
              <motion.div
                className={styles.foilOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </div>
          {/* FRONT: for double-face, show first face; otherwise card.image */}
          <motion.div
            className={styles.cardFront}
            initial={{ opacity: 0 }}
            animate={{ opacity: isFlipped ? 1 : 0 }}
            transition={{ duration: 0.1, delay: 0.2 }}
          >
            <img
              src={card.card_faces ? (card.card_faces[0] || card.image) : card.image}
              alt={card.name}
              className={styles.cardImage}
            />
            {card.foil && (
              <motion.div
                className={styles.foilOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Removed set/edition badge for regular-sized cards in pack view per requirements */}

      <motion.div
        className={styles.rarityAura}
        style={getRarityAuraStyle(card.rarity)}
        animate={controls}
      />
    </motion.div>
  );
};

const CardDisplay = ({ cards, flippedCards, flipCard, getAuraColor, animatingOut }) => {
  const [previewCard, setPreviewCard] = useState(null);

  const showCardPreview = useCallback((card) => setPreviewCard(card), []);
  const closePreview = useCallback(() => setPreviewCard(null), []);

  return (
    <>
      <div className={styles.cardGridWrapper}>
        <div className={styles.cardGrid}>
          <AnimatePresence>
            {cards.map((card, index) =>
              validateCard(card) ? (
                <Card
                  key={card.id}
                  card={card}
                  index={index}
                  isFlipped={flippedCards.has(card.id)}
                  onFlip={flipCard}
                  getAuraColor={getAuraColor}
                  onPreview={showCardPreview}
                  animatingOut={animatingOut} // New prop
                />
              ) : null
            )}
          </AnimatePresence>
        </div>
      </div>

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
              <motion.div
                style={{
                  position: 'relative',
                  borderRadius: '12px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                  border: '3px solid white',
                  maxWidth: '80vw',
                  maxHeight: '70vh',
                }}
              >
                <img
                  src={previewCard.card_faces ? (previewCard.card_faces[0] || previewCard.image) : previewCard.image}
                  alt={previewCard.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: '12px',
                  }}
                />
                {/* Show second face side-by-side area via click on image */}
                {previewCard.foil && (
                  <motion.div
                    className={styles.foilOverlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </motion.div>
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
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    textTransform: 'capitalize',
                    fontWeight: '600',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }}>{previewCard.rarity}</span>
                  {previewCard.set && previewCard.setCode && (
                    <a
                      href={`https://scryfall.com/sets/${String(previewCard.setCode).toLowerCase()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'white',
                        fontWeight: 600,
                        textDecoration: 'underline'
                      }}
                    >
                      {previewCard.set} ({String(previewCard.setCode).toUpperCase()})
                    </a>
                  )}
                  {previewCard.foil && <span style={{
                    display: 'inline-block',
                    background: 'linear-gradient(to right, violet, indigo, blue, green, yellow, orange, red)',
                    color: 'white',
                    fontWeight: '600',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap'
                  }}>FOIL</span>}
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
    </>
  );
};

export default CardDisplay;
