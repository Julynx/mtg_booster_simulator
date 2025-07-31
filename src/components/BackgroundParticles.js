import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './BackgroundParticles.module.css';

/**
 * BackgroundParticles component that creates animated background particles.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpening - Whether a pack is currently opening
 * @param {Array} props.cards - Array of current cards
 * @returns {JSX.Element} The rendered background particles component
 */
const BackgroundParticles = ({ isOpening, cards }) => {
  const particleCount = 50;
  const openingParticleCount = 20;

  // Generate static particle positions and animations
  const particles = React.useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      xMovement: Math.random() * 100 - 50,
      yMovement: Math.random() * 100 - 50,
      duration: Math.random() * 10 + 10
    }));
  }, []);

  const openingParticles = React.useMemo(() => {
    return Array.from({ length: openingParticleCount }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight
    }));
  }, []);

  return (
    <>
      <div className={styles.particleContainer}>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className={styles.particle}
            animate={{
              x: [0, particle.xMovement],
              y: [0, particle.yMovement],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
          />
        ))}
      </div>
      <AnimatePresence>
        {isOpening && cards.length === 0 && (
          openingParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className={styles.openingParticle}
              initial={{
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                opacity: 1
              }}
              animate={{
                x: particle.x,
                y: particle.y,
                opacity: 0
              }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{
                left: 0,
                top: 0,
              }}
            />
          ))
        )}
      </AnimatePresence>
    </>
  );
};

export default BackgroundParticles;
