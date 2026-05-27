// SpaceChaseScene — the main space shooter in Anakin's Rescue.
// Four escalating phases, boss fight, health system, procedural textures.

const HEALTH_MAX = 100;
const HEALTH_REGEN = 5;      // HP/second during phases 1-3
const BOSS_REGEN = 20;       // HP/second during phase 4 (fast regen to compensate)
const BOSS_MAX_HP = 30;
const SHOT_COOLDOWN = 200;   // ms between player shots

export default class SpaceChaseScene extends Phaser.Scene {
    constructor() {
        super('SpaceChaseScene');
    }

    init(data) {
        this.score = data.score || 0;
    }

    create() {
        this.introActive = false;
        this.isAlive = true;
        this.elapsed = 0;
        this.lastShotTime = 0;
        this.currentPhase = 0;
        this.playerHP = HEALTH_MAX;
        this.bossHP = BOSS_MAX_HP;
        this.bossActive = false;
        this.bossSpawned = false;
        this.lastRegenTime = 0;
        this.lastBossShotTime = 0;
        this.bossInvincible = false;
        this.playerInvincible = false;

        this._generateTextures();
        this._buildWorld();
        this._buildPlayer();
        this._buildGroups();
        this._buildHUD();
        this._buildControls();

        // Phase timers / spawner handles
        this._tieFighterTimer = null;
        this._destroyerTimer = null;
        this._blasterTimer = null;

        // Start phase 1
        this._startPhase1();

        // Brief instructions overlay — fades out automatically after 5 s
        this._showInstructions();
    }

    _showInstructions() {
        const { width, height } = this.scale;
        const depth = 80;
        const objects = [];

        // Semi-transparent card
        const card = this.add.graphics().setScrollFactor(0).setDepth(depth);
        card.fillStyle(0x000011, 0.82);
        card.fillRoundedRect(width / 2 - 220, height / 2 - 90, 440, 180, 10);
        card.lineStyle(1, 0x334466, 1);
        card.strokeRoundedRect(width / 2 - 220, height / 2 - 90, 440, 180, 10);
        objects.push(card);

        const lines = [
            { text: 'HOW TO PLAY',           y: -58, size: '15px', color: '#ffe81f', bold: true },
            { text: 'WASD / Arrow Keys — move your ship',    y: -22, size: '12px', color: '#ccccdd' },
            { text: 'SPACE — fire blasters',                 y:   0, size: '12px', color: '#ccccdd' },
            { text: 'Destroy K-Padme\'s Guardian to win',    y:  22, size: '12px', color: '#ccccdd' },
            { text: 'Collect green orbs to restore HP',      y:  44, size: '12px', color: '#ccccdd' },
            { text: '— press any key to dismiss —',          y:  72, size: '10px', color: '#444466' },
        ];

        lines.forEach(({ text, y, size, color, bold }) => {
            const t = this.add.text(width / 2, height / 2 + y, text, {
                fontSize: size,
                fill: color,
                fontFamily: 'monospace',
                fontStyle: bold ? 'bold' : 'normal',
                stroke: '#000000',
                strokeThickness: 2,
            }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
            objects.push(t);
        });

        const dismiss = () => {
            this.tweens.add({
                targets: objects,
                alpha: 0,
                duration: 600,
                onComplete: () => objects.forEach(o => { if (o.active) o.destroy(); })
            });
        };

        // Auto-dismiss after 5 s, or immediately on any key / click
        const timer = this.time.delayedCall(5000, dismiss);
        this.input.keyboard.once('keydown', () => { timer.remove(false); dismiss(); });
        this.input.once('pointerdown', () => { timer.remove(false); dismiss(); });
    }

    // ─── Texture generation ──────────────────────────────────────────────────

    _generateTextures() {
        // Helper for generating without adding to scene
        const mk = () => this.make.graphics({ x: 0, y: 0, add: false });

        // O-Vader's dark fighter (130x55) — player ship
        if (!this.textures.exists('sw_xwing')) {
            const g = mk();
            // Fuselage — near-black with dark grey highlight
            g.fillStyle(0x0d0d12); g.fillRect(30, 18, 70, 18);
            g.fillStyle(0x1a1a24); g.fillRect(36, 20, 58, 6); // top highlight stripe
            // Nose — sharp point
            g.fillStyle(0x080810); g.fillTriangle(100, 18, 100, 36, 130, 27);
            // Engines — red glow
            g.fillStyle(0xaa1111); g.fillRect(22, 20, 12, 6);
            g.fillStyle(0xaa1111); g.fillRect(22, 29, 12, 6);
            g.fillStyle(0xff3333, 0.7); g.fillRect(22, 22, 6, 4); // core glow
            g.fillStyle(0xff3333, 0.7); g.fillRect(22, 31, 6, 4);
            // Swept wings — angular, dark
            g.fillStyle(0x111118);
            g.fillTriangle(30, 2, 85, 18, 35, 18);  // upper wing
            g.fillTriangle(30, 52, 85, 36, 35, 36); // lower wing
            // Red accent lines on wings
            g.fillStyle(0xcc1111);
            g.fillRect(34, 4, 44, 2);
            g.fillRect(34, 48, 44, 2);
            // Dark sith glow on nose tip
            g.fillStyle(0x660000, 0.5); g.fillRect(118, 24, 12, 6);
            g.generateTexture('sw_xwing', 130, 55);
            g.destroy();
        }

        // TIE Fighter (90x80)
        if (!this.textures.exists('sw_tie')) {
            const g = mk();
            // Cockpit sphere
            g.fillStyle(0x445566); g.fillCircle(45, 40, 16);
            // Eye lens glow
            g.fillStyle(0x00cc55); g.fillEllipse(45, 40, 12, 10);
            // Left arm
            g.fillStyle(0x333344); g.fillRect(0, 36, 26, 8);
            // Right arm
            g.fillRect(64, 36, 26, 8);
            // Left solar panel — hexagonal approximation
            g.fillStyle(0x2244aa);
            g.fillRect(0, 10, 26, 60);
            // Hex grid lines on panels
            g.lineStyle(1, 0x334488, 0.8);
            for (let i = 15; i < 70; i += 12) {
                g.beginPath(); g.moveTo(0, i); g.lineTo(26, i); g.strokePath();
            }
            // Right solar panel
            g.fillStyle(0x2244aa); g.fillRect(64, 10, 26, 60);
            g.lineStyle(1, 0x334488, 0.8);
            for (let i = 15; i < 70; i += 12) {
                g.beginPath(); g.moveTo(64, i); g.lineTo(90, i); g.strokePath();
            }
            g.generateTexture('sw_tie', 90, 80);
            g.destroy();
        }

        // Blaster bolt — player (24x8)
        if (!this.textures.exists('sw_blaster')) {
            const g = mk();
            g.fillStyle(0xff6600); g.fillRect(0, 2, 20, 4);
            g.fillStyle(0xffaa33); g.fillRect(4, 3, 12, 2);
            g.generateTexture('sw_blaster', 24, 8);
            g.destroy();
        }

        // Enemy blast (20x8)
        if (!this.textures.exists('sw_enemy_blast')) {
            const g = mk();
            g.fillStyle(0xee1111); g.fillRect(0, 2, 18, 4);
            g.fillStyle(0xff5555); g.fillRect(3, 3, 10, 2);
            g.generateTexture('sw_enemy_blast', 20, 8);
            g.destroy();
        }

        // Star Destroyer (200x80)
        if (!this.textures.exists('sw_destroyer')) {
            const g = mk();
            // Hull — large triangle pointing right
            g.fillStyle(0x222233);
            g.fillTriangle(0, 10, 0, 70, 200, 40);
            // Bridge tower
            g.fillStyle(0x333344); g.fillRect(50, 2, 20, 14);
            // Panel lines
            g.lineStyle(1, 0x445566, 0.6);
            for (let i = 1; i < 5; i++) {
                const x = i * 40;
                const spread = 30 * (1 - x / 200);
                g.beginPath(); g.moveTo(x, 40 - spread); g.lineTo(x, 40 + spread); g.strokePath();
            }
            // Engine glow at back
            g.fillStyle(0x2255ff, 0.8); g.fillRect(0, 30, 8, 20);
            g.generateTexture('sw_destroyer', 200, 80);
            g.destroy();
        }

        // K-Padme's Guardian — white star destroyer boss (320x130)
        if (!this.textures.exists('sw_vader_ship')) {
            const g = mk();
            // Main hull — white/ivory elongated dagger
            g.fillStyle(0xf0f0ee);
            g.fillTriangle(0, 25, 0, 105, 320, 65);
            // Mid-tone overlay to give depth
            g.fillStyle(0xd8d8d4, 0.6);
            g.fillTriangle(0, 35, 0, 95, 240, 65);
            // Horizontal deck bands
            g.lineStyle(1, 0xbbbbaa, 0.9);
            g.beginPath(); g.moveTo(0, 48); g.lineTo(280, 65); g.strokePath();
            g.beginPath(); g.moveTo(0, 82); g.lineTo(280, 65); g.strokePath();
            // Bridge tower — white with gold trim
            g.fillStyle(0xe8e8e2); g.fillRect(120, 10, 28, 22);
            g.fillStyle(0xd4aa44); g.fillRect(120, 10, 28, 3); // gold top trim
            // Command bridge cluster
            g.fillStyle(0xffffff); g.fillRect(140, 6, 16, 14);
            g.fillStyle(0xd4aa44); g.fillRect(140, 6, 16, 2); // gold accent
            // Engine bank — white-blue glow
            const engineY = [42, 55, 65, 75, 88];
            engineY.forEach(ey => {
                g.fillStyle(0xaaccff, 0.9); g.fillCircle(8, ey, 6);
                g.fillStyle(0xffffff, 0.8); g.fillCircle(8, ey, 3);
            });
            // Gold atmosphere glow around bridge
            g.fillStyle(0xd4aa44, 0.25); g.fillCircle(148, 14, 22);
            // Hull panel lines — subtle silver
            g.lineStyle(1, 0x999990, 0.45);
            for (let i = 1; i < 8; i++) {
                const x = i * 38;
                const spread = 38 * (1 - x / 320);
                g.beginPath(); g.moveTo(x, 65 - spread); g.lineTo(x, 65 + spread); g.strokePath();
            }
            // Decorative gold stripe along hull center
            g.fillStyle(0xd4aa44, 0.4); g.fillRect(20, 63, 260, 3);
            g.generateTexture('sw_vader_ship', 320, 130);
            g.destroy();
        }

        // Health orb — bright green (16x16)
        if (!this.textures.exists('sw_health_orb')) {
            const g = mk();
            g.fillStyle(0x00ff44, 0.9); g.fillCircle(8, 8, 7);
            g.fillStyle(0x88ffaa, 0.7); g.fillCircle(6, 6, 3);
            g.generateTexture('sw_health_orb', 16, 16);
            g.destroy();
        }
    }

    // ─── World ───────────────────────────────────────────────────────────────

    _buildWorld() {
        const { width, height } = this.scale;

        if (this.textures.exists('bg_starwars')) {
            this.add.image(width / 2, height / 2, 'bg_starwars').setScrollFactor(0).setDepth(-2);
        } else {
            this.cameras.main.setBackgroundColor('#000011');
        }

        // Parallax star layers
        this._starLayers = [[], [], []];
        const speeds = [0.3, 0.7, 1.3];
        const counts = [70, 35, 18];
        speeds.forEach((speed, i) => {
            for (let j = 0; j < counts[i]; j++) {
                const star = this.add.rectangle(
                    Phaser.Math.Between(0, width),
                    Phaser.Math.Between(0, height),
                    i + 1, i + 1, 0xffffff
                ).setScrollFactor(0).setDepth(-1).setAlpha(Phaser.Math.FloatBetween(0.3, 0.9));
                star.setData('speed', speed);
                this._starLayers[i].push(star);
            }
        });
    }

    // ─── Player ──────────────────────────────────────────────────────────────

    _buildPlayer() {
        this.physics.world.setBounds(0, 0, 800, 500);
        this.player = this.physics.add.sprite(120, 250, 'sw_xwing')
            .setCollideWorldBounds(true);
        this.player.body.allowGravity = false;
        this.player.setDepth(10);
    }

    // ─── Groups ──────────────────────────────────────────────────────────────

    _buildGroups() {
        this.playerBlasts = this.physics.add.group();
        this.enemyBlasts = this.physics.add.group();
        this.tieGroup = this.physics.add.group();
        this.destroyerGroup = this.physics.add.group();
        this.healthOrbs = this.physics.add.group();

        // Player blasts hit TIEs
        this.physics.add.overlap(this.playerBlasts, this.tieGroup, (blast, tie) => {
            if (!blast.active || !tie.active) return;
            this._explode(tie.x, tie.y, 22);
            if (Math.random() < 0.3) this._spawnHealthOrb(tie.x, tie.y);
            blast.destroy();
            tie.destroy();
            this.score += 100;
            this._updateHUD();
        });

        // Player blasts hit destroyers
        this.physics.add.overlap(this.playerBlasts, this.destroyerGroup, (blast, ds) => {
            if (!blast.active || !ds.active) return;
            this._explode(blast.x, blast.y, 14);
            blast.destroy();
            this.score += 30;
            this._updateHUD();
        });

        // Enemy blasts hit player — sprite first so callback is (player, blast)
        this.physics.add.overlap(this.player, this.enemyBlasts, (_p, blast) => {
            if (!blast.active || !this.isAlive) return;
            blast.destroy();
            this._damagePlayer(15);
        });

        // TIEs hit player
        this.physics.add.overlap(this.player, this.tieGroup, (_p, _tie) => {
            if (!this.isAlive) return;
            this._damagePlayer(30);
        });

        // Destroyers hit player
        this.physics.add.overlap(this.player, this.destroyerGroup, (_p, _ds) => {
            if (!this.isAlive) return;
            this._damagePlayer(20);
        });

        // Health orbs collected — sprite first so callback is (player, orb)
        this.physics.add.overlap(this.player, this.healthOrbs, (_p, orb) => {
            if (!orb.active) return;
            orb.destroy();
            this.playerHP = Math.min(HEALTH_MAX, this.playerHP + 25);
            this._updateHUD();
        });
    }

    // ─── HUD ─────────────────────────────────────────────────────────────────

    _buildHUD() {
        const depth = 50;

        this.scoreText = this.add.text(16, 16, 'SCORE: 0', {
            fontSize: '15px', fill: '#00ff88', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 3
        }).setScrollFactor(0).setDepth(depth);

        // Health bar backing
        this.add.text(16, 38, 'HP:', {
            fontSize: '12px', fill: '#aaaaaa', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setScrollFactor(0).setDepth(depth);

        this.add.rectangle(104, 44, 204, 18, 0x222222).setScrollFactor(0).setDepth(depth).setOrigin(0, 0.5);
        this.hpBar = this.add.rectangle(104, 44, 200, 14, 0x00cc44).setScrollFactor(0).setDepth(depth).setOrigin(0, 0.5);

        this.hpText = this.add.text(312, 38, '100', {
            fontSize: '12px', fill: '#aaffaa', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setScrollFactor(0).setDepth(depth);

        // Phase name text (center-top, fades out)
        this.phaseText = this.add.text(400, 22, '', {
            fontSize: '18px', fill: '#ffe81f', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth).setAlpha(0);

        // Boss health bar (top-right, hidden until phase 4)
        this.bossBarGroup = this.add.group();
        const bossLabel = this.add.text(784, 16, "K-PADME'S GUARDIAN", {
            fontSize: '11px', fill: '#ff4444', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(depth).setAlpha(0);

        this.add.rectangle(784 - 150, 32, 154, 14, 0x330000).setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth).setAlpha(0).setName('bossBarBg');
        this.bossBar = this.add.rectangle(784 - 150, 32, 150, 10, 0xcc2222).setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth).setAlpha(0);

        this._bossLabel = bossLabel;
        this._bossBarBg = this.children.getByName('bossBarBg');

        // Controls hint
        this.add.text(16, 484, 'WASD/ARROWS: move   SPACE: fire', {
            fontSize: '10px', fill: '#666677', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setScrollFactor(0).setDepth(depth).setOrigin(0, 1);
    }

    _buildControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({ up: 'W', left: 'A', right: 'D', down: 'S' });
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    // ─── Phase management ────────────────────────────────────────────────────

    _startPhase1() {
        this.currentPhase = 1;
        this._showPhaseTitle('PHASE 1 — BLASTER FIRE');
        this._blasterTimer = this.time.addEvent({
            delay: 1400,
            callback: this._spawnBlasterBolt,
            callbackScope: this,
            loop: true
        });
    }

    _startPhase2() {
        this.currentPhase = 2;
        this._showPhaseTitle('PHASE 2 — TIE FIGHTERS');
        this._tieFighterTimer = this.time.addEvent({
            delay: 2500,
            callback: this._spawnTIE,
            callbackScope: this,
            loop: true
        });
    }

    _startPhase3() {
        this.currentPhase = 3;
        this._showPhaseTitle('PHASE 3 — STAR DESTROYERS');
        this._destroyerTimer = this.time.addEvent({
            delay: 8000,
            callback: this._spawnDestroyer,
            callbackScope: this,
            loop: true
        });
        // Also spawn an immediate destroyer
        this._spawnDestroyer();
    }

    _startPhase4() {
        this.currentPhase = 4;
        this._showPhaseTitle("PHASE 4 — K-PADME'S GUARDIAN");

        // Stop regular spawners
        if (this._tieFighterTimer) this._tieFighterTimer.remove(false);
        if (this._destroyerTimer) this._destroyerTimer.remove(false);
        if (this._blasterTimer) this._blasterTimer.remove(false);

        // Clear existing enemies
        this.tieGroup.clear(true, true);
        this.destroyerGroup.clear(true, true);
        this.enemyBlasts.clear(true, true);

        this._spawnBoss();

        // Show boss health bar
        this._bossLabel.setAlpha(1);
        if (this._bossBarBg) this._bossBarBg.setAlpha(1);
        this.bossBar.setAlpha(1);
    }

    _showPhaseTitle(label) {
        this.phaseText.setText(label).setAlpha(1);
        this.tweens.add({
            targets: this.phaseText,
            alpha: 0,
            duration: 800,
            delay: 2000
        });
    }

    // ─── Spawners ────────────────────────────────────────────────────────────

    _spawnBlasterBolt() {
        if (!this.isAlive || this.currentPhase >= 4) return;
        const y = Phaser.Math.Between(40, 460);
        const bolt = this.enemyBlasts.create(820, y, 'sw_enemy_blast');
        bolt.body.allowGravity = false;
        bolt.setVelocityX(-420);
        this.time.delayedCall(2500, () => { if (bolt.active) bolt.destroy(); });
    }

    _spawnTIE() {
        if (!this.isAlive || this.currentPhase < 2 || this.currentPhase >= 4) return;
        const y = Phaser.Math.Between(50, 450);
        const tie = this.tieGroup.create(860, y, 'sw_tie');
        tie.body.allowGravity = false;

        const pattern = Phaser.Math.Between(0, 2);
        if (pattern === 0) {
            tie.setVelocityX(-180);
        } else if (pattern === 1) {
            tie.setVelocityX(-160);
            tie.setVelocityY(y < 250 ? 60 : -60);
        } else {
            tie.setVelocityX(-260);
        }

        // TIE fires a blast after delay
        this.time.delayedCall(Phaser.Math.Between(500, 1400), () => {
            if (!tie.active || !this.isAlive) return;
            const shot = this.enemyBlasts.create(tie.x, tie.y, 'sw_enemy_blast');
            shot.body.allowGravity = false;
            shot.setVelocityX(-390);
            this.time.delayedCall(2500, () => { if (shot.active) shot.destroy(); });
        });

        this.time.delayedCall(7000, () => { if (tie.active) tie.destroy(); });
    }

    _spawnDestroyer() {
        if (!this.isAlive || this.currentPhase < 3 || this.currentPhase >= 4) return;
        const y = Phaser.Math.Between(80, 420);
        const ds = this.destroyerGroup.create(920, y, 'sw_destroyer');
        ds.body.allowGravity = false;
        ds.setVelocityX(-90);
        ds.setFlipX(false);

        // Fires a volley of blasts
        this.time.addEvent({
            delay: 1200,
            callback: () => {
                if (!ds.active || !this.isAlive) return;
                for (let i = -1; i <= 1; i++) {
                    const shot = this.enemyBlasts.create(ds.x, ds.y + i * 20, 'sw_enemy_blast');
                    shot.body.allowGravity = false;
                    shot.setVelocityX(-300);
                    this.time.delayedCall(2500, () => { if (shot.active) shot.destroy(); });
                }
            },
            repeat: 3
        });

        this.time.delayedCall(10000, () => { if (ds.active) ds.destroy(); });
    }

    _spawnBoss() {
        this.bossSpawned = true;
        this.bossHP = BOSS_MAX_HP;
        this.boss = this.physics.add.sprite(820, 250, 'sw_vader_ship');
        this.boss.body.allowGravity = false;
        this.boss.setDepth(8);

        // Slide in from right
        this.tweens.add({
            targets: this.boss,
            x: 570,
            duration: 3000,
            ease: 'Sine.easeOut',
            onComplete: () => {
                this.bossActive = true;
                this._bossMoveLoop();
            }
        });

        // Player blasts overlap boss — sprite first so callback is (boss, blast)
        this.physics.add.overlap(this.boss, this.playerBlasts, (_boss, blast) => {
            if (!blast.active || !this.bossActive || this.bossInvincible) return;
            blast.destroy();
            this._hitBoss();
        });
    }

    _bossMoveLoop() {
        if (!this.boss || !this.boss.active || !this.bossActive) return;

        const bossY = this.boss.y;
        let dir;
        if (bossY < 90) {
            dir = 90;       // too close to top — force down
        } else if (bossY > 410) {
            dir = -90;      // too close to bottom — force up
        } else {
            dir = Math.random() < 0.5 ? 90 : -90;
        }

        this.boss.setVelocityY(dir);
        this.time.delayedCall(1400, () => this._bossMoveLoop());
    }

    _hitBoss() {
        this.bossHP--;
        this.score += 200;
        this._updateHUD();

        // Flash
        this.bossInvincible = true;
        this.boss.setTint(0xff4444);
        this.time.delayedCall(300, () => {
            if (this.boss && this.boss.active) {
                this.boss.clearTint();
            }
            this.bossInvincible = false;
        });

        // Update boss health bar
        const pct = this.bossHP / BOSS_MAX_HP;
        this.bossBar.width = 150 * pct;

        // On-fire effect at 50%
        if (this.bossHP <= BOSS_MAX_HP / 2) {
            if (this.boss && this.boss.active) {
                this.boss.setTint(0xff6622);
            }
        }

        if (this.bossHP <= 0) {
            this._killBoss();
        }
    }

    _killBoss() {
        this.bossActive = false;
        this.isAlive = false;

        // Explosion emojis around the ship
        const offsets = [[-60, -30], [60, -30], [-60, 30], [60, 30]];
        offsets.forEach(([ox, oy]) => {
            const boom = this.add.text(
                this.boss.x + ox,
                this.boss.y + oy,
                '💥',
                { fontSize: '32px' }
            ).setDepth(60).setScrollFactor(0);
            this.time.delayedCall(600, () => { if (boom.active) boom.destroy(); });
        });

        // Fade out boss
        this.tweens.add({
            targets: this.boss,
            alpha: 0,
            duration: 1500,
            onComplete: () => {
                if (this.boss) this.boss.destroy();
                this.time.delayedCall(1000, () => {
                    this.scene.start('EndingCutsceneScene', { score: this.score });
                });
            }
        });

        this.add.text(400, 220, 'GUARDIAN DESTROYED!', {
            fontSize: '26px', fill: '#ffe81f', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(60);
    }

    // ─── Player actions ──────────────────────────────────────────────────────

    _shoot() {
        const now = this.time.now;
        if (now - this.lastShotTime < SHOT_COOLDOWN) return;
        this.lastShotTime = now;

        const blast = this.playerBlasts.create(this.player.x + 65, this.player.y, 'sw_blaster');
        blast.body.allowGravity = false;
        blast.setVelocityX(700);
        blast.setDepth(9);
        this.time.delayedCall(1600, () => { if (blast.active) blast.destroy(); });
    }

    _damagePlayer(amount) {
        if (!this.isAlive || this.playerInvincible) return;
        this.playerHP -= amount;
        this._updateHUD();

        // Tint flash (never touches alpha — avoids multi-tween alpha conflicts)
        this.playerInvincible = true;
        this.player.setTint(0xff6666);
        this.time.delayedCall(180, () => {
            if (this.player && this.player.active) this.player.clearTint();
        });
        this.time.delayedCall(600, () => { this.playerInvincible = false; });

        if (this.playerHP <= 0) {
            this.playerHP = 0;
            this._playerDie();
        }
    }

    _playerDie() {
        if (!this.isAlive) return;
        this.isAlive = false;
        if (!this.player || !this.player.active) return;

        this.player.clearTint();

        const px = this.player.x;
        const py = this.player.y;

        // Staggered explosions
        this._explode(px, py, 38);
        this.time.delayedCall(130, () => this._explode(px - 35, py - 18, 26));
        this.time.delayedCall(260, () => this._explode(px + 28, py + 14, 22));

        // Camera flash
        this.cameras.main.flash(500, 255, 80, 80);

        // Ship expands and fades out
        this.tweens.add({
            targets: this.player,
            alpha: 0,
            scaleX: 2.8,
            scaleY: 2.8,
            duration: 450
        });

        this.time.delayedCall(1800, () => {
            this.scene.restart({ score: this.score });
        });
    }

    // ─── Health pickup ───────────────────────────────────────────────────────

    _spawnHealthOrb(x, y) {
        const orb = this.healthOrbs.create(x, y, 'sw_health_orb');
        orb.body.allowGravity = false;
        orb.setVelocityX(Phaser.Math.Between(-60, -30));
        orb.setVelocityY(Phaser.Math.Between(-30, 30));
        this.time.delayedCall(6000, () => { if (orb.active) orb.destroy(); });
    }

    // ─── HUD update ──────────────────────────────────────────────────────────

    _updateHUD() {
        this.scoreText.setText(`SCORE: ${this.score}`);

        const pct = this.playerHP / HEALTH_MAX;
        this.hpBar.width = 200 * pct;
        if (pct > 0.5) {
            this.hpBar.setFillStyle(0x00cc44);
        } else if (pct > 0.25) {
            this.hpBar.setFillStyle(0xffcc00);
        } else {
            this.hpBar.setFillStyle(0xcc2222);
        }
        this.hpText.setText(String(Math.max(0, Math.round(this.playerHP))));
    }

    // ─── Utility ─────────────────────────────────────────────────────────────

    _explode(x, y, fontSize) {
        const boom = this.add.text(x, y, '💥', { fontSize: `${fontSize || 22}px` })
            .setScrollFactor(0).setDepth(55);
        this.time.delayedCall(400, () => { if (boom.active) boom.destroy(); });
    }

    // ─── Update loop ─────────────────────────────────────────────────────────

    update(time, delta) {
        if (!this.isAlive && this.currentPhase !== 4) return;
        if (this.currentPhase === 4 && !this.bossActive && !this.bossSpawned) return;

        this.elapsed += delta;

        // Scroll stars
        this._starLayers.forEach(layer => {
            layer.forEach(s => {
                s.x -= s.getData('speed');
                if (s.x < -4) s.x = 804;
            });
        });

        // Phase transitions
        if (this.currentPhase === 1 && this.elapsed >= 15000) this._startPhase2();
        if (this.currentPhase === 2 && this.elapsed >= 35000) this._startPhase3();
        if (this.currentPhase === 3 && this.elapsed >= 60000) this._startPhase4();

        // Health regen — faster during boss fight to compensate for heavy fire
        if (this.isAlive) {
            const rate = this.currentPhase === 4 ? BOSS_REGEN : HEALTH_REGEN;
            const regenAmt = (rate * delta) / 1000;
            this.playerHP = Math.min(HEALTH_MAX, this.playerHP + regenAmt);
            this._updateHUD();
        }

        if (!this.isAlive) return;
        if (!this.player || !this.player.body) return;

        // Player movement
        const speed = 240;
        let vx = 0, vy = 0;
        if (this.cursors.left.isDown  || this.wasd.left.isDown)  vx = -speed;
        if (this.cursors.right.isDown || this.wasd.right.isDown) vx =  speed;
        if (this.cursors.up.isDown    || this.wasd.up.isDown)    vy = -speed;
        if (this.cursors.down.isDown  || this.wasd.down.isDown)  vy =  speed;
        this.player.setVelocity(vx, vy);
        this.player.setRotation(vy * 0.0007);

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this._shoot();

        // Boss fires at player
        if (this.bossActive && this.boss && this.boss.active) {
            if (time - this.lastBossShotTime > 900) {
                this.lastBossShotTime = time;
                this._bossFireSpread();
            }
        }
    }

    _bossFireSpread() {
        if (!this.boss || !this.boss.active) return;
        const offsets = [-50, -25, 0, 25, 50];
        offsets.forEach(dy => {
            const shot = this.enemyBlasts.create(this.boss.x - 160, this.boss.y + dy, 'sw_enemy_blast');
            shot.body.allowGravity = false;
            shot.setVelocityX(-320);
            this.time.delayedCall(3000, () => { if (shot.active) shot.destroy(); });
        });
    }
}
