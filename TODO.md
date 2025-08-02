- [x] Decrease initial money from $100 to $20
- [x] Better animate opening a booster, especially showing an intense shining animation around the pack and making it shake around while the cards load from the api. It shouldnt explode until the cards are loaded.
- [x] Fix price fetch for foil cards, to properly use foil pricing (usd_foil) instead of regular price (usd) if theyre foil.
- [x] Once a booster is opened, the cards are added to the collection immediately, instead of when pressing the action button to flip the cards as it is done now. There should be no possible way to "cheat reset" a pack by closing the app window after opening the pack but before flipping all cards for example.
- [x] Make the card preview in Collection and card display view have complete feature parity, like showing the edition for cards and allowing to flip double sided cards (missing from booster view)
- [x] Allow defining the number of cards per pack, as well as the odds for each slot in the boosters.json file. Maybe transform it into a proper js file and position it in a more suitable folder to allow for defining more complex logic on how each pack should be randomized
- [x] Add a "Delete collection and money and start over" button somewhere to start over
- [x] Add total collection value number to the header of the collection
- [x] Review texts, adding a text to the bottom of the page that says, in proper legal ease:
  - All money is fictional
  - All products are fictional and dont represent real products
  - All items showcased are copyright of wizards of the coast, hasbro.
- [x] Prepare for deployment to github pages, including a github action to build the page on commit and .env to hold env vars.
- [x] Review texts

POST DEPLOYMENT

- [ ] Include one random non playable card in all card packs. Use the request structure: curl -X GET "https://api.scryfall.com/cards/random?q=set:BOS+(layout:token+OR+layout:emblem+OR+layout:art_series)", but replacing BOS with the set code for the pack. If the set has no non playable cards (request returns 404 or similar), this can be skipped safely.

