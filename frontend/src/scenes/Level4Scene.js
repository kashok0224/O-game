import { LEVEL_INTROS } from '../gameConfig.js';
import { showLevelIntro } from '../utils/levelIntro.js';

// Level 4: Star Wars — Death Star Trench Run
// COMPLETELY DIFFERENT GAME STYLE: side-scrolling space shooter
// No gravity. Free movement (WASD / arrows). Space = shoot.
// Survive long enough to reach 100% distance and destroy the Death Star.

const RUN_DURATION = 60000; // 60 seconds = full run

export default class Level4Scene extends Phaser.Scene {
    constructor() {
        super('Level4Scene');
    }

    init(data) {
        this.score = data.score || 0;
    }

    create() {
        this.isAlive = true;
        this.introActive = false;
        this.lastShotTime = 0;
        this.elapsed = 0;

        this._generateTextures();
        this._buildWorld();
        this._buildPlayer();
        this._startSpawners();
        this._buildUI();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({ up: 'W', left: 'A', right: 'D', down: 'S' });
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.blasts = this.physics.add.group();
        this.tieGroup = this.physics.add.group();
        this.asteroidGroup = this.physics.add.group();
        this.enemyBlasts = this.physics.add.group();

        showLevelIntro(this, LEVEL_INTROS.Level4Scene);
    }

    _generateTextures() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // X-wing
        if (!this.textures.exists('xwing')) {
            g.clear();
            g.fillStyle(0xcccccc); g.fillRect(8, 16, 28, 10); // body
            g.fillStyle(0xffffff); g.fillTriangle(36, 16, 36, 26, 52, 21); // nose
            g.fillStyle(0x999999);
            g.fillRect(10, 4, 22, 10);  // top wing
            g.fillRect(10, 28, 22, 10); // bottom wing
            g.fillStyle(0x4488ff); g.fillRect(8, 19, 6, 4); // engine
            g.generateTexture('xwing', 54, 42);
        }

        // TIE Fighter
        if (!this.textures.exists('tie')) {
            g.clear();
            g.fillStyle(0x555555); g.fillRect(0, 10, 10, 18); // left panel
            g.fillStyle(0x555555); g.fillRect(34, 10, 10, 18); // right panel
            g.fillStyle(0x777777); g.fillCircle(22, 19, 10); // cockpit
            g.fillStyle(0x00ee44); g.fillCircle(22, 19, 4);  // window
            g.generateTexture('tie', 44, 38);
        }

        // Asteroid
        if (!this.textures.exists('asteroid')) {
            g.clear();
            g.fillStyle(0x887766); g.fillCircle(18, 18, 16);
            g.fillStyle(0x665544); g.fillCircle(12, 12, 7);
            g.fillStyle(0x998877); g.fillCircle(22, 22, 5);
            g.generateTexture('asteroid', 36, 36);
        }

        // Trench wall tile
        if (!this.textures.exists('trench')) {
            g.clear();
            g.fillStyle(0x333333); g.fillRect(0, 0, 32, 32);
            g.fillStyle(0x444444); g.fillRect(2, 2, 28, 28);
            g.fillStyle(0x555555); g.fillRect(4, 14, 24, 4);
            g.generateTexture('trench', 32, 32);
        }

        g.destroy();
    }

    _buildWorld() {
        // Static background image — the star layers animate on top of it
        this.add.image(400, 250, 'bg_starwars').setScrollFactor(0).setDepth(-1);

        // Parallax star layers (scroll at different speeds in update)
        this.starLayers = [[], [], []];
        const speeds = [0.3, 0.7, 1.2];
        const counts = [80, 40, 20];
        speeds.forEach((speed, i) => {
            for (let j = 0; j < counts[i]; j++) {
                const s = this.add.rectangle(
                    Phaser.Math.Between(0, 800),
                    Phaser.Math.Between(0, 500),
                    i + 1, i + 1,
                    0xffffff
                ).setScrollFactor(0);
                s.setData('speed', speed);
                this.starLayers[i].push(s);
            }
        });

        // Trench walls — top and bottom borders (the Death Star trench)
        this.trenchTop = this.add.tileSprite(400, 20, 800, 40, 'trench').setScrollFactor(0);
        this.trenchBot = this.add.tileSprite(400, 480, 800, 40, 'trench').setScrollFactor(0);

        // Occasional trench obstacles (protruding walls)
        this.obstacles = this.physics.add.staticGroup();
        for (let x = 600; x < 8000; x += Phaser.Math.Between(400, 700)) {
            const top = Phaser.Math.Between(0, 1) === 0;
            const obs = this.obstacles.create(x, top ? 70 : 430, 'trench');
            obs.setScrollFactor(1); // these scroll with world
        }
    }

    _buildPlayer() {
        this.physics.world.setBounds(0, 0, 800, 500);
        this.player = this.physics.add.sprite(100, 250, 'xwing')
            .setCollideWorldBounds(true);
        this.player.body.allowGravity = false;

        // Engine glow tween
        this.tweens.add({
            targets: this.player,
            alpha: 0.85,
            duration: 200,
            yoyo: true,
            repeat: -1
        });
    }

    _startSpawners() {
        this.time.addEvent({ delay: 1800, callback: this._spawnTIE, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 3200, callback: this._spawnAsteroid, callbackScope: this, loop: true });
    }

    _spawnTIE() {
        if (!this.isAlive) return;

        const y = Phaser.Math.Between(60, 440);
        const tie = this.tieGroup.create(860, y, 'tie');
        tie.body.allowGravity = false;

        const pattern = Phaser.Math.Between(0, 3);
        if (pattern === 0) {
            tie.setVelocityX(-200);
        } else if (pattern === 1) {
            tie.setVelocityX(-180);
            tie.setVelocityY(y < 250 ? 70 : -70);
        } else if (pattern === 2) {
            tie.setVelocityX(-300); // fast charge
        } else {
            // Drifting diagonal
            tie.setVelocityX(-150);
            tie.setVelocityY(Phaser.Math.Between(-100, 100));
        }

        // TIE fires back after a short delay
        this.time.delayedCall(Phaser.Math.Between(400, 1200), () => {
            if (!tie.active || !this.isAlive) return;
            const shot = this.enemyBlasts.create(tie.x - 10, tie.y, 'coin');
            shot.setTint(0xff2200).setScale(0.35, 0.2);
            shot.body.allowGravity = false;
            shot.setVelocityX(-450);

            this.physics.add.overlap(shot, this.player, () => {
                if (!this.isAlive) return;
                shot.destroy();
                this._die();
            });

            this.time.delayedCall(3000, () => { if (shot.active) shot.destroy(); });
        });

        this.time.delayedCall(6000, () => { if (tie.active) tie.destroy(); });

        // Collide with player
        this.physics.add.overlap(this.player, this.tieGroup, () => {
            if (!this.isAlive) return;
            this._die();
        });
    }

    _spawnAsteroid() {
        if (!this.isAlive) return;

        const y = Phaser.Math.Between(50, 450);
        const a = this.asteroidGroup.create(870, y, 'asteroid');
        a.body.allowGravity = false;
        a.setAngularVelocity(Phaser.Math.Between(-80, 80));
        a.setVelocityX(Phaser.Math.Between(-60, -140));

        this.physics.add.overlap(this.player, this.asteroidGroup, () => {
            if (!this.isAlive) return;
            this._die();
        });

        this.time.delayedCall(9000, () => { if (a.active) a.destroy(); });
    }

    _shoot() {
        const now = this.time.now;
        if (now - this.lastShotTime < 220) return;
        this.lastShotTime = now;

        const blast = this.blasts.create(this.player.x + 26, this.player.y, 'coin');
        blast.setTint(0x00ff88).setScale(1.4, 0.25);
        blast.body.allowGravity = false;
        blast.setVelocityX(750);

        this.physics.add.overlap(blast, this.tieGroup, (b, tie) => {
            this._explode(tie.x, tie.y);
            tie.destroy();
            b.destroy();
            this.score += 100;
        });

        this.physics.add.overlap(blast, this.asteroidGroup, (b, a) => {
            a.destroy();
            b.destroy();
            this.score += 25;
        });

        this.time.delayedCall(1800, () => { if (blast.active) blast.destroy(); });
    }

    _explode(x, y) {
        const boom = this.add.text(x, y, '💥', { fontSize: '28px' }).setScrollFactor(0);
        // Convert to screen coords since boom is fixed
        boom.x = x - this.cameras.main.scrollX;
        boom.y = y - this.cameras.main.scrollY;
        this.time.delayedCall(350, () => boom.destroy());
    }

    _die() {
        this.isAlive = false;
        this._explode(this.player.x, this.player.y);
        this.player.destroy();
        this.time.delayedCall(1800, () => this.scene.restart());
    }

    _buildUI() {
        this.scoreText = this.add.text(16, 16, `SCORE: ${this.score}`, {
            fontSize: '16px', fill: '#00ff88', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 3
        }).setScrollFactor(0);

        this.add.text(16, 36, 'WORLD: 4-1 Death Star Trench Run', {
            fontSize: '11px', fill: '#ffe81f', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setScrollFactor(0);

        // Progress bar background
        this.add.rectangle(400, 8, 300, 10, 0x333333).setScrollFactor(0);
        this.progressBar = this.add.rectangle(251, 8, 0, 10, 0xffe81f).setOrigin(0, 0.5).setScrollFactor(0);
        this.add.text(260, 18, 'TARGET', {
            fontSize: '8px', fill: '#888', fontFamily: 'monospace'
        }).setScrollFactor(0);

        this.add.text(16, 460, 'WASD/↑↓←→: move  SPACE: fire', {
            fontSize: '10px', fill: '#aaaaaa', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setScrollFactor(0);

        // Anakin pilot portrait (top-right corner)
        this.add.sprite(768, 30, 'player_anakin').setFrame(0).setScale(0.32).setScrollFactor(0);
        this.add.text(748, 55, 'PILOT: ANAKIN', {
            fontSize: '9px', fill: '#44aaff', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5, 0).setScrollFactor(0);
    }

    update(time, delta) {
        if (!this.isAlive || this.introActive) return;

        this.elapsed += delta;
        const progress = Math.min(1, this.elapsed / RUN_DURATION);
        this.progressBar.width = 300 * progress;
        this.scoreText.setText(`SCORE: ${this.score}`);

        // Scroll star layers at different speeds for parallax
        this.starLayers.forEach(layer => {
            layer.forEach(s => {
                s.x -= s.getData('speed');
                if (s.x < -4) s.x = 804;
            });
        });

        // Scroll trench walls
        this.trenchTop.tilePositionX += 3;
        this.trenchBot.tilePositionX += 3;

        // Player movement
        const speed = 240;
        let vx = 0, vy = 0;
        if (this.cursors.left.isDown  || this.wasd.left.isDown)  vx = -speed;
        if (this.cursors.right.isDown || this.wasd.right.isDown) vx = speed;
        if (this.cursors.up.isDown    || this.wasd.up.isDown)    vy = -speed;
        if (this.cursors.down.isDown  || this.wasd.down.isDown)  vy = speed;
        this.player.setVelocity(vx, vy);

        // Slight tilt based on vertical movement
        this.player.setRotation(vy * 0.0008);

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this._shoot();

        // Win condition
        if (progress >= 1) {
            this.isAlive = false;
            this.add.text(400, 180, 'DEATH STAR\nDESTROYED! ⭐', {
                fontSize: '34px', fill: '#ffe81f', fontFamily: 'monospace',
                fontStyle: 'bold', stroke: '#000', strokeThickness: 5, align: 'center'
            }).setOrigin(0.5).setScrollFactor(0);

            this.add.text(400, 300, `Final Score: ${this.score}`, {
                fontSize: '22px', fill: '#ffffff', fontFamily: 'monospace',
                stroke: '#000', strokeThickness: 3
            }).setOrigin(0.5).setScrollFactor(0);

            this.time.delayedCall(4000, () => this.scene.start('EndScene', { score: this.score }));
        }
    }
}
