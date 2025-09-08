import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './PackOpeningScreen.module.css'; // Updated import path

const PackOpeningScreen = ({ packConfig, onAnimationComplete, triggerExplosion }) => {
  const [animationPhase, setAnimationPhase] = useState('idle'); // 'idle', 'shaking', 'exploding'
  const [showFlash, setShowFlash] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (packConfig) {
      let openingSound = null;
      try {
        openingSound = new Audio(`${process.env.PUBLIC_URL}/assets/flash3.wav`);
        openingSound.volume = 0.7;
        openingSound.playbackRate = 0.9;
        openingSound.play().catch(e => console.error("Error playing pack opening sound:", e));
        setAnimationPhase('shaking');
      } catch (error) {
        console.error("Error creating pack opening sound:", error);
      }

      return () => {
        if (openingSound) {
          openingSound.pause();
          openingSound.currentTime = 0;
        }
      };
    }
  }, [packConfig]);

  useEffect(() => {
    if (triggerExplosion) {
      let explosionSound = null;
      try {
        setAnimationPhase('exploding');
        setShowFlash(true);
        // Play explosion sound
        explosionSound = new Audio(`${process.env.PUBLIC_URL}/assets/flash2.wav`);
        explosionSound.volume = 0.5;
        explosionSound.playbackRate = 1.4;
        explosionSound.play().catch(e => console.error("Error playing explosion sound:", e));

        // Generate particles
        const numParticles = 50; // Increased number of particles
        const newParticles = Array.from({ length: numParticles }).map((_, i) => ({
          id: i,
          x: (Math.random() - 0.5) * 2, // -1 to 1
          y: (Math.random() - 0.5) * 2, // -1 to 1
          size: Math.random() * 8 + 4, // Increased size range (4 to 12)
          duration: Math.random() * 0.5 + 0.3, // 0.3 to 0.8
          delay: Math.random() * 0.1 // 0 to 0.1
        }));
        setParticles(newParticles);
      } catch (error) {
        console.error("Error in explosion effect:", error);
      }

      return () => {
        if (explosionSound) {
          explosionSound.pause();
          explosionSound.currentTime = 0;
        }
      };
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
        scale: { duration: 1.0, repeat: Infinity, repeatType: 'mirror' },
        rotate: { duration: 0.4, repeat: Infinity, repeatType: 'mirror' },
        filter: { duration: 1.6, repeat: Infinity, repeatType: 'mirror' }
      }
    },
    exploding: {
      scale: [1, 1.5, 0], // Scale up slightly then disappear quickly
      rotate: 0, // No rotation
      opacity: [1, 0.8, 0], // Fade out
      x: 0, // No horizontal movement for the pack itself
      y: 0, // No vertical movement for the pack itself
      filter: [
        'drop-shadow(0 0 15px rgba(255,255,255,0.8))',
        'drop-shadow(0 0 60px rgba(255,255,255,1))', // Brighter, wider flash
        'drop-shadow(0 0 0px rgba(255,255,255,0))'
      ],
      transition: {
        duration: 1, // Even faster explosion
        ease: 'easeOut'
      }
    }
  };

  const flashVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: [0, 1, 0],
      scale: [0, 1.5, 2],
      transition: { duration: 1.3, ease: 'easeOut' }
    }
  };

  const particleVariants = {
    hidden: { opacity: 0, scale: 0 },
    exploding: (i) => ({
      opacity: [1, 0],
      scale: [1, 0],
      x: i.x * 600, // Move outwards
      y: i.y * 600, // Move outwards
      transition: {
        duration: i.duration,
        delay: i.delay,
        ease: 'easeOut'
      }
    })
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1 } },
    exit: { opacity: 0, transition: { duration: 1 } }
  };

  return (
    <motion.div
      className={styles.overlay}
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {packConfig ? (
        <>
          {showFlash && (
            <motion.div
              className={styles.flashEffect}
              variants={flashVariants}
              initial="hidden"
              animate="visible"
              onAnimationComplete={() => setShowFlash(false)}
            />
          )}
          {particles.map(p => (
            <motion.div
              key={p.id}
              className={styles.particle}
              custom={p}
              variants={particleVariants}
              initial="hidden"
              animate={animationPhase === 'exploding' ? 'exploding' : 'hidden'}
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: `rgba(255, 255, 255, ${Math.random() * 0.4 + 0.6})`, // Increased minimum opacity (0.6 to 1.0)
                borderRadius: '50%',
                position: 'absolute',
                zIndex: 1001 // Above the pack image
              }}
            />
          ))}
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
        </>
      ) : (
        <div className={styles.spinner}></div>
      )}
    </motion.div>
  );
};

export default PackOpeningScreen;
