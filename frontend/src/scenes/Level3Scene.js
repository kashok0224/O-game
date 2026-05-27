import { LEVEL_INTROS, EASTER_EGGS } from '../gameConfig.js';
import { showLevelIntro } from '../utils/levelIntro.js';
import { addEasterEgg } from '../utils/easterEgg.js';

// Level 3: Pokemon World — Tall Grass Route
// Z: throw Pokéball to catch enemies
// Catching gives a temporary ability (shown in HUD, active for 8s):
//   Red enemy  → Fireball  (X to launch, one-shot)
//   Green enemy → Speed Boost (passive, auto-expires)
//   Blue enemy  → Double Jump (passive, allows 1 extra jump)

const LEVEL_WIDTH = 2400;

const TYPES = {
    FIRE: { tint: 0xe74c3c, label: 'Fireball  [X]' },
    LEAF: { tint: 0x2ecc71, label: 'Speed Boost' },
    WING: { tint: 0x3498db, label: 'Double Jump' },
};

export default class Level3Scene extends Phaser.Scene {
    constructor() {
        super('Level3Scene');
    }

    init(data) {
        this.score = data.score || 0;
    }

    create() {
        this.isAlive = true;
        this.introActive = false;
        this.levelComplete = false;
        this.pokeballs = 8;
        this.currentAbility = null;
        this.abilityExpiry = 0;
        this.jumpCount = 0;

        this._buildWorld();
        this._buildPlayer();
        this._buildEnemies();
        this._buildCollectibles();
        this._buildCamera();
        this._buildUI();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({ up: 'W', left: 'A', right: 'D' });
        this.throwKey = this.input.keyboard.addKey('Z');
        this.abilityKey = this.input.keyboard.addKey('X');

        this.thrownBalls = this.physics.add.group();
        this.fireballs = this.physics.add.group();

        // Hidden easter egg — on a hard-to-reach platform near the end
        addEasterEgg(this, 2050, 200, EASTER_EGGS.Level3Scene);

        showLevelIntro(this, LEVEL_INTROS.Level3Scene);
    }

    _buildWorld() {
        this.add.image(400, 250, 'bg_pokemon').setScrollFactor(0).setDepth(-1);

        this.platforms = this.physics.add.staticGroup();

        for (let x = 16; x < LEVEL_WIDTH; x += 32) {
            this.platforms.create(x, 484, 'platform_pokemon').setScale(0.5).refreshBody();
        }

        const gapRanges = [[640, 704], [1280, 1344]];
        this.platforms.getChildren().forEach(tile => {
            gapRanges.forEach(([start, end]) => {
                if (tile.x >= start && tile.x <= end && tile.y === 484) tile.destroy();
            });
        });

        const floaters = [
            [200, 360], [260, 360],
            [450, 290], [510, 290],
            [750, 340],
            [900, 270], [960, 270],
            [1150, 330],
            [1400, 260], [1460, 260],
            [1650, 330],
            [1900, 280], [1960, 280],
            [2150, 340], [2210, 340],
        ];
        floaters.forEach(([x, y]) => {
            this.platforms.create(x, y, 'platform_pokemon').setScale(0.5).refreshBody();
        });

        this.add.text(LEVEL_WIDTH - 60, 415, '🌀', { fontSize: '40px' });
        this.flagZone = this.add.zone(LEVEL_WIDTH - 60, 440, 50, 60);
        this.physics.world.enable(this.flagZone);
        this.flagZone.body.setAllowGravity(false);
    }

    _buildPlayer() {
        this.player = this.physics.add.sprite(60, 400, 'player_ash');
        this.player.setScale(0.5);
        this.player.setBounce(0.05);
        this.physics.world.setBounds(0, 0, LEVEL_WIDTH, 500);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.platforms);
    }

    _buildEnemies() {
        this.enemies = this.physics.add.group();

        const spawnData = [
            { x: 300, type: 'FIRE' }, { x: 560, type: 'LEAF' },
            { x: 820, type: 'WING' }, { x: 1100, type: 'FIRE' },
            { x: 1360, type: 'LEAF' }, { x: 1600, type: 'WING' },
            { x: 1900, type: 'FIRE' }, { x: 2200, type: 'LEAF' },
        ];

        spawnData.forEach(({ x, type }) => {
            const texKey = `enemy_pokemon_${type.toLowerCase()}`;
            const e = this.enemies.create(x, 440, texKey);
            e.setScale(0.5);
            e.setVelocityX(-60);
            e.setCollideWorldBounds(true);
            e.setData('type', type);
        });

        this.physics.add.collider(this.enemies, this.platforms, (enemy) => {
            if (enemy.body.blocked.left) enemy.setVelocityX(60);
            if (enemy.body.blocked.right) enemy.setVelocityX(-60);
        });

        // Can still stomp enemies (but catching is better — gives ability)
        this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
            const stompedFromAbove = player.body.velocity.y > 0 && player.y < enemy.y - 10;
            if (stompedFromAbove) {
                enemy.destroy();
                player.setVelocityY(-300);
                this.score += 30;
                this._updateUI();
            } else if (this.isAlive) {
                this.isAlive = false;
                player.setTint(0xff0000);
                player.setVelocityY(-400);
                this.time.delayedCall(1200, () => this.scene.restart());
            }
        });
    }

    _buildCollectibles() {
        // Extra Pokéballs scattered through the level
        this.extraBalls = this.physics.add.staticGroup();
        [300, 700, 1100, 1500, 1900].forEach(x => {
            this.extraBalls.create(x, 250, 'pokeball').setScale(0.5).refreshBody();
        });

        this.physics.add.overlap(this.player, this.extraBalls, (player, ball) => {
            ball.destroy();
            this.pokeballs = Math.min(this.pokeballs + 2, 15);
            this._updateUI();
        });
    }

    _throwPokeball() {
        if (this.pokeballs <= 0) return;
        this.pokeballs--;
        this._updateUI();

        const dir = this.player.flipX ? -1 : 1;
        const ball = this.thrownBalls.create(this.player.x + dir * 10, this.player.y, 'pokeball');
        ball.setScale(0.5);
        ball.setVelocityX(dir * 450);
        ball.setVelocityY(-80);

        this.physics.add.overlap(ball, this.enemies, (b, enemy) => {
            const type = enemy.getData('type');
            const popup = this.add.text(enemy.x, enemy.y - 20, 'Caught!', {
                fontSize: '13px', fill: '#fff', fontFamily: 'monospace',
                stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5);
            this.tweens.add({
                targets: popup, y: popup.y - 40, alpha: 0,
                duration: 700, onComplete: () => popup.destroy()
            });
            enemy.destroy();
            b.destroy();
            this._activateAbility(type);
            this.score += 60;
            this._updateUI();
        });

        this.time.delayedCall(2500, () => { if (ball.active) ball.destroy(); });
    }

    _activateAbility(type) {
        this.currentAbility = type;
        this.abilityExpiry = this.time.now + 8000;

        if (type === 'WING') this.jumpCount = 0; // reset so double jump is fresh
    }

    _useFireball() {
        if (this.currentAbility !== 'FIRE') return;

        const dir = this.player.flipX ? -1 : 1;
        const fb = this.fireballs.create(this.player.x + dir * 12, this.player.y, 'coin');
        fb.setTint(0xff6600);
        fb.setScale(1.2, 0.8);
        fb.setVelocityX(dir * 650);
        fb.body.allowGravity = false;

        this.physics.add.overlap(fb, this.enemies, (f, enemy) => {
            enemy.destroy();
            f.destroy();
            this.score += 80;
            this._updateUI();
        });

        this.time.delayedCall(2000, () => { if (fb.active) fb.destroy(); });

        // Fireball is one-shot
        this.currentAbility = null;
        this._updateUI();
    }

    _buildCamera() {
        this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, 500);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    _buildUI() {
        this.scoreText = this.add.text(16, 16, `SCORE: ${this.score}`, {
            fontSize: '16px', fill: '#fff', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 3
        }).setScrollFactor(0);

        this.add.text(16, 36, 'WORLD: 3-1 Tall Grass Route', {
            fontSize: '11px', fill: '#ccff88', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setScrollFactor(0);

        this.ballText = this.add.text(16, 56, '', {
            fontSize: '12px', fill: '#ff8888', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setScrollFactor(0);

        this.abilityText = this.add.text(16, 76, '', {
            fontSize: '12px', fill: '#f1c40f', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setScrollFactor(0);

        this.abilityBar = this.add.rectangle(16, 96, 0, 6, 0xf1c40f).setOrigin(0, 0.5).setScrollFactor(0);

        this.add.text(16, 460, 'Z: throw Pokéball  X: use fireball  ↑/W: jump', {
            fontSize: '10px', fill: '#aaaaaa', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setScrollFactor(0);

        this._updateUI();
    }

    _updateUI() {
        this.scoreText.setText(`SCORE: ${this.score}`);
        this.ballText.setText(`POKEBALLS: ${this.pokeballs}`);

        if (this.currentAbility) {
            const remaining = Math.max(0, this.abilityExpiry - this.time.now) / 8000;
            this.abilityText.setText(`ABILITY: ${TYPES[this.currentAbility].label}`);
            this.abilityBar.width = 120 * remaining;
            this.abilityBar.setVisible(this.currentAbility !== 'FIRE'); // fireball has no timer
        } else {
            this.abilityText.setText('');
            this.abilityBar.width = 0;
        }
    }

    _checkFlagReached() {
        if (this.levelComplete) return;
        if (this.player.x > LEVEL_WIDTH - 200) {
            this.levelComplete = true;
            this.isAlive = false;
            if (this.restartTimer) { this.restartTimer.remove(); this.restartTimer = null; }
            this.add.text(400, 200, 'LEVEL CLEAR! 🌀', {
                fontSize: '30px', fill: '#f1c40f', fontFamily: 'monospace',
                fontStyle: 'bold', stroke: '#000', strokeThickness: 4
            }).setOrigin(0.5).setScrollFactor(0).setDepth(10);
            this.time.delayedCall(2000, () => this.scene.start('Level4Scene', { score: this.score }));
        }
    }

    update() {
        if (this.introActive) return;

        this._checkFlagReached();

        if (!this.isAlive) return;

        const now = this.time.now;
        const onGround = this.player.body.touching.down || this.player.body.blocked.down;
        if (onGround) this.jumpCount = 0;

        // Expire timed abilities
        if (this.currentAbility && this.currentAbility !== 'FIRE' && now >= this.abilityExpiry) {
            this.currentAbility = null;
        }
        this._updateUI();

        const speed = this.currentAbility === 'LEAF' ? 320 : 200;

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.setVelocityX(-speed);
            this.player.setFlipX(true);
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.setVelocityX(speed);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }

        const maxJumps = this.currentAbility === 'WING' ? 2 : 1;
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.up)) {
            if (this.jumpCount < maxJumps) {
                this.player.setVelocityY(-520);
                this.jumpCount++;
            }
        }

        if (!onGround) {
            this.player.play('ash_jump', true);
        } else if (Math.abs(this.player.body.velocity.x) > 10) {
            this.player.play('ash_walk', true);
        } else {
            this.player.play('ash_idle', true);
        }

        if (Phaser.Input.Keyboard.JustDown(this.throwKey)) this._throwPokeball();
        if (Phaser.Input.Keyboard.JustDown(this.abilityKey)) this._useFireball();

        if (this.player.y > 510) {
            if (!this.levelComplete && this.isAlive) {
                this.isAlive = false;
                this.player.setTint(0xff0000);
                this.restartTimer = this.time.delayedCall(1200, () => this.scene.restart());
            }
        }
    }
}
