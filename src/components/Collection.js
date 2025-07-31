import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X } from 'lucide-react';
import styles from './Collection.module.css';
import { isValidRarity } from '../utils';

/**
 * Collection component that displays the user's collected cards in a modal.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.collection - Array of collected card objects
 * @param {boolean} props.showCollection - Whether the collection modal is visible
 * @param {Function} props.setShowCollection - Function to toggle collection visibility
 * @param {Function} props.getRarityColor - Function to get color for card rarity
 * @param {Function} props.setCollection - Function to update collection
 * @returns {JSX.Element} The rendered collection component
 */
const Collection = ({ collection, showCollection, setShowCollection, getRarityColor, setCollection }) => {
  const [previewCard, setPreviewCard] = useState(null);
  
  const toggleCollection = useCallback(() => {
    setShowCollection(prev => !prev);
  }, [setShowCollection]);

  const closeCollection = useCallback(() => {
    setShowCollection(false);
  }, [setShowCollection]);

  const showCardPreview = useCallback((card) => {
    setPreviewCard(card);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewCard(null);
  }, []);

  const getCardImageStyle = (rarity) => {
    // Fallback to common rarity if invalid
    const safeRarity = isValidRarity(rarity) ? rarity : 'common';
    return {
      borderColor: getRarityColor(safeRarity)
    };
  };

  // Animation configurations
  const buttonContainerAnimation = {
    initial: { opacity: 0, scale: 0 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.6, delay: 0.8 }
  };

  const buttonAnimation = {
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.9 }
  };

  const countAnimation = {
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: { type: "spring", bounce: 0.5 }
  };

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

  // Group cards by name and count duplicates
  const groupedCards = collection.reduce((acc, card) => {
    const key = card.name;
    if (!acc[key]) {
      acc[key] = {
        ...card,
        count: 1,
        totalPrice: card.price || 0.10
      };
    } else {
      acc[key].count += 1;
      acc[key].totalPrice += card.price || 0.10;
    }
    return acc;
  }, {});

  const groupedCardsArray = Object.values(groupedCards);

  // Sell card function
  const sellCard = useCallback((cardName, count = 1) => {
    setCollection(prev => {
      const cardsToRemove = [];
      const newCollection = prev.filter(card => {
        if (card.name === cardName && cardsToRemove.length < count) {
          cardsToRemove.push(card);
          return false;
        }
        return true;
      });
      return newCollection;
    });
  }, [setCollection]);

  return (
    <>
      <motion.div
        className={styles.collectionButtonContainer}
        {...buttonContainerAnimation}
      >
        <motion.button
          className={styles.collectionButton}
          {...buttonAnimation}
          onClick={toggleCollection}
        >
          <BookOpen size={24} />
          {collection.length > 0 && (
            <motion.div
              className={styles.collectionCount}
              {...countAnimation}
            >
              {collection.length}
            </motion.div>
          )}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showCollection && (
          <motion.div
            className={styles.modalOverlay}
            {...modalOverlayAnimation}
          >
            <motion.div
              className={styles.modalContent}
              {...modalContentAnimation}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Your Collection ({collection.length} cards)</h2>
                <button
                  className={styles.closeButton}
                  onClick={closeCollection}
                >
                  ✕
                </button>
              </div>

              {collection.length === 0 ? (
                <p className={styles.emptyCollection}>No cards collected yet. Open some packs!</p>
              ) : (
                <div className={styles.collectionGrid}>
                  {groupedCardsArray.map((cardGroup, index) => (
                    <motion.div
                      key={`${cardGroup.name}-${index}`}
                      className={styles.cardWrapper}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <div className={styles.cardContainer}>
                        <img
                          src={cardGroup.image}
                          alt={cardGroup.name}
                          className={styles.cardImage}
                          style={getCardImageStyle(cardGroup.rarity)}
                          onClick={() => showCardPreview(cardGroup)}
                        />
                        <div className={styles.cardInfo}>
                          <h3 className={styles.cardName}>{cardGroup.name}</h3>
                          <div className={styles.cardDetails}>
                            <span className={styles.cardRarity}>{cardGroup.rarity}</span>
                            <span className={styles.cardPrice}>${cardGroup.price ? cardGroup.price.toFixed(2) : '0.10'}</span>
                          </div>
                          <div className={styles.cardActions}>
                            <span className={styles.cardCount}>{cardGroup.count} copies</span>
                            <button 
                              className={styles.sellButton}
                              onClick={() => sellCard(cardGroup.name, 1)}
                            >
                              Sell 1
                            </button>
                            {cardGroup.count > 1 && (
                              <button 
                                className={styles.sellAllButton}
                                onClick={() => sellCard(cardGroup.name, cardGroup.count)}
                              >
                                Sell All
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
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
          >
            <motion.div
              className={styles.previewContent}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.previewCloseButton}
                onClick={closePreview}
              >
                <X size={24} />
              </button>
              <img
                src={previewCard.image}
                alt={previewCard.name}
                className={styles.previewImage}
              />
              <div className={styles.previewInfo}>
                <h3 className={styles.previewName}>{previewCard.name}</h3>
                <div className={styles.previewDetails}>
                  <span className={styles.previewRarity}>{previewCard.rarity}</span>
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

export default Collection;
