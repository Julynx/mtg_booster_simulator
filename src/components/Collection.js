import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, Filter } from 'lucide-react';
import { FixedSizeList } from 'react-window'; // Import FixedSizeList
import styles from './Collection.module.css';
import cardDisplayStyles from './CardDisplay.module.css'; // Import CardDisplay styles
import { isValidRarity } from '../utils';

const Collection = ({ collection, showCollection, setShowCollection, getRarityColor, setCollection, setMoney }) => {
  const [previewCard, setPreviewCard] = useState(null);
  const [previewFace, setPreviewFace] = useState(0);
  const [sortOption, setSortOption] = useState('name');
  const [filterRarity, setFilterRarity] = useState('all');
  const [filterFoil, setFilterFoil] = useState('all'); // New state for foil filter
  const [filterType, setFilterType] = useState('all'); // New state for type filter
  const [showFilters, setShowFilters] = useState(false);
  const [columnCount, setColumnCount] = useState(1); // New state for column count

  const cardTypes = useMemo(() => [
    "All", "Creature", "Instant", "Sorcery", "Land", "Artifact", "Enchantment",
    "Planeswalker", "Battle", "Conspiracy", "Dungeon", "Plane", "Scheme"
  ], []);
  
  const toggleCollection = useCallback(() => setShowCollection(prev => !prev), [setShowCollection]);
  const closeCollection = useCallback(() => setShowCollection(false), [setShowCollection]);

  const showCardPreview = useCallback((card) => {
    setPreviewCard(card);
    setPreviewFace(0);
  }, []);

  const closePreview = useCallback(() => setPreviewCard(null), []);

  const getCardImageStyle = useCallback((rarity) => { // Wrapped in useCallback
    const safeRarity = isValidRarity(rarity) ? rarity : 'common'; // Corrected typo
    return { borderColor: getRarityColor(safeRarity) };
  }, [getRarityColor]); // Added getRarityColor to dependencies

  // Ref to throttle rapid sell actions and avoid state thrash causing list to break
  const sellingRef = useRef(false);
  const sellQueueRef = useRef(0);

  const processSellQueue = useCallback(() => {
    if (sellingRef.current || sellQueueRef.current <= 0) return;
    sellingRef.current = true;
    const toSell = sellQueueRef.current;
    sellQueueRef.current = 0;

    // Batch state updates in a single mutation to keep react-window stable
    let soldValue = 0;
    let remainingToRemove = toSell;

    // Prefer removing by unique instance id to avoid unintended removals
    const newCollection = [];
    for (const card of collection) {
      if (
        remainingToRemove > 0 &&
        card.name === (cardDisplayCandidateRef.current?.name ?? '') && // best-effort name match from last clicked
        card.setCode === (cardDisplayCandidateRef.current?.setCode ?? card.setCode) &&
        card.foil === (cardDisplayCandidateRef.current?.foil ?? card.foil)
      ) {
        // remove this instance
        soldValue += card.price || 0.10;
        remainingToRemove -= 1;
      } else {
        newCollection.push(card);
      }
    }

    // Commit the batched state updates
    setCollection(newCollection);
    setMoney(prev => prev + soldValue);

    // Let the UI settle before allowing next batch
    setTimeout(() => {
      sellingRef.current = false;
      // If more queued while we were processing, handle them now
      if (sellQueueRef.current > 0) {
        processSellQueue();
      }
    }, 16); // roughly one frame (~60fps)
  }, [collection, setCollection, setMoney]);

  // Keep track of last clicked "group" candidate to scope deletions correctly
  const cardDisplayCandidateRef = useRef(null);

  const sellCard = useCallback((cardToSell, count = 1) => {
    // Remember which grouped card we are operating on
    cardDisplayCandidateRef.current = cardToSell;
    // Queue the amount to sell and process in a batched manner
    sellQueueRef.current += Math.max(1, count);
    processSellQueue();
  }, [processSellQueue]);

  const processedCards = useMemo(() => {
    let filtered = collection;

    if (filterRarity !== 'all') {
      filtered = filtered.filter(card => card.rarity === filterRarity);
    }

    if (filterFoil !== 'all') {
      filtered = filtered.filter(card => (filterFoil === 'foil' ? card.foil : !card.foil));
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(card => card.type && card.type.includes(filterType)); // Changed card.type_line to card.type
    }

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'name': return a.name.localeCompare(b.name);
        case 'rarity': return a.rarity.localeCompare(b.rarity);
        case 'price': return (b.price || 0) - (a.price || 0);
        case 'set': return (a.set || '').localeCompare(b.set || '');
        default: return 0;
      }
    });
  }, [collection, filterRarity, filterFoil, filterType, sortOption]);

  const groupedCards = useMemo(() => {
    return processedCards.reduce((acc, card) => {
      // Include foil status in the key to separate foil and non-foil versions
      const key = `${card.name}-${card.set || 'unknown'}-${card.foil ? 'foil' : 'nonfoil'}`;
      if (!acc[key]) {
        acc[key] = { ...card, count: 1, totalPrice: card.price || 0.10, foil: card.foil }; // Ensure foil property is passed
      } else {
        acc[key].count++;
        acc[key].totalPrice += card.price || 0.10;
      }
      return acc;
    }, {});
  }, [processedCards]);

  // Convert groupedCards object to an array for FixedSizeList
  const groupedCardsArray = useMemo(() => Object.values(groupedCards), [groupedCards]);

  // Row component for FixedSizeList
  // itemData will contain { groupedCardsArray, getCardImageStyle, showCardPreview, sellCard, columnCount }
  const Row = useCallback(({ index, style, data }) => {
    const { groupedCardsArray, getCardImageStyle, showCardPreview, sellCard, columnCount } = data;
    const startIndex = index * columnCount;
    const endIndex = Math.min(startIndex + columnCount, groupedCardsArray.length);

    return (
      <div
        style={{
          ...style,
          display: 'grid',
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          gap: '1.5rem',
          alignItems: 'flex-start'
        }}
      >
        {Array.from({ length: endIndex - startIndex }).map((_, colIndex) => {
          const cardGroup = groupedCardsArray[startIndex + colIndex];
          if (!cardGroup) return null;

          return (
            <motion.div
              key={`${cardGroup.name}-${cardGroup.set || 'unknown'}-${cardGroup.foil ? 'foil' : 'nonfoil'}`}
              className={`${styles.cardWrapper} ${cardGroup.foil ? styles.foilCardBackground : ''}`}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (startIndex + colIndex) * 0.02 }}
              style={{ width: '100%' }}
            >
              <div className={styles.cardContainer}>
                <motion.img
                  src={cardGroup.image}
                  alt={cardGroup.name}
                  className={styles.cardImage}
                  style={getCardImageStyle(cardGroup.rarity)}
                  onClick={() => showCardPreview(cardGroup)}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardName}>{cardGroup.name}</h3>
                  <div className={styles.cardDetails}>
                    <span className={styles.cardRarity}>{cardGroup.rarity}</span>
                    {cardGroup.set && cardGroup.setCode && (
                      <a
                        href={`https://scryfall.com/sets/${cardGroup.setCode.toLowerCase()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.cardSetLink}
                      >
                        {cardGroup.set}
                      </a>
                    )}
                    <span className={styles.cardPrice}>${cardGroup.price ? cardGroup.price.toFixed(2) : '0.10'}</span>
                  </div>
                  <div className={styles.cardActions}>
                    <span className={styles.cardCount}>{cardGroup.count} copies</span>
                    <button className={styles.sellButton} onClick={() => sellCard(cardGroup, 1)}>Sell 1</button>
                    {cardGroup.count > 1 && <button className={styles.sellAllButton} onClick={() => sellCard(cardGroup, cardGroup.count)}>Sell All</button>}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }, []); // Dependencies will be passed via itemData

  const modalContentRef = useRef(null);
  const [listHeight, setListHeight] = useState(0);

  useEffect(() => {
    const calculateDimensions = () => {
      if (modalContentRef.current) {
        const headerHeight = modalContentRef.current.querySelector(`.${styles.modalHeader}`).offsetHeight;
        const filterControlsHeight = showFilters ? modalContentRef.current.querySelector(`.${styles.filterControls}`).offsetHeight : 0;
        const padding = parseFloat(getComputedStyle(modalContentRef.current).paddingTop) + parseFloat(getComputedStyle(modalContentRef.current).paddingBottom);
        
        setListHeight(Math.max(0, modalContentRef.current.clientHeight - headerHeight - filterControlsHeight - padding));

        // Calculate column count
        const cardWidth = 250; // Minimum width of a card from CSS
        const containerWidth = modalContentRef.current.clientWidth - (parseFloat(getComputedStyle(modalContentRef.current).paddingLeft) + parseFloat(getComputedStyle(modalContentRef.current).paddingRight));
        setColumnCount(Math.max(1, Math.floor(containerWidth / cardWidth)));
      }
    };

    calculateDimensions(); // Initial calculation

    window.addEventListener('resize', calculateDimensions);
    return () => window.removeEventListener('resize', calculateDimensions);
  }, [showCollection, showFilters]); // Recalculate when modal opens or filters toggle

  // Memoize itemData to prevent unnecessary re-renders of Row
  const itemData = useMemo(() => ({
    groupedCardsArray,
    getCardImageStyle,
    showCardPreview,
    sellCard,
    columnCount
  }), [groupedCardsArray, getCardImageStyle, showCardPreview, sellCard, columnCount]);

  return (
    <>
      <motion.div className={styles.collectionButtonContainer} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.8 }}>
        <motion.button className={styles.collectionButton} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={toggleCollection}>
          <BookOpen size={24} />
          {collection.length > 0 && (
            <motion.div className={styles.collectionCount} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
              {collection.length}
            </motion.div>
          )}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showCollection && (
          <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={styles.modalContent} ref={modalContentRef} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Your Collection ({processedCards.length} cards)</h2>
                <div className={styles.headerActions}>
                  <button className={styles.filterButton} onClick={() => setShowFilters(!showFilters)}><Filter size={16} /></button>
                  <button className={styles.closeButton} onClick={closeCollection}>✕</button>
                </div>
              </div>

              {showFilters && (
                <div className={styles.filterControls}>
                  <div className={styles.filterGroup}>
                    <label>Sort by:</label>
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className={styles.sortSelect}>
                      <option value="name">Name</option>
                      <option value="rarity">Rarity</option>
                      <option value="price">Price</option>
                      <option value="set">Set</option>
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label>Filter by rarity:</label>
                    <select value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)} className={styles.select}>
                      <option value="all">All</option>
                      <option value="common">Common</option>
                      <option value="uncommon">Uncommon</option>
                      <option value="rare">Rare</option>
                      <option value="mythic">Mythic</option>
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label>Filter by foil:</label>
                    <select value={filterFoil} onChange={(e) => setFilterFoil(e.target.value)} className={styles.select}>
                      <option value="all">All</option>
                      <option value="foil">Foil</option>
                      <option value="nonfoil">Non-Foil</option>
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label>Filter by type:</label>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={styles.select}>
                      {cardTypes.map(type => (
                        <option key={type} value={type === "All" ? "all" : type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {Object.keys(groupedCards).length === 0 ? (
                <p className={styles.emptyCollection}>No cards collected yet. Open some packs!</p>
              ) : (
                <FixedSizeList
                  height={listHeight}
                  itemCount={Math.ceil(groupedCardsArray.length / columnCount)} // Number of rows
                  itemSize={369} // Adjusted height for equal vertical spacing (345px card height + 24px gap)
                  width="100%"
                  itemData={itemData} // Pass itemData to Row component
                  className={styles.collectionList} // Add a class to target the scrollbar
                >
                  {Row}
                </FixedSizeList>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewCard && (
          <motion.div className={styles.previewOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closePreview}>
            <motion.div className={styles.previewContent} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <button className={styles.previewCloseButton} onClick={closePreview}><X size={24} /></button>
              <motion.div
                className={styles.previewImageWrapper}
                onClick={() => previewCard.card_faces && setPreviewFace(prev => 1 - prev)}
                animate={{ rotateY: previewFace === 1 ? 180 : 0 }}
                transition={{ duration: 0.5 }}
                style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
              >
                <img src={previewCard.card_faces ? previewCard.card_faces[0] : previewCard.image} alt={previewCard.name} className={styles.previewImage} style={{ backfaceVisibility: 'hidden' }} />
                {previewCard.card_faces && <img src={previewCard.card_faces[1]} alt={previewCard.name} className={styles.previewImage} style={{ position: 'absolute', top: 0, left: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }} />}
                {previewCard.foil && (
                  <motion.div
                    className={cardDisplayStyles.foilOverlay}
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
                  {previewCard.set && <span className={styles.previewSet}>{previewCard.set}</span>}
                  {previewCard.foil && <span style={{
                    display: 'inline-block',
                    background: 'linear-gradient(to right, violet, indigo, blue, green, yellow, orange, red)',
                    color: 'white',
                    fontWeight: '600',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap'
                  }}>FOIL</span>} {/* Added foil tag */}
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
