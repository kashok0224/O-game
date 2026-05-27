// Level 1: Saint Seiya — Sanctuary of Athena
// Collect Cosmo orbs, stomp Silver Saints, hit gold blocks from below

import { LEVEL_INTROS, EASTER_EGGS } from '../gameConfig.js';
import { showLevelIntro } from '../utils/levelIntro.js';
import { addEasterEgg } from '../utils/easterEgg.js';

const LEVEL_WIDTH = 2400;
const PTILE = 'platform_seiya';  // Greek stone tile

export default class Level1Scene extends Phaser.Scene {
    constructor() {
        super('Level1Scene');
    }

    create() {
        this.score = 0;
        this.isAlive = true;
        this.introActive = false;
        this.levelComplete = false;

        this._buildWorld();
        this._buildPlayer();
        this._buildEnemies();
        this._buildCollectibles();
        this._buildCamera();
        this._buildUI();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({ up: 'W', left: 'A', right: 'D' });

        addEasterEgg(this, 1760, 200, EASTER_EGGS.Level1Scene);
        showLevelIntro(this, LEVEL_INTROS.Level1Scene);
    }

    _buildWorld() {
        // Background image (fixed — doesn't scroll)
        this.add.image(400, 250, 'bg_seiya').setScrollFactor(0).setDepth(-1);

        this.platforms = this.physics.add.staticGroup();

        // Ground tiles
        for (let x = 16; x < LEVEL_WIDTH; x += 32) {
            this.platforms.create(x, 484, PTILE).setScale(0.5).refreshBody();
        }

        // Pit gaps
        const gapRanges = [[480, 544], [960, 1024]];
        this.platforms.getChildren().forEach(tile => {
            gapRanges.forEach(([start, end]) => {
                if (tile.x >= start && tile.x <= end && tile.y === 484) tile.destroy();
            });
        });

        // Floating platforms (the 12 stepping-stone houses)
        const floaters = [
            [200, 380], [260, 380],
            [400, 300], [460, 300],
            [640, 360],
            [800, 280], [860, 280], [920, 280],
            [1100, 340],
            [1300, 260], [1360, 260],
            [1600, 340], [1660, 340],
            [1900, 300],
            [2100, 350], [2160, 350], [2220, 350],
        ];
        floaters.forEach(([x, y]) => {
            this.platforms.create(x, y, PTILE).setScale(0.5).refreshBody();
        });

        // Gold Cosmo blocks — hit from below to release energy (+10)
        this.questionBlocks = this.physics.add.staticGroup();
        [[330,300],[700,250],[860,220],[1200,290],[1700,270],[2000,260]].forEach(([x, y]) => {
            const b = this.platforms.create(x, y, PTILE).setScale(0.5).refreshBody();
            b.setTint(0xFFD700);
            b.setData('cosmo', true);
        });

        // Finish — Athena's statue marker
        this.add.text(LEVEL_WIDTH - 60, 420, '⚡', { fontSize: '32px' });
        this.flagZone = this.add.zone(LEVEL_WIDTH - 60, 440, 40, 60);
        this.physics.world.enable(this.flagZone);
        this.flagZone.body.setAllowGravity(false);
    }

    _buildPlayer() {
        this.player = this.physics.add.sprite(60, 400, 'player_saga');
        this.player.setScale(0.5);  // pixel_size=2 assets — scale back to game size
        this.player.setBounce(0.05);
        this.physics.world.setBounds(0, 0, LEVEL_WIDTH, 500);
        this.player.setCollideWorldBounds(true);

        this.physics.add.collider(this.player, this.platforms, (player, tile) => {
            if (player.body.blocked.up && tile.getData('cosmo') && !tile.getData('used')) {
                tile.setData('used', true);
                tile.setTint(0x888855);
                this.tweens.add({
                    targets: tile, y: tile.y - 8, duration: 80, yoyo: true
                });
                const popup = this.add.text(tile.x, tile.y - 24, '+10 Cosmo!', {
                    fontSize: '12px', fill: '#FFD700', fontFamily: 'monospace',
                    stroke: '#000', strokeThickness: 3
                }).setOrigin(0.5);
                this.tweens.add({
                    targets: popup, y: popup.y - 40, alpha: 0,
                    duration: 700, onComplete: () => popup.destroy()
                });
                this.score += 10;
                this._updateScore();
            }
        });
    }

    _buildEnemies() {
        this.enemies = this.physics.add.group();

        [350, 700, 1050, 1450, 1800, 2050].forEach(x => {
            const e = this.enemies.create(x, 450, 'enemy_seiya');
            e.setScale(0.5);
            e.setVelocityX(-60);
            e.setCollideWorldBounds(true);
        });

        this.physics.add.collider(this.enemies, this.platforms, (enemy) => {
            if (enemy.body.blocked.left)  enemy.setVelocityX(60);
            if (enemy.body.blocked.right) enemy.setVelocityX(-60);
        });

        this.physics.add.overlap(this.player, this.enemies, this._hitEnemy, null, this);
    }

    _buildCollectibles() {
        this.coins = this.physics.add.staticGroup();
        [
            [200,340],[260,340],[460,260],[640,320],
            [860,240],[920,240],[1100,300],[1360,220],
            [1660,300],[1900,260],[2160,310]
        ].forEach(([x, y]) => {
            this.coins.create(x, y, 'coin').setScale(0.5).refreshBody();
        });

        this.physics.add.overlap(this.player, this.coins, (player, coin) => {
            coin.destroy();
            this.score += 10;
            this._updateScore();
        });
    }

    _buildCamera() {
        this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, 500);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    _buildUI() {
        this.scoreText = this.add.text(16, 16, 'COSMO: 0', {
            fontSize: '16px', fill: '#FFD700', fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 3
        }).setScrollFactor(0);

        this.add.text(16, 36, 'WORLD: 1-1  Sanctuary of Athena', {
            fontSize: '11px', fill: '#C4B888', fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 2
        }).setScrollFactor(0);

        this.add.text(16, 460, '↑/W: jump  stomp Silver Saints  hit gold blocks from below', {
            fontSize: '10px', fill: '#888888', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setScrollFactor(0);
    }

    _hitEnemy(player, enemy) {
        if (!enemy) return;
        const stompedFromAbove = player.body.velocity.y > 0 && player.y < enemy.y - 8;
        if (stompedFromAbove) {
            enemy.destroy();
            player.setVelocityY(-300);
            this.score += 50;
            this._updateScore();
        } else if (this.isAlive && !this.levelComplete) {
            this.isAlive = false;
            player.setTint(0xff0000);
            player.setVelocityY(-400);
            this.restartTimer = this.time.delayedCall(1200, () => this.scene.restart());
        }
    }

    _die() {
        if (!this.isAlive || this.levelComplete) return;
        this.isAlive = false;
        this.player.setTint(0xff0000);
        this.player.setVelocityY(-400);
        this.restartTimer = this.time.delayedCall(1200, () => this.scene.restart());
    }

    _updateScore() {
        this.scoreText.setText(`COSMO: ${this.score}`);
    }

    _checkFlagReached() {
        if (this.levelComplete) return;
        if (this.player.x > LEVEL_WIDTH - 200) {
            this.levelComplete = true;
            this.isAlive = false;
            if (this.restartTimer) { this.restartTimer.remove(); this.restartTimer = null; }
            this.add.text(400, 200, 'PEGASUS METEOR FIST!', {
                fontSize: '28px', fill: '#FFD700', fontFamily: 'monospace',
                fontStyle: 'bold', stroke: '#000', strokeThickness: 4
            }).setOrigin(0.5).setScrollFactor(0).setDepth(10);
            this.add.text(400, 240, 'press any key to continue', {
                fontSize: '12px', fill: '#aaaaaa', fontFamily: 'monospace',
                stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

            let advanced = false;
            const advance = () => {
                if (advanced) return;
                advanced = true;
                console.log('[Level1] → advancing to Level2Scene, score:', this.score);
                this.scene.start('Level2Scene', { score: this.score });
            };

            this.time.delayedCall(2000, advance);
            this.time.delayedCall(300, () => {
                this.input.keyboard.once('keydown', advance);
            });
        }
    }

    update() {
        if (this.introActive) return;

        // Flag check runs before the isAlive guard so an enemy hit in the same
        // physics frame can't race-condition block the level transition.
        this._checkFlagReached();

        if (!this.isAlive) return;

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

        if ((this.cursors.up.isDown || this.wasd.up.isDown || this.cursors.space.isDown) && onGround) {
            this.player.setVelocityY(-520);
        }

        // Animations
        if (!onGround) {
            this.player.play('saga_jump', true);
        } else if (Math.abs(this.player.body.velocity.x) > 10) {
            this.player.play('saga_walk', true);
        } else {
            this.player.play('saga_idle', true);
        }

        if (this.player.y > 510) this._die();
    }
}
