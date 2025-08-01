# MTG Booster Simulator

A React-based Magic: The Gathering booster pack simulator that allows users to experience the thrill of opening virtual MTG booster packs.

**Note**: This project contains two React applications - the main application in the root `src/` directory and an obsolete duplicate in the `mtg-app/` directory. The root application is the active, maintained version.

## Features

- **Multiple Pack Types**: Choose from different MTG set themes
- **Interactive Card Flipping**: Click on cards to reveal their faces
- **Collection Tracking**: Save your opened cards to view your collection
- **Animated UI**: Smooth animations and visual effects using Framer Motion
- **Responsive Design**: Works on desktop and mobile devices

## Recent Updates (July 2025)

- **Store UI**: Fixed a visual bug that showed a duplicate dollar sign in the balance display.
- **Card Grid**:
  - Unflipped cards now have a hover glow effect.
  - The "Collect Cards" button now automatically flips all remaining cards before adding them to the collection.
- **Collection View**:
  - Redesigned the grid to have fewer columns and larger card images for better readability.
  - Fixed a bug where double-sided cards would not display correctly. You can now flip them in the preview modal.
  - Improved performance by preventing the entire grid from re-rendering when a card is sold.
- **Free Pack Timer**:
  - Implemented a fully functional countdown timer for free packs.
  - The app now correctly calculates and awards free packs that were earned while the user was offline.
  - **Note**: The timer is currently set to 2 minutes for testing purposes.

## Project Structure

```
src/
├── components/          # React components
│   ├── ...
├── config.js            # Application configuration constants
├── utils.js             # Utility functions
├── mtg-api.js           # Scryfall API fetching logic
├── App.js               # Main application component
└── index.js             # Entry point
```

## Refactored Improvements

### Code Quality Enhancements

1. **Better Component Structure**:
   - Added proper JSDoc comments to all components and functions
   - Used `useCallback` for event handlers to prevent unnecessary re-renders
   - Implemented `useMemo` for expensive computations
   - Added proper prop validation and documentation

2. **Enhanced Error Handling**:
   - Added card data validation to prevent rendering invalid cards
   - Implemented collection size limits to prevent memory issues
   - Added fallback mechanisms for invalid rarities
   - Added console warnings for debugging invalid data

3. **Improved Performance**:
   - Memoized expensive operations and configurations
   - Optimized re-renders with proper React hooks usage
   - Added early returns for invalid data
   - Implemented proper key props for list rendering

4. **Better Maintainability**:
   - Extracted all configuration constants into a dedicated `src/config.js` file.
   - Centralized all general helper functions in `src/utils.js`.
   - Separated concerns with clear component responsibilities.
   - Added comprehensive documentation.

### Key Components

#### App.js
The main application component that manages state and orchestrates all other components.

#### CardDisplay.js
Handles the grid of cards that can be flipped to reveal their faces. Includes:
- Animation configurations for card entrance
- Rarity-based aura effects
- Card validation and error handling
- Proper event handling with useCallback

#### Collection.js
Manages the user's card collection with:
- Modal display with smooth animations
- Card validation and filtering
- Collection size management
- Proper styling based on card rarity

#### BackgroundParticles.js
Creates animated background effects with:
- Static particle generation using useMemo
- Opening pack particle effects
- Performance-optimized animations

### Utility Functions

The `utils.js` file provides:
- `getRarityColor`: Maps rarities to hex colors.
- `getAuraColor`: Maps rarities to rgba colors for effects.
- `isValidRarity`: Validates rarity strings.
- `validateCard`: Validates the structure of a card object.
- `generateCards`: Generates placeholder cards as a fallback.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Dependencies

- React 18+
- Framer Motion for animations
- Lucide React for icons

## Development Guidelines

This project follows modern React best practices:
- Functional components with hooks
- Proper state management
- Component composition
- Performance optimization
- Error handling and validation
- Clean, documented code

## Future Improvements

Potential enhancements that could be added:
- Card database integration
- More realistic rarity distributions
- User authentication and cloud saving
- Advanced collection statistics
- Trading and sharing features
