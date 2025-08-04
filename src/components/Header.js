import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
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
    <>
      <Helmet>
        <title>MTG Booster Opener | Open Magic: The Gathering Packs Online</title>
        <meta
          name="description"
          content="Open MTG booster packs online with a realistic simulator. Explore sets, track your collection, and enjoy pack opening effects."
        />
        <link rel="canonical" href="https://julynx.github.io/mtg_booster_simulator/" />
        <meta property="og:title" content="MTG Booster Opener | Open Magic: The Gathering Packs Online" />
        <meta property="og:description" content="Open MTG booster packs online with a realistic simulator. Explore sets, track your collection, and enjoy pack opening effects." />
        <meta property="og:url" content="https://julynx.github.io/mtg_booster_simulator/" />
        <meta property="og:image" content="https://julynx.github.io/mtg_booster_simulator/readme_assets/homescreen.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MTG Booster Opener | Open Magic: The Gathering Packs Online" />
        <meta name="twitter:description" content="Open MTG booster packs online with a realistic simulator. Explore sets, track your collection, and enjoy pack opening effects." />
        <meta name="twitter:image" content="https://julynx.github.io/mtg_booster_simulator/readme_assets/homescreen.png" />
      </Helmet>
      <motion.div
        className={styles.header}
        {...animationProps}
      >
        <h1 className={styles.title}>
          MTG Booster Simulator
        </h1>
        <p className={styles.subtitle}>Experience the thrill of opening Magic packs</p>
      </motion.div>
    </>
  );
};
 
export default Header;
