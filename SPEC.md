# MTG Booster Opener — Project Specification

Repository purpose
A React single-page application that simulates opening Magic: The Gathering booster packs using real card data from the Scryfall API. It provides animated pack opening, collection tracking with filters and selling, periodic free packs, and an in-app store to buy packs using virtual currency. Deployed to GitHub Pages.

Live URL
- https://julynx.github.io/mtg_booster_simulator

High-level architecture
- Frontend: React (create-react-app, react-scripts 5)
- State persistence: localStorage for collection, money, free pack timers, and pack inventory
- Data source: Scryfall REST API (no server)
- UI effects and animation: framer-motion
- Icons: lucide-react
- Virtualized lists: react-window (collection view)
- SEO/Meta: react-helmet-async + static index.html meta, sitemap, robots
- Assets: public/assets (pack images, sound effects, etc.)
- Deployment: build for GitHub Pages, assets hosted under /mtg_booster_simulator

Key user flows

1) First visit and initialization
- On first load, user is granted starting money (APP_CONFIG.startingMoney = 20.00) if no prior money is stored.
- A “free pack every 6 hours” timer is initialized and tracked via localStorage.
- Boosters are dynamically loaded from a source-of-truth module and mapped (name, code, image, price, and slot configuration).

2) Viewing available packs
- Home screen shows Store button (money badge) and a pack display area.
- If the user has inventory, each owned pack type is shown; otherwise a “You have no packs” tile with link to the store and next free pack countdown.

3) Buying packs
- Store modal lists available booster products (from config), their prices, and a Buy action.
- Purchasing decreases money and increases inventory for selected pack.
- SEO metadata for the store route is set with Helmet.

4) Claiming free packs
- A free pack can be claimed every APP_CONFIG.freePackInterval (6 hours). A countdown indicates time remaining.
- When earned, a random pack type is chosen from the loaded pack types and added to inventory automatically. The last-free time is updated.

5) Opening a pack
- The user selects a pack tile in inventory to open it.
- The “PackOpeningScreen” overlay plays sound and a short shake; once real card data is fetched successfully, an explosion effect completes and the cards appear.
- Card fetching uses Scryfall API with a slot-driven model:
  - Each booster in src/data/boosters.js defines slot counts and odds (common/uncommon/rare/mythic, land/wildcard, foil flags).
  - The API layer composes Scryfall queries per slot and retrieves suitable random cards. If a slot explicitly requires foil, the fetch constrains finishes via query; otherwise finishes are not forced.
  - Returned raw cards are normalized into an app-specific shape and assigned a unique instance id.

6) Collection and selling
- Cards are added to the collection immediately after successful API retrieval (before the user flips/reveals them) to prevent “cheat-reset” by page close.
- The collection modal supports sorting (name, rarity, price, set, dateObtained), filtering (rarity/foil/type), grouping duplicates (by name + set + foil), and selling one or all in a grouped set.
- Selling increases money by card price or a minimum default (0.10) when price is missing.
- Double-faced cards can be previewed and flipped in both the in-pack view and the collection preview.

7) Reveal/continue flow
- In the card display view, the user can flip each card or press “Reveal All.”
- When all cards are flipped, the action button becomes “Continue,” which triggers an exit animation and returns to the pack selection screen.

Core modules and responsibilities

Entry and shell
- [src/index.js](src/index.js:1): Create React root, render App, web vitals hook.
- [src/App.js](src/App.js:1): Main application component, orchestrates:
  - State: packs, currentPack, collection, money, packInventory, timing for free packs, in-flight opening sequence, loading overlays, and UI modal visibility.
  - Effects: initialize boosters from the local module; load persisted state; compute/claim free packs; persist changes back to localStorage.
  - Opening sequence: validates inventory, decrements a pack, fetches cards per booster slot config via mtg-api, appends to collection with dateObtained, triggers visuals.
  - Routes meta: sets default Helmet meta tags.
  - UI composition: Header, PackDisplay, CardDisplay + ActionButtons, Collection modal, Store modal, BackgroundParticles, PackOpeningScreen overlay, and legal footer.

Configuration and static data
- [src/config.js](src/config.js:1): APP_CONFIG with maxCollectionSize, startingMoney, freePackInterval.
- [src/data/boosters.js](src/data/boosters.js:1): Authoritative list of available boosters and their per-slot composition. The structure supports:
  - count: number of occurrences for the slot
  - pool: “common/uncommon/rare/mythic/land/wildcard”
  - odds: weighted rarity selection for a slot (e.g., rare vs mythic)
  - foil: explicit boolean; if true/false, API constrains finish; if omitted, finish is unconstrained
  - resolver: function to compute slot parameters at runtime

Utilities and API
- [src/utils.js](src/utils.js:1):
  - loadBoosters(): Converts BOOSTERS array into the packs object keyed by lowercase code; computes image URL; passes through slots to the app.
  - getRarityColor(), getAuraColor(): color mappings.
  - isValidRarity(), validateCard(): validation helpers.
- [src/mtg-api.js](src/mtg-api.js:1):
  - fetchBoosterPack(setCode, slots?): When slots array is provided (preferred), iterates slots and composes Scryfall “/cards/random?q=” queries to respect rarity, pool, land handling, and explicit foil constraints. Falls back to a legacy 14-slot construction if no slots provided.
  - formatCardData(raw, explicitFoil?): Converts Scryfall card to app model:
    - id: unique instance id per card (originalId preserved)
    - name, rarity normalized, image (single or double-faced handling), price derivation (prefers usd_foil when foil), type, set name, set code
    - foil: only true when explicitly set by pack slot; does not infer from Scryfall “foil available”.
  - fetchRandomCard(), fetchCardsBySet(): helper functions; basic cache for set queries.
  - getPriceCategory(price): convenience categorization.

UI Components
- [src/components/Header.js](src/components/Header.js:1): Title banner with Helmet meta for homepage.
- [src/components/PackDisplay.js](src/components/PackDisplay.js:1): Shows the user’s owned packs; if none, shows store link and free-pack timer. Clicking a pack triggers opening.
- [src/components/PackOpeningScreen.js](src/components/PackOpeningScreen.js:1): Overlay with sound and visual effects that runs during open. Explosion is triggered once cards are fetched.
- [src/components/BackgroundParticles.js](src/components/BackgroundParticles.js:1): Ambient background particle animation; temporary burst while opening and before cards render.
- [src/components/CardDisplay.js](src/components/CardDisplay.js:1): Renders the opened cards grid, flip/reveal interactions, rarity aura, foil overlay, and preview modal for large view with double-face flip.
- [src/components/ActionButtons.js](src/components/ActionButtons.js:1): Single CTA that toggles between “Reveal All” and “Continue”.
- [src/components/Store.js](src/components/Store.js:1): Store modal to buy packs and to open collection quickly; displays next free pack countdown and current money; SEO meta for store route.
- [src/components/Collection.js](src/components/Collection.js:1): Collection modal with:
  - Sorting and filtering controls (rarity, foil, type).
  - Grouping duplicates (by name, set, foil) with copy counts and aggregate pricing.
  - Virtualized list (react-window) with adaptive column count based on available width.
  - Sell 1 / Sell All for grouped cards.
  - “Reset” action that clears localStorage and reloads the app.
- Notifications
  - [src/components/NotificationProvider.js](src/components/NotificationProvider.js:1): Context and reducer to enqueue/dismiss notifications, renders [Notification](src/components/Notification.js:1) list via AnimatePresence.
  - [src/components/Notification.js](src/components/Notification.js:1): Animated toasts for success/error/warning/info.

Styling
- CSS Modules per component:
  - [App.module.css](src/App.module.css:1)
  - [PackDisplay.module.css](src/components/PackDisplay.module.css:1)
  - [CardDisplay.module.css](src/components/CardDisplay.module.css:1)
  - [Collection.module.css](src/components/Collection.module.css:1)
  - [Store.module.css](src/components/Store.module.css:1)
  - [BackgroundParticles.module.css](src/components/BackgroundParticles.module.css:1)
  - [Notification*.module.css](src/components/Notification.module.css:1), [NotificationProvider.module.css](src/components/NotificationProvider.module.css:1)
- Global CSS: [index.css](src/index.css:1)
- Assets:
  - public/assets/boosters/*.png (pack images, normalized via helper script)
  - public/assets/card_back.jpg (back face)
  - public/assets/flash1.wav|flash2.wav|flash3.wav (SFX)

SEO and PWA
- [public/index.html](public/index.html:1): Canonical URL, OpenGraph, Twitter Card meta, JSON-LD, theme color.
- [src/App.js](src/App.js:562): Helmet default meta; components set route-specific meta where appropriate.
- [public/sitemap.xml](public/sitemap.xml:1), [public/robots.txt](public/robots.txt:1): Search indexing enabled; sitemap targets GitHub Pages base path.
- [public/manifest.json](public/manifest.json:1): PWA manifest (standalone), icons, theme.

Persistence model (localStorage keys)
- mtgCollection: array of card objects (normalized shape), appended on successful pack fetch; includes dateObtained timestamp.
- mtgPendingOpenedCards: temporary list of ids to guard against reloads during open; cleared on “Continue.”
- mtgMoney: current virtual currency value.
- mtgLastFreePack: ISO string of last free pack time; used to compute next free pack and catch-up awarding on return.
- mtgPackInventory: object map of packType -> count.

Booster configuration model
Defined in [src/data/boosters.js](src/data/boosters.js:1). Each booster:
- name: string
- code: set code (used for Scryfall set queries)
- image: path under public/assets/boosters/
- price: number in USD-equivalent virtual currency
- slots: array of slot definitions (applied in order)
Slot
- count: number | (ctx) => number
- pool: 'common'|'uncommon'|'rare'|'mythic'|'land'|'wildcard'|string
- odds?: mapping rarity->weight (sums to 1) used when pool indicates a broader basket
- foil?: boolean (explicit foil/nonfoil constraint; omit to allow either)
- resolver?: (ctx) => { rarity, foil?, pool? } dynamic slot resolution
Default templates provided:
- DEFAULT_SLOTS (14-card model): 7C, 3U, 1R/M, 1 land (20% foil), 1 wildcard non-foil, 1 wildcard foil.
- SLOTS_12_CARDS: tuned layout with 12 cards and same special slots.

Card data model (normalized)
Produced by [formatCardData](src/mtg-api.js:331):
- id: unique per-instance identifier (originalId preserved)
- originalId: Scryfall card id
- name: string
- rarity: 'common'|'uncommon'|'rare'|'mythic'
- image: primary image URL (or placeholder)
- card_faces?: [frontImageUrl, backImageUrl] for double-faced cards
- price: number derived from Scryfall prices (usd_foil for marked foil, otherwise usd, fallback to 0)
- type: type_line or 'Unknown'
- set: set_name
- setCode: set code (lowercase)
- collectorNumber: string
- foil: boolean (true only if the slot explicitly set foil)

Animation and SFX overview
- Pack opening:
  - Opening sound on overlay mount; shaking loop.
  - On triggerExplosion: white flash, particle burst, pack scales out and fades; on completion, callback stops loading overlay.
- Card flips:
  - Each flip adjusts an aura glow; rarity-based pitch on flip sound; double-faced cards use back image or standard card_back.jpg for the back.
- Background particles:
  - Ambient wanderers behind UI; a burst distributed from center while waiting for cards after clicking open.

Error handling and resilience
- API failures:
  - Errors are caught and surfaced via notifications; the opening overlay is dismissed and state reset.
  - Slot fetch attempts to back off to a generic random card when constrained queries fail. Legacy mode ensures a full pack in no-slot case, padding with placeholders if necessary.
- Persistence:
  - Defensive JSON parsing when restoring localStorage.
  - “Pending opened” ids mechanism prevents dupes on reload during open; collection is authoritative and saved immediately.
- Limits:
  - Collection capped by APP_CONFIG.maxCollectionSize to prevent runaway growth.

Environment and configuration
- Env example: [.env.example](.env.example:1). Note: only REACT_APP_* keys are exposed to client builds; API base currently hardcoded in mtg-api.js.
- Build/Run (from [package.json](package.json:1)):
  - start: react-scripts start
  - build: PUBLIC_URL=/mtg_booster_simulator react-scripts build
  - deploy: gh-pages -d build -b gh-pages (requires gh-pages dev dependency in environment)
  - postbuild: echoes sitemap location
- Browserslist configured for CRA defaults.

Testing
- CRA default test scaffold is present, but the test [App.test.js](src/App.test.js:1) is not aligned with the current UI and will fail (“learn react” text is not rendered). setupTests includes jest-dom.

Assets pipeline helper
- [process_boosters.py](process_boosters.py:1): PIL-based script to autocrop and resize booster images to consistent height (300px) for uniform layout in store and inventory.

Security/Privacy considerations
- No backend; all data stored locally in the browser’s localStorage.
- External API calls originate from client to Scryfall. No API keys required.
- Prices come directly from Scryfall’s usd/usd_foil fields; can be zero or missing.

Known constraints and trade-offs
- Client-only construction of pack contents means odds are best-effort using Scryfall’s search, not authoritative for each set’s real booster rules.
- Network dependence for images/prices; transient failures trigger placeholder cards or empty prices.
- Double-faced cards: shows face images by URL without additional rules; foil visual is simulated overlay, not intrinsic to the image.
- GitHub Pages pathing: PUBLIC_URL and canonical links assume /mtg_booster_simulator base path.

Roadmap and TODO alignment
- Completed (from [TODO.md](TODO.md:1)):
  - Starting money reduced to $20.
  - Opening sequence refactor with delayed explosion until cards are fetched.
  - Foil price logic corrected to prefer usd_foil when foil.
  - Cards are committed to collection immediately on open.
  - Preview parity and double-faced flip in pack and collection.
  - Booster definition moved to JS module with flexible slots/odds.
  - “Reset data” control added.
  - Total collection value surfaced in collection header.
  - Legal disclaimer present on main screen.
  - Deployment-ready with sitemap, robots, env example.
- Pending:
  - Include one random non-playable card per pack if the set supports it:
    - API: GET "https://api.scryfall.com/cards/random?q=set:{SET}+(layout:token OR layout:emblem OR layout:art_series)"
    - If 404/empty, skip. This would fit as an additional slot in each booster with conditional resolver.

Extension points
- Add per-pack specialized slot rules (e.g., special treatments for themed slots, set-specific wildcard pools).
- Persist UI preferences (sort/filter) to localStorage.
- Add basic routing to surface distinct URLs for Home/Store/Collection.
- Replace legacy mode fully by ensuring all boosters define slots and removing fallback.
- Improve tests: component smoke tests (Header renders, Store opens, Collection counts), API response shaping tests for formatCardData.
- Add a deterministic seed option for reproducible openings.

How to run locally
- Install dependencies: npm install
- Start dev server: npm start
- Build for GitHub Pages: npm run build
- Serve production locally (optional): npx serve -s build
- Note: Ensure images exist under public/assets and that the browser can reach api.scryfall.com

File map (major)
- Frontend entry: [src/index.js](src/index.js:1), [src/App.js](src/App.js:1)
- Config: [src/config.js](src/config.js:1)
- Data: [src/data/boosters.js](src/data/boosters.js:1)
- Utilities: [src/utils.js](src/utils.js:1), [src/mtg-api.js](src/mtg-api.js:1)
- Components: Header, PackDisplay, PackOpeningScreen, BackgroundParticles, CardDisplay, ActionButtons, Store, Collection, Notification*, with respective CSS modules under src/components/
- Public: [public/index.html](public/index.html:1), [public/manifest.json](public/manifest.json:1), [public/robots.txt](public/robots.txt:1), [public/sitemap.xml](public/sitemap.xml:1), assets/
- Docs: [README.md](README.md:1), SPEC.md (this document)

Glossary
- Pack/Booster: Virtual item representing a set-specific collection of MTG cards configured by slots.
- Slot: A rule describing how to select a card for a pack (rarity, pool, foil, dynamic resolver).
- Collection: Persisted list of all opened cards, including duplicates and instance timestamps.
- Inventory: Count of unopened packs by type.