import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './PackOpeningScreen.module.css'; // Updated import path

const PackOpeningScreen = ({ packConfig, onAnimationComplete, triggerExplosion }) => {
  const [animationPhase, setAnimationPhase] = useState('idle'); // 'idle', 'shaking', 'exploding'

  useEffect(() => {
    if (packConfig) {
      // Start shaking animation immediately when packConfig is available
      setAnimationPhase('shaking');
    }
  }, [packConfig]);

  useEffect(() => {
    // Trigger explosion when App.js signals it
    if (triggerExplosion) {
      setAnimationPhase('exploding');
    }
  }, [triggerExplosion]);

  // Variants for the pack animation
  const packVariants = {
    idle: {
      scale: 1,
      rotate: 0,
      filter: 'drop-shadow(0 0 0px rgba(255,255,255,0))'
    },
    shaking: {
      scale: [1, 1.05, 1],
      rotate: [0, 5, -5, 0],
      filter: [
        'drop-shadow(0 0 0px rgba(255,255,255,0))',
        'drop-shadow(0 0 15px rgba(255,255,255,0.8))',
        'drop-shadow(0 0 0px rgba(255,255,255,0))'
      ],
      transition: {
        scale: { duration: 0.5, repeat: Infinity, repeatType: 'mirror' },
        rotate: { duration: 0.2, repeat: Infinity, repeatType: 'mirror' },
        filter: { duration: 0.8, repeat: Infinity, repeatType: 'mirror' }
      }
    },
    exploding: {
      scale: [1, 2, 0], // Scale up significantly before disappearing
      rotate: [0, 180, 720], // More rotation
      opacity: [1, 0.8, 0], // Fade out
      x: [0, Math.random() * 100 - 50, Math.random() * 200 - 100], // Random horizontal movement
      y: [0, Math.random() * 100 - 50, Math.random() * 200 - 100], // Random vertical movement
      filter: [
        'drop-shadow(0 0 15px rgba(255,255,255,0.8))',
        'drop-shadow(0 0 40px rgba(255,255,255,1))', // Brighter flash
        'drop-shadow(0 0 0px rgba(255,255,255,0))'
      ],
      transition: {
        duration: 0.6, // Faster explosion
        ease: 'easeOut'
      }
    }
  };

  return (
    <div className={styles.overlay}>
      {packConfig ? (
        <motion.img
          src={packConfig.image}
          alt={packConfig.name}
          className={styles.packImage}
          variants={packVariants}
          animate={animationPhase}
          onAnimationComplete={(definition) => {
            if (definition === 'exploding' && onAnimationComplete) {
              onAnimationComplete();
            }
          }}
        />
      ) : (
        <div className={styles.spinner}></div>
      )}
    </div>
  );
};

export default PackOpeningScreen;
