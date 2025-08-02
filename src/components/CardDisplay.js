import React, { useCallback, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './CardDisplay.module.css';
import { isValidRarity, validateCard } from '../utils';

const Card = ({ card, index, isFlipped, onFlip, getAuraColor, onPreview, animatingOut }) => {
  const controls = useAnimation();
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mounted.current) return; // Don't run if component is not mounted

    if (animatingOut) {
      controls.stop(); // Stop animations when animating out
      controls.set({ opacity: 0, scale: 1 }); // Reset to initial state
    } else {
      if (isFlipped) {
        controls.start({ opacity: 0.6, scale: 1.2, transition: { duration: 0.4 } });
      } else {
        controls.start({ opacity: 0, scale: 1, transition: { duration: 0.4 } });
      }
    }
  }, [isFlipped, controls, animatingOut]);

  const handleHoverStart = useCallback(() => {
    if (!mounted.current) return; // Add mounted check
    if (!isFlipped) {
      controls.start({ opacity: 0.6, scale: 1.2, transition: { duration: 0.3 } });
    }
  }, [isFlipped, controls]);

  const handleHoverEnd = useCallback(() => {
    if (!mounted.current) return; // Add mounted check
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
          onFlip(card.id, card.rarity); // Pass rarity to onFlip
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
              src={card.card_faces ? (card.card_faces[1] || card.image) : `${process.env.PUBLIC_URL}/assets/card_back.jpg`}
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
  const [showFrontFaceInPreview, setShowFrontFaceInPreview] = useState(true); // New state for preview card face

  const showCardPreview = useCallback((card) => {
    setPreviewCard(card);
    setShowFrontFaceInPreview(true); // Reset to front face when opening new preview
  }, []);
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
          >
            <motion.div
              className={styles.previewContent}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.previewCloseButton} onClick={closePreview}>
                <X size={24} />
              </button>
              <motion.div
                className={styles.previewImageWrapper}
                onClick={() => previewCard.card_faces && setShowFrontFaceInPreview(prev => !prev)}
                animate={{ rotateY: showFrontFaceInPreview ? 0 : 180 }}
                transition={{ duration: 0.5 }}
                style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
              >
                <img
                  src={previewCard.card_faces ? previewCard.card_faces[0] : previewCard.image}
                  alt={previewCard.name}
                  className={styles.previewImage}
                  style={{ backfaceVisibility: 'hidden' }}
                />
                {previewCard.card_faces && (
                  <img
                    src={previewCard.card_faces[1]}
                    alt={previewCard.name}
                    className={styles.previewImage}
                    style={{ position: 'absolute', top: 0, left: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  />
                )}
                {previewCard.foil && (
                  <motion.div
                    className={styles.foilOverlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </motion.div>
              <div className={styles.previewInfo}>
                <h3 className={styles.previewName}>{previewCard.name}</h3>
                <div className={styles.previewDetails}>
                  <span className={styles.previewRarity}>{previewCard.rarity}</span>
                  {previewCard.set && previewCard.setCode && (
                    <a
                      href={`https://scryfall.com/sets/${String(previewCard.setCode).toLowerCase()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.cardSetLink}
                    >
                      {previewCard.set} ({String(previewCard.setCode).toUpperCase()})
                    </a>
                  )}
                  {previewCard.foil && <span className={styles.foilTag}>FOIL</span>}
                  <span className={styles.previewPrice}>${previewCard.price ? previewCard.price.toFixed(2) : '0.10'}</span>
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
