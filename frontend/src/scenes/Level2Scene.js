import { LEVEL_INTROS, EASTER_EGGS } from '../gameConfig.js';
import { showLevelIntro } from '../utils/levelIntro.js';
import { addEasterEgg } from '../utils/easterEgg.js';

// Level 2: Wizard World (Harry Potter themed)
// Cast spells (Space) to defeat Dementors
// Moving platforms = Hogwarts staircases
// Dementors float and oscillate — can't be stomped, only defeated by spell

const LEVEL_WIDTH = 2400;
const SPELL_COOLDOWN = 400;

export default class Level2Scene extends Phaser.Scene {
    constructor() {
        super('Level2Scene');
    }

    init(data) {
        this.score = data.score || 0;
    }

    create() {
        this.isAlive = true;
        this.introActive = false;
        this.lastSpellTime = 0;
        this.levelComplete = false;

        this._generateTextures();
        this._buildWorld();
        this._buildMovingPlatforms();
        this._buildPlayer();
        this._buildEnemies();
        this._buildCollectibles();
        this._buildCamera();
        this._buildUI();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({ up: 'W', left: 'A', right: 'D' });
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.spells = this.physics.add.group();

        // Hidden easter egg — tucked above the last moving platform
        addEasterEgg(this, 1920, 140, EASTER_EGGS.Level2Scene);

        showLevelIntro(this, LEVEL_INTROS.Level2Scene);
    }

    _generateTextures() {
        // Generate once here so _castSpell can reuse it safely
        if (!this.textures.exists('spell')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xf39c12);
            g.fillRect(0, 3, 18, 6);
            g.fillStyle(0xffffff);
            g.fillCircle(18, 6, 5);
            g.generateTexture('spell', 24, 12);
            g.destroy();
        }
    }

    _buildWorld() {
        this.add.image(400, 250, 'bg_hogwarts').setScrollFactor(0).setDepth(-1);

        this.platforms = this.physics.add.staticGroup();

        for (let x = 16; x < LEVEL_WIDTH; x += 32) {
            this.platforms.create(x, 484, 'platform_hogwarts').setScale(0.5).refreshBody();
        }

        const gapRanges = [[560, 624], [1120, 1184], [1680, 1744]];
        this.platforms.getChildren().forEach(tile => {
            gapRanges.forEach(([start, end]) => {
                if (tile.x >= start && tile.x <= end && tile.y === 484) tile.destroy();
            });
        });

        const floaters = [
            [160, 380], [220, 380],
            [520, 360],
            [720, 280], [780, 280],
            [1200, 260], [1260, 260],
            [1440, 380],
            [1600, 300], [1660, 300],
            [2100, 260], [2160, 260], [2220, 260],
        ];
        floaters.forEach(([x, y]) => {
            this.platforms.create(x, y, 'platform_hogwarts').setScale(0.5).refreshBody();
        });

        this.flag = this.add.text(LEVEL_WIDTH - 60, 420, '🏆', { fontSize: '32px' });
        this.flagZone = this.add.zone(LEVEL_WIDTH - 60, 440, 40, 60);
        this.physics.world.enable(this.flagZone);
        this.flagZone.body.setAllowGravity(false);
    }

    _buildMovingPlatforms() {
        this.movingPlatforms = this.physics.add.group();

        const config = [
            { x: 380, y: 310, minX: 280, maxX: 480, speed: 70 },
            { x: 960, y: 340, minX: 820, maxX: 1080, speed: 90 },
            { x: 1900, y: 290, minX: 1750, maxX: 2050, speed: 80 },
        ];

        config.forEach(({ x, y, minX, maxX, speed }) => {
            const p = this.physics.add.image(x, y, 'platform_hogwarts')
                .setScale(0.5)
                .setImmovable(true);
            p.body.allowGravity = false;
            p.setData('minX', minX).setData('maxX', maxX).setData('speed', speed);
            p.setVelocityX(speed);
            this.movingPlatforms.add(p);
        });
    }

    _buildPlayer() {
        this.player = this.physics.add.sprite(60, 400, 'player_harry');
        this.player.setScale(0.5);
        this.player.setBounce(0.05);
        this.physics.world.setBounds(0, 0, LEVEL_WIDTH, 500);
        this.player.setCollideWorldBounds(true);

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.movingPlatforms);
    }

    _buildEnemies() {
        // Dementors: floating enemies that oscillate vertically
        // They can't be stomped — spells only
        this.enemies = this.physics.add.group();

        const dementorData = [
            { x: 400, baseY: 200, phase: 0 },
            { x: 750, baseY: 160, phase: 1.2 },
            { x: 1100, baseY: 220, phase: 0.5 },
            { x: 1450, baseY: 180, phase: 1.8 },
            { x: 1780, baseY: 200, phase: 0.9 },
            { x: 2150, baseY: 160, phase: 2.1 },
        ];

        dementorData.forEach(({ x, baseY, phase }) => {
            const d = this.enemies.create(x, baseY, 'enemy_dementor');
            d.setScale(0.5);
            d.setVelocityX(-50);
            d.body.allowGravity = false;
            d.setCollideWorldBounds(true);
            d.setData('baseY', baseY);
            d.setData('phase', phase);
        });

        this.physics.add.overlap(this.player, this.enemies, this._playerHit, null, this);
    }

    _buildCollectibles() {
        this.orbs = this.physics.add.staticGroup();
        const orbPositions = [
            [160, 340], [220, 340], [380, 270], [780, 240],
            [1200, 220], [1260, 220], [1660, 260], [1900, 260], [2160, 220]
        ];
        orbPositions.forEach(([x, y]) => {
            this.orbs.create(x, y, 'orb_hp').setScale(0.5).refreshBody();
        });

        this.physics.add.overlap(this.player, this.orbs, (player, orb) => {
            orb.destroy();
            this.score += 20;
            this._updateScore();
        });
    }

    _buildCamera() {
        this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, 500);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    _buildUI() {
        this.scoreText = this.add.text(16, 16, `SCORE: ${this.score}`, {
            fontSize: '16px', fill: '#ffffff', fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 3
        }).setScrollFactor(0);

        this.add.text(16, 36, 'WORLD: 2-1 Wizard Academy', {
            fontSize: '11px', fill: '#cc88ff', fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 2
        }).setScrollFactor(0);

        this.add.text(16, 460, '↑/W: jump  SPACE: cast spell  purple platforms move!', {
            fontSize: '10px', fill: '#aaaaaa', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setScrollFactor(0);
    }

    _castSpell() {
        const now = this.time.now;
        if (now - this.lastSpellTime < SPELL_COOLDOWN) return;
        this.lastSpellTime = now;

        const direction = this.player.flipX ? -1 : 1;
        const spell = this.spells.create(this.player.x + direction * 10, this.player.y - 4, 'spell');
        spell.setVelocityX(direction * 550);
        spell.body.allowGravity = false;
        spell.setFlipX(this.player.flipX);

        this.physics.add.overlap(spell, this.enemies, (s, enemy) => {
            // Spell hit flash before destroy
            enemy.setTint(0xffffff);
            this.time.delayedCall(60, () => { if (enemy.active) enemy.destroy(); });
            s.destroy();
            this.score += 50;
            this._updateScore();
        });

        this.physics.add.overlap(spell, this.platforms, (s) => s.destroy());

        this.time.delayedCall(2000, () => { if (spell.active) spell.destroy(); });
    }

    _playerHit(player, enemy) {
        if (!this.isAlive || this.levelComplete) return;
        this.isAlive = false;
        player.setTint(0xff0000);
        player.setVelocityY(-400);
        this.restartTimer = this.time.delayedCall(1200, () => this.scene.restart());
    }

    _updateScore() {
        this.scoreText.setText(`SCORE: ${this.score}`);
    }

    _checkFlagReached() {
        if (this.levelComplete) return;
        if (this.player.x > LEVEL_WIDTH - 200) {
            this.levelComplete = true;
            this.isAlive = false;
            if (this.restartTimer) { this.restartTimer.remove(); this.restartTimer = null; }
            this.add.text(400, 180, 'LEVEL CLEAR! ✨', {
                fontSize: '32px', fill: '#f1c40f', fontFamily: 'monospace',
                fontStyle: 'bold', stroke: '#000', strokeThickness: 4
            }).setOrigin(0.5).setScrollFactor(0).setDepth(10);
            this.add.text(400, 240, `Score: ${this.score}`, {
                fontSize: '20px', fill: '#fff', fontFamily: 'monospace',
                stroke: '#000', strokeThickness: 3
            }).setOrigin(0.5).setScrollFactor(0).setDepth(10);
            this.time.delayedCall(2500, () => this.scene.start('Level3Scene', { score: this.score }));
        }
    }

    update() {
        if (this.introActive) return;

        this._checkFlagReached();

        if (!this.isAlive) return;

        const t = this.time.now / 1000;

        // Oscillate dementors vertically using sine wave
        this.enemies.getChildren().forEach(d => {
            const baseY = d.getData('baseY');
            const phase = d.getData('phase');
            if (baseY === undefined) return;
            d.y = baseY + Math.sin(t * 1.8 + phase) * 40;
            if (d.body.blocked.left) d.setVelocityX(50);
            if (d.body.blocked.right) d.setVelocityX(-50);
        });

        // Bounce moving platforms at their bounds
        this.movingPlatforms.getChildren().forEach(p => {
            if (p.x >= p.getData('maxX')) p.setVelocityX(-p.getData('speed'));
            if (p.x <= p.getData('minX')) p.setVelocityX(p.getData('speed'));
        });

        const onGround = this.player.body.touching.down || this.player.body.blocked.down;

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.setVelocityX(-200);
            this.player.setFlipX(true);
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.setVelocityX(200);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }

        if ((this.cursors.up.isDown || this.wasd.up.isDown) && onGround) {
            this.player.setVelocityY(-520);
        }

        if (!onGround) {
            this.player.play('harry_jump', true);
        } else if (Math.abs(this.player.body.velocity.x) > 10) {
            this.player.play('harry_walk', true);
        } else {
            this.player.play('harry_idle', true);
        }

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this._castSpell();

        if (this.player.y > 510) this._playerHit(this.player, null);
    }
}
