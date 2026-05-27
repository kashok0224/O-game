// ============================================================
//  GAME CONFIG — all personal text lives here.
//  Fill in your own messages before gifting the game.
// ============================================================

export const FRIEND_NAME = "My Buddy";

// --- Dedication screen (shown before the main menu) ---
export const DEDICATION_LINES = [
    `For ${FRIEND_NAME}`,
    "A gift made just for you.",
];

// --- Level intro cards ---
export const LEVEL_INTROS = {
    Level1Scene: {
        world: "World 1-1",
        title: "Mushroom Kingdom",
        message: "[A personal message or memory that fits the Mario theme]",
    },
    Level2Scene: {
        world: "World 2-1",
        title: "Wizard Academy",
        message: "[Something Harry Potter-related — an inside joke, a favorite quote, etc.]",
    },
    Level3Scene: {
        world: "World 3-1",
        title: "Tall Grass Route",
        message: "[Something Pokemon-related — maybe their favorite Pokemon?]",
    },
    Level4Scene: {
        world: "World 4-1",
        title: "Death Star Trench Run",
        message: "[A Star Wars quote or personal note to close out the adventure]",
    },
};

// --- Easter egg messages (hidden spots in each level) ---
export const EASTER_EGGS = {
    Level1Scene: "[A secret message hidden in the Mushroom Kingdom]",
    Level2Scene: "[A secret message hidden in Wizard Academy]",
    Level3Scene: "[A secret message hidden in Tall Grass Route]",
};

// --- End screen (shown after completing all 4 levels) ---
export const END_SCREEN = {
    title: "You did it.",
    lines: [
        "[Personal closing message — first line]",
        "[Personal closing message — second line]",
        `Thank you for being you, ${FRIEND_NAME}. ♥`,
    ],
};

// ============================================================
//  STAR WARS STORY DIALOGUE
//  All spoken lines for the new Anakin's Rescue scenes.
//  Edit these freely — they will appear in-game as dialogue boxes.
// ============================================================

export const SW_DIALOGUE = {

    // Opening cutscene panels
    opening: [
        {
            speaker: 'VADER',
            text: 'Your Senator was... unwise to resist the Empire. She will serve as a reminder of what happens to those who defy us.'
        },
        {
            speaker: 'ANAKIN',
            text: 'Padmé... I\'m coming for you. No fleet, no army — nothing in this galaxy will stop me.'
        },
    ],

    // Tractor beam scene — after SpaceChase, before Duel
    tractor: [
        {
            speaker: 'ANAKIN',
            text: 'Tractor beam. They\'ve got me. My engines can\'t break free...'
        },
        {
            speaker: 'VADER',
            text: 'Bring the ship aboard. I will deal with the pilot personally.'
        },
        {
            speaker: 'ANAKIN',
            text: 'Fine. If you want me, come find me. I\'ll be waiting — with a lightsaber.'
        },
        {
            speaker: 'NARRATOR',
            text: 'Anakin powers down his engines and lets the beam pull him in. In the hangar bay of the Executor, he steps out — alone.'
        },
    ],

    // Duel scene — before and during the fight
    duel: {
        start: [
            {
                speaker: 'VADER',
                text: 'You have your mother\'s courage, young Skywalker. It will not save you.'
            },
            {
                speaker: 'ANAKIN',
                text: 'Where is Padmé? Tell me now, or I swear I will cut through every deck of this ship to find her.'
            },
            {
                speaker: 'VADER',
                text: 'You will find nothing here but your defeat. En garde.'
            },
        ],
        vader_hit_1: [
            {
                speaker: 'VADER',
                text: 'Impressive... but predictable. You fight with emotion, not discipline.'
            },
        ],
        vader_hit_2: [
            {
                speaker: 'ANAKIN',
                text: 'You taught me everything I know, Vader. But you forgot one thing — I always learn fast.'
            },
        ],
        vader_defeat: [
            {
                speaker: 'VADER',
                text: 'You... have grown strong. Stronger than I anticipated...'
            },
            {
                speaker: 'ANAKIN',
                text: 'It\'s over. Tell me where she is.'
            },
            {
                speaker: 'VADER',
                text: 'Detention block... Omega-7. Go. Before I change my mind.'
            },
        ],
    },

    // Ending cutscene — after the duel
    ending: [
        {
            speaker: 'NARRATOR',
            text: 'With Vader defeated, Anakin races through the ship\'s corridors toward the detention block.'
        },
        {
            speaker: 'PADME',
            text: 'Anakin! I knew you\'d come. I never stopped believing.'
        },
        {
            speaker: 'ANAKIN',
            text: 'Always. Let\'s go — this ship won\'t stay quiet for long.'
        },
        {
            speaker: 'PADME',
            text: 'The Senate... they have to know what the Empire is doing. We have to get this evidence out.'
        },
        {
            speaker: 'ANAKIN',
            text: 'We will. Together. But first — we get you home safe.'
        },
        {
            speaker: 'NARRATOR',
            text: 'Hand in hand, Anakin and Padmé escape into hyperspace — carrying hope back to a galaxy that desperately needs it.'
        },
    ],
};
