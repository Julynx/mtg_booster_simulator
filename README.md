# MTG Booster Simulator

A React-based Magic: The Gathering booster pack simulator that allows users to experience the thrill of opening virtual MTG booster packs.

**Note**: This project contains two React applications - the main application in the root `src/` directory and an obsolete duplicate in the `mtg-app/` directory. The root application is the active, maintained version.

## Features

- **Multiple Pack Types**: Choose from different MTG set themes
- **Interactive Card Flipping**: Click on cards to reveal their faces
- **Collection Tracking**: Save your opened cards to view your collection
- **Animated UI**: Smooth animations and visual effects using Framer Motion
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
src/
├── components/          # React components
│   ├── ActionButtons.js # Collection and reset controls
│   ├── BackgroundParticles.js # Animated background effects
│   ├── CardDisplay.js   # Card grid and flipping mechanics
│   ├── Collection.js    # Collection modal and display
│   ├── Header.js        # Application header
│   ├── PackDisplay.js   # Interactive booster pack
│   └── PackSelector.js # Pack type selector
├── utils.js             # Utility functions and color mappings
├── App.js               # Main application component
└── App.module.css       # Main application styles
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
   - Extracted configuration constants for easy modification
   - Created reusable utility functions
   - Separated concerns with clear component responsibilities
   - Added comprehensive documentation

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
- `getRarityColor`: Maps rarities to hex colors
- `getAuraColor`: Maps rarities to rgba colors for effects
- `isValidRarity`: Validates rarity strings
- Proper fallback mechanisms for invalid inputs

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
