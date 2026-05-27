export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Backgrounds (800×500)
        this.load.image('bg_seiya',    'assets/bg_seiya.png');
        this.load.image('bg_hogwarts', 'assets/bg_hogwarts.png');
        this.load.image('bg_pokemon',  'assets/bg_pokemon.png');
        this.load.image('bg_starwars', 'assets/bg_starwars.png');

        // Player spritesheets — 256×96 PNG, 4 frames of 64×96 each (pixel_size=2)
        this.load.spritesheet('player',        'assets/player_seiya.png',  { frameWidth: 64, frameHeight: 96 });
        this.load.spritesheet('player_saga',   'assets/player_saga.png',   { frameWidth: 64, frameHeight: 96 });
        this.load.spritesheet('player_harry',  'assets/player_harry.png',  { frameWidth: 64, frameHeight: 96 });
        this.load.spritesheet('player_ash',    'assets/player_ash.png',    { frameWidth: 64, frameHeight: 96 });
        this.load.spritesheet('player_anakin', 'assets/player_anakin.png', { frameWidth: 64, frameHeight: 96 });

        // Enemy sprites (56×56 PNGs, pixel_size=2 — use setScale(0.5) in scenes)
        this.load.image('enemy_seiya',        'assets/enemy_seiya.png');
        this.load.image('enemy_dementor',     'assets/enemy_dementor.png');
        this.load.image('enemy_pokemon_fire', 'assets/enemy_pokemon_fire.png');
        this.load.image('enemy_pokemon_leaf', 'assets/enemy_pokemon_leaf.png');
        this.load.image('enemy_pokemon_wing', 'assets/enemy_pokemon_wing.png');

        // Collectibles (32×32 PNGs, pixel_size=2)
        this.load.image('coin',     'assets/coin.png');
        this.load.image('orb_hp',   'assets/orb_hp.png');
        this.load.image('pokeball', 'assets/pokeball.png');

        // Platform tiles (64×32 PNGs, pixel_size=2 — use setScale(0.5).refreshBody())
        this.load.image('platform_seiya',    'assets/platform_seiya.png');
        this.load.image('platform_hogwarts', 'assets/platform_hogwarts.png');
        this.load.image('platform_pokemon',  'assets/platform_pokemon.png');
        this.load.image('platform_starwars', 'assets/platform_starwars.png');

        // Cutscene videos — drop files into publicassets/videos/
        // Scenes gracefully skip if the file isn't there yet.
        this.load.video('intro_video',  'assets/videos/O-game-beginning-scene.mp4', 'loadeddata', false, false);
        this.load.video('ending_video', 'assets/videos/O-game-ending-scene.mp4',    'loadeddata', false, false);
    }

    create() {
        // Register player animations globally (available in all scenes)
        // Seiya (kept as fallback / original)
        this.anims.create({ key: 'player_idle',  frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }), frameRate: 1 });
        this.anims.create({ key: 'player_walk',  frames: this.anims.generateFrameNumbers('player', { start: 1, end: 2 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'player_jump',  frames: this.anims.generateFrameNumbers('player', { start: 3, end: 3 }), frameRate: 1 });

        // Gemini Saga (Level 1)
        this.anims.create({ key: 'saga_idle',  frames: this.anims.generateFrameNumbers('player_saga', { start: 0, end: 0 }), frameRate: 1 });
        this.anims.create({ key: 'saga_walk',  frames: this.anims.generateFrameNumbers('player_saga', { start: 1, end: 2 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'saga_jump',  frames: this.anims.generateFrameNumbers('player_saga', { start: 3, end: 3 }), frameRate: 1 });

        // Harry Potter (Level 2)
        this.anims.create({ key: 'harry_idle', frames: this.anims.generateFrameNumbers('player_harry', { start: 0, end: 0 }), frameRate: 1 });
        this.anims.create({ key: 'harry_walk', frames: this.anims.generateFrameNumbers('player_harry', { start: 1, end: 2 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'harry_jump', frames: this.anims.generateFrameNumbers('player_harry', { start: 3, end: 3 }), frameRate: 1 });

        // Ash Ketchum (Level 3)
        this.anims.create({ key: 'ash_idle',   frames: this.anims.generateFrameNumbers('player_ash', { start: 0, end: 0 }), frameRate: 1 });
        this.anims.create({ key: 'ash_walk',   frames: this.anims.generateFrameNumbers('player_ash', { start: 1, end: 2 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'ash_jump',   frames: this.anims.generateFrameNumbers('player_ash', { start: 3, end: 3 }), frameRate: 1 });

        // Anakin Skywalker (Level 4 portrait)
        this.anims.create({ key: 'anakin_idle', frames: this.anims.generateFrameNumbers('player_anakin', { start: 0, end: 0 }), frameRate: 1 });

        this.scene.start('DedicationScene');
    }
}
