/**
 * BOOSTERS configuration module.
 * Each booster defines:
 * - name: display name
 * - code: set code
 * - image: path under public/assets/
 * - price: pack price
 * - slots: array of slot definitions, in open order
 *
 * Slot definition shape:
 * {
 *   count: number | (ctx) => number
 *   pool: 'common' | 'uncommon' | 'rare' | 'mythic' | 'land' | 'wildcard' | string
 *   odds?: { [rarity: string]: number } // sum to 1.0, e.g. { rare: 6/7, mythic: 1/7 }
 *   foil?: boolean // whether this slot is foil
 *   resolver?: (ctx) => { rarity: string, foil?: boolean, pool?: string }
 * }
 *
 * Placeholder odds here mirror current random logic used in generateCards():
 * - 7 commons
 * - 3 uncommons
 * - 1 rare (6/7) or mythic (1/7)
 * - 1 land (common) with 20% foil chance
 * - 1 non-foil wildcard (any rarity)
 * - 1 foil wildcard (any rarity)
 *
 * You can customize per pack by changing the slots for that entry.
 */

const DEFAULT_SLOTS = [
    // 7 Common cards
    { count: 7, pool: 'common' },

    // 3 Uncommon cards
    { count: 3, pool: 'uncommon' },

    // 1 Rare or Mythic Rare
    {
        count: 1,
        pool: 'rare',
        odds: { rare: 6 / 7, mythic: 1 / 7 }
    },

    // 1 Land (20% chance of being foil)
    {
        count: 1,
        resolver: () => {
            const foil = Math.random() < 0.2;
            return { rarity: 'common', foil, pool: 'land' };
        }
    },

    // 1 Non-foil wildcard (any rarity)
    {
        count: 1,
        resolver: () => {
            const rarities = ['common', 'uncommon', 'rare', 'mythic'];
            const rarity = rarities[Math.floor(Math.random() * rarities.length)];
            return { rarity, foil: false, pool: 'wildcard' };
        }
    },

    // 1 Foil wildcard (any rarity)
    {
        count: 1,
        resolver: () => {
            const rarities = ['common', 'uncommon', 'rare', 'mythic'];
            const rarity = rarities[Math.floor(Math.random() * rarities.length)];
            return { rarity, foil: true, pool: 'wildcard' };
        }
    }
];

const SLOTS_12_CARDS =
    [
        // 5 Common cards
        { count: 5, pool: 'common' },

        // 3 Uncommon cards
        { count: 3, pool: 'uncommon' },

        // 1 Rare or Mythic Rare
        {
            count: 1,
            pool: 'rare',
            odds: { rare: 6 / 7, mythic: 1 / 7 }
        },

        // 1 Land (20% chance of being foil)
        {
            count: 1,
            resolver: () => {
                const foil = Math.random() < 0.2;
                return { rarity: 'common', foil, pool: 'land' };
            }
        },

        // 1 Non-foil wildcard (any rarity)
        {
            count: 1,
            resolver: () => {
                const rarities = ['common', 'uncommon', 'rare', 'mythic'];
                const rarity = rarities[Math.floor(Math.random() * rarities.length)];
                return { rarity, foil: false, pool: 'wildcard' };
            }
        },

        // 1 Foil wildcard (any rarity)
        {
            count: 1,
            resolver: () => {
                const rarities = ['common', 'uncommon', 'rare', 'mythic'];
                const rarity = rarities[Math.floor(Math.random() * rarities.length)];
                return { rarity, foil: true, pool: 'wildcard' };
            }
        }
    ];

// const SLOTS_5_CARDS = [

//         // 2 Uncommon cards
//         { count: 2, pool: 'uncommon' },

//         // 2 Rare or Mythic Rare
//         {
//             count: 2,
//             pool: 'rare',
//             odds: { rare: 6 / 7, mythic: 1 / 7 }
//         },

//         // 1 Foil wildcard (any rarity)
//         {
//             count: 1,
//             resolver: () => {
//                 const rarities = ['common', 'uncommon', 'rare', 'mythic'];
//                 const rarity = rarities[Math.floor(Math.random() * rarities.length)];
//                 return { rarity, foil: true, pool: 'wildcard' };
//             }
//         }
//     ];

// Helper to clone default slots so packs don't share references

const cloneSlots = (SLOTS) => SLOTS.map(s => ({ ...s }));

export const BOOSTERS = [
    {
        name: 'Aetherdrift',
        code: 'DFT',
        image: 'boosters/aetherdrift.png',
        price: 2.95,
        slots: cloneSlots(DEFAULT_SLOTS)
    },
    {
        name: 'Bloomburrow',
        code: 'BLB',
        image: 'boosters/bloomburrow.png',
        price: 4.15,
        slots: cloneSlots(DEFAULT_SLOTS)
    },
    {
        name: 'Dominaria United',
        code: 'DMU',
        image: 'boosters/dominaria_united.png',
        price: 4.99,
        slots: cloneSlots(SLOTS_12_CARDS)
    },
    {
        name: 'Duskmourn: House of Horror',
        code: 'DSK',
        image: 'boosters/duskmourn_house_of_horror.png',
        price: 3.95,
        slots: cloneSlots(DEFAULT_SLOTS)
    },
    {
        name: 'Final Fantasy',
        code: 'FIN',
        image: 'boosters/final_fantasy.png',
        price: 5.56,
        slots: cloneSlots(DEFAULT_SLOTS)
    },
    {
        name: 'Foundations',
        code: 'FDN',
        image: 'boosters/foundations.png',
        price: 3.88,
        slots: cloneSlots(DEFAULT_SLOTS)
    },
    // {
    //     name: 'March of the Machine: The Aftermath',
    //     code: 'MAT',
    //     image: 'boosters/march_of_the_machine_the_aftermath.png',
    //     price: 3.15,
    //     slots: cloneSlots(SLOTS_5_CARDS)
    // },
    {
        name: 'March of the Machine',
        code: 'MOM',
        image: 'boosters/march_of_the_machine.png',
        price: 4.30,
        slots: cloneSlots(SLOTS_12_CARDS)
    },
    {
        name: 'Murders at Karlov Manor',
        code: 'MKM',
        image: 'boosters/murders_at_karlov_manor.png',
        price: 3.06,
        slots: cloneSlots(DEFAULT_SLOTS)
    },
    {
        name: 'Outlaws of Thunder Junction',
        code: 'OTJ',
        image: 'boosters/outlaws_of_thunder_junction.png',
        price: 3.79,
        slots: cloneSlots(DEFAULT_SLOTS)
    },
    {
        name: 'Phyrexia: All Will Be One',
        code: 'ONE',
        image: 'boosters/phyrexia_all_will_be_one.png',
        price: 6.12,
        slots: cloneSlots(SLOTS_12_CARDS)
    },
    {
        name: 'Tarkir: Dragonstorm',
        code: 'TDC',
        image: 'boosters/tarkir_dragonstorm.png',
        price: 4.27,
        slots: cloneSlots(DEFAULT_SLOTS)
    },
    {
        name: "The Brothers' War",
        code: 'BRO',
        image: 'boosters/the_brothers_war.png',
        price: 4.44,
        slots: cloneSlots(SLOTS_12_CARDS)
    },
    {
        name: 'The Lost Caverns of Ixalan',
        code: 'LCI',
        image: 'boosters/the_lost_caverns_of_ixalan.png',
        price: 5.03,
        slots: cloneSlots(SLOTS_12_CARDS)
    },
    {
        name: 'Wilds of Eldraine',
        code: 'WOE',
        image: 'boosters/wilds_of_eldraine.png',
        price: 5.70,
        slots: cloneSlots(SLOTS_12_CARDS)
    }
];

// Example of how to add a custom pack with different odds/slots:
// export const BOOSTERS = [
//   {
//     name: 'Custom Pack',
//     code: 'CUS',
//     image: 'boosters/custom.png',
//     price: 4.99,
//     slots: [
//       { count: 6, pool: 'common' },
//       { count: 4, pool: 'uncommon' },
//       { count: 1, pool: 'rare', odds: { rare: 0.75, mythic: 0.25 } },
//       { count: 1, resolver: (ctx) => ({ rarity: 'common', foil: Math.random() < 0.1, pool: 'land' }) },
//       { count: 2, resolver: (ctx) => ({ rarity: Math.random() < 0.5 ? 'common' : 'uncommon', foil: false, pool: 'wildcard' }) }
//     ]
//   }
// ];
