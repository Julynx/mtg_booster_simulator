App:
- [x] Make sure the "get a free pack every 6 hours" logic actually works, show a timer ticking down until the next free pack
- [x] Remove the Reset Pack button, a pack cannot be reset once opened
- [x] Beautiful notifications instead of using js alert
- [x] Every card pack being actually random cards from the pack expansion.
- [x] Update the Documentation
- [x] Add an actual countdown until the next free pack (set it temporaliy to every 2 minutes for testing purposes, should check after the user connects in case he received free packs while he was offline)
- [x] Dont reset collection, make sure the collection is properly saved to localstorage and loaded from localstorage
- [ ] Integrate real boosters images and prices
- [ ] Have the back of the cards be the real mtg image
- [ ] Integrate real booster random algorithm
- [ ] Make the edition link in collection clickable, it should take to the scryfall page for that edition

Card grid:
- [x] Decrease how much the glow extends out of each card, make it shine behind the card instead of in front of it, so it doesnt overlap the card image but shines around it.
- [x] The add to collection button should be always visible, not only when all cards are flipped. Clicking it should auto flip any remaining face down cards and add the cards to the collection.
- [x] FIX: Hovering over a card will make it glow when it is not flipped. Flipped cards should keep glowing permanently, as they do already. (Hovering effect when not flipped is tecnically implemented but not working at all in practice. No glow at all, review the implementation)

Store:
- [x] Remove duplicate black dollar sign from current balance, the amount in green already renders with a dollar sign

Collection: 
- [x] Less columns in grid and make card images bigger
- [x] Fix bug with double sided cards not having an image + allow flipping double sided cards in preview mode
- [x] Prevent the entire grid from reloading itself every time a card is sold. Right now, when a card is sold, all cards after it pop out then pop back in, prevent this.
- [x] FIX: Fix back side of double faced cards appearing mirrored incorrectly.
