import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import styles from './Notification.module.css';

/**
 * Notification component for displaying beautiful notifications
 * @param {Object} props - Component props
 * @param {string} props.message - Notification message
 * @param {string} props.type - Notification type ('success', 'error', 'warning', 'info')
 * @param {number} props.duration - Duration in milliseconds (default: 3000)
 * @param {Function} props.onClose - Function to call when notification closes
 * @param {string} props.id - Unique identifier for the notification
 * @returns {JSX.Element} The rendered notification component
 */
const Notification = ({ message, type = 'info', duration = 3000, onClose, id }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(() => onClose(id), 300); // Wait for animation to complete
    }
  }, [onClose, id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <XCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return styles.success;
      case 'error':
        return styles.error;
      case 'warning':
        return styles.warning;
      default:
        return styles.info;
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className={`${styles.notification} ${getTypeClass()}`}
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.icon}>
        {getIcon()}
      </div>
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
      </div>
      <button
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </motion.div>
  );
};

export default Notification;
