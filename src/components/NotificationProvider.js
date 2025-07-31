import React, { createContext, useContext, useReducer } from 'react';
import { AnimatePresence } from 'framer-motion';
import Notification from './Notification';
import styles from './NotificationProvider.module.css';

// Create context for notifications
const NotificationContext = createContext();

// Action types
const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';

// Reducer for managing notifications
const notificationReducer = (state, action) => {
  switch (action.type) {
    case ADD_NOTIFICATION:
      return [...state, { ...action.payload, id: Date.now() + Math.random() }];
    case REMOVE_NOTIFICATION:
      return state.filter(notification => notification.id !== action.payload.id);
    default:
      return state;
  }
};

/**
 * Notification Provider component that manages notification state
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} The rendered notification provider
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, dispatch] = useReducer(notificationReducer, []);

  // Add a new notification
  const addNotification = (notification) => {
    const notificationWithId = {
      ...notification,
      id: Date.now() + Math.random()
    };
    
    dispatch({
      type: ADD_NOTIFICATION,
      payload: notificationWithId
    });

    // Auto-remove notification after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(notificationWithId.id);
      }, notification.duration || 3000);
    }
  };

  // Remove a notification
  const removeNotification = (id) => {
    dispatch({
      type: REMOVE_NOTIFICATION,
      payload: { id }
    });
  };

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      <div className={styles.notificationContainer}>
        <AnimatePresence>
          {notifications.map((notification) => (
            <Notification
              key={notification.id}
              {...notification}
              onClose={removeNotification}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

/**
 * Hook to use notifications
 * @returns {Object} Notification context with addNotification and removeNotification functions
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationProvider;
