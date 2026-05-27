import { SW_DIALOGUE } from '../gameConfig.js';

// DuelScene — Anakin vs Vader lightsaber duel inside the Executor.
// Platformer-style combat: move, jump, attack. Vader AI walks toward player.

const ANAKIN_HP_MAX = 100;
const VADER_HP_MAX = 3;
const ATTACK_RANGE = 120;
const ATTACK_COOLDOWN = 600;
const VADER_ATTACK_INTERVAL = 1500;
const VADER_INVINCIBLE_TIME = 500;

export default class DuelScene extends Phaser.Scene {
    constructor() {
        super('DuelScene');
    }

    init(data) {
        this.score = data.score || 0;
    }

    create() {
        this.introActive = false;
        this.isAlive = true;
        this.duelOver = false;

        this.anakinHP = ANAKIN_HP_MAX;
        this.vaderHP = VADER_HP_MAX;
        this.lastAttackTime = 0;
        this.vaderInvincible = false;
        this.vaderAttackTimer = 0;
        this._hitDisplayed = [false, false]; // track dialogue per hit

        this._generateTextures();
        this._buildBackground();
        this._buildPlatforms();
        this._buildCharacters();
        this._buildSabers();
        this._buildHUD();
        this._buildControls();

        // Show opening duel dialogue
        this._dialogueQueue = SW_DIALOGUE.duel.start.slice();
        this._dialogueIndex = 0;
        this._inputBlocked = true;
        this._showNextStartDialogue();
    }

    // ─── Texture generation ──────────────────────────────────────────────────

    _generateTextures() {
        const mk = () => this.make.graphics({ x: 0, y: 0, add: false });

        // Anakin body (80x130)
        if (!this.textures.exists('anakin_body')) {
            const g = mk();
            // Hair
            g.fillStyle(0x3d2510); g.fillRect(26, 0, 28, 14);
            // Face
            g.fillStyle(0xd4956a); g.fillEllipse(40, 22, 24, 26);
            // Eyes
            g.fillStyle(0x4a3000); g.fillRect(32, 20, 5, 4); g.fillRect(43, 20, 5, 4);
            // Torso — dark brown robes
            g.fillStyle(0x2a1e0e); g.fillRect(16, 34, 48, 46);
            // Arms
            g.fillRect(4, 36, 14, 34);
            g.fillRect(62, 36, 14, 34);
            // Belt
            g.fillStyle(0x111111); g.fillRect(16, 78, 48, 8);
            // Legs
            g.fillStyle(0x2a1e0e);
            g.fillRect(18, 86, 20, 34);
            g.fillRect(42, 86, 20, 34);
            // Boots
            g.fillStyle(0x111111);
            g.fillRect(16, 108, 22, 22);
            g.fillRect(42, 108, 22, 22);
            g.generateTexture('anakin_body', 80, 130);
            g.destroy();
        }

        // Anakin attack (arm extends right)
        if (!this.textures.exists('anakin_attack')) {
            const g = mk();
            g.fillStyle(0x3d2510); g.fillRect(26, 0, 28, 14);
            g.fillStyle(0xd4956a); g.fillEllipse(40, 22, 24, 26);
            g.fillStyle(0x4a3000); g.fillRect(32, 20, 5, 4); g.fillRect(43, 20, 5, 4);
            g.fillStyle(0x2a1e0e); g.fillRect(16, 34, 48, 46);
            // Extended right arm
            g.fillRect(4, 36, 14, 34);
            g.fillRect(62, 34, 16, 14);  // arm reaching out
            g.fillStyle(0xd4956a); g.fillRect(76, 34, 4, 10); // hand
            g.fillStyle(0x111111); g.fillRect(16, 78, 48, 8);
            g.fillStyle(0x2a1e0e);
            g.fillRect(18, 86, 20, 34); g.fillRect(42, 86, 20, 34);
            g.fillStyle(0x111111);
            g.fillRect(16, 108, 22, 22); g.fillRect(42, 108, 22, 22);
            g.generateTexture('anakin_attack', 80, 130);
            g.destroy();
        }

        // Vader body (96x155)
        if (!this.textures.exists('vader_body')) {
            const g = mk();
            // Cape — dark rect behind body, wider
            g.fillStyle(0x0a0a0a); g.fillRect(4, 30, 88, 100);
            // Helmet dome
            g.fillStyle(0x111111); g.fillEllipse(48, 18, 56, 44);
            // Face plate
            g.fillStyle(0x1a1a1a); g.fillRect(20, 28, 56, 30);
            // Breathing apparatus lines
            g.lineStyle(1, 0x333333, 1);
            for (let i = 0; i < 4; i++) {
                g.beginPath(); g.moveTo(24, 35 + i * 6); g.lineTo(72, 35 + i * 6); g.strokePath();
            }
            // Eye lenses
            g.fillStyle(0x222222); g.fillRect(28, 30, 14, 8); g.fillRect(54, 30, 14, 8);
            // Neck collar
            g.fillStyle(0x333333); g.fillRect(34, 56, 28, 10);
            // Torso
            g.fillStyle(0x111111); g.fillRect(20, 64, 56, 44);
            // Chest control panel
            g.fillStyle(0x222233); g.fillRect(28, 68, 40, 26);
            // Colored panel dots
            const panelColors = [0xff2222, 0x22ff22, 0xffff22, 0x2255ff];
            panelColors.forEach((c, i) => {
                g.fillStyle(c, 0.9); g.fillCircle(34 + i * 9, 74, 3);
                g.fillStyle(c, 0.6); g.fillCircle(34 + i * 9, 84, 3);
            });
            // Belt
            g.fillStyle(0x333333); g.fillRect(20, 108, 56, 10);
            g.fillStyle(0x444444); g.fillRect(30, 110, 36, 6);
            // Legs
            g.fillStyle(0x111111);
            g.fillRect(22, 118, 22, 30); g.fillRect(52, 118, 22, 30);
            // Boots
            g.fillRect(20, 136, 26, 19); g.fillRect(50, 136, 26, 19);
            g.generateTexture('vader_body', 96, 155);
            g.destroy();
        }

        // Vader attack — leaned forward
        if (!this.textures.exists('vader_attack')) {
            const g = mk();
            g.fillStyle(0x0a0a0a); g.fillRect(4, 30, 88, 100);
            g.fillStyle(0x111111); g.fillEllipse(50, 16, 56, 44);
            g.fillStyle(0x1a1a1a); g.fillRect(22, 26, 56, 30);
            g.lineStyle(1, 0x333333, 1);
            for (let i = 0; i < 4; i++) {
                g.beginPath(); g.moveTo(26, 33 + i * 6); g.lineTo(74, 33 + i * 6); g.strokePath();
            }
            g.fillStyle(0x222222); g.fillRect(30, 28, 14, 8); g.fillRect(56, 28, 14, 8);
            g.fillStyle(0x333333); g.fillRect(36, 54, 28, 10);
            g.fillStyle(0x111111); g.fillRect(22, 62, 56, 44);
            g.fillStyle(0x222233); g.fillRect(30, 66, 40, 26);
            const pc = [0xff2222, 0x22ff22, 0xffff22, 0x2255ff];
            pc.forEach((c, i) => {
                g.fillStyle(c, 0.9); g.fillCircle(36 + i * 9, 72, 3);
                g.fillStyle(c, 0.6); g.fillCircle(36 + i * 9, 82, 3);
            });
            g.fillStyle(0x333333); g.fillRect(22, 106, 56, 10);
            g.fillStyle(0x111111); g.fillRect(24, 116, 22, 30); g.fillRect(54, 116, 22, 30);
            g.fillRect(22, 134, 26, 21); g.fillRect(52, 134, 26, 21);
            g.generateTexture('vader_attack', 96, 155);
            g.destroy();
        }

        // Vader hit — leaned backward
        if (!this.textures.exists('vader_hit')) {
            const g = mk();
            g.fillStyle(0x0a0a0a); g.fillRect(2, 28, 88, 100);
            g.fillStyle(0x111111); g.fillEllipse(44, 18, 56, 44);
            g.fillStyle(0x1a1a1a); g.fillRect(16, 28, 56, 30);
            g.lineStyle(1, 0x333333, 1);
            for (let i = 0; i < 4; i++) {
                g.beginPath(); g.moveTo(20, 35 + i * 6); g.lineTo(68, 35 + i * 6); g.strokePath();
            }
            g.fillStyle(0x222222); g.fillRect(24, 30, 14, 8); g.fillRect(50, 30, 14, 8);
            g.fillStyle(0x333333); g.fillRect(30, 56, 28, 10);
            g.fillStyle(0x111111); g.fillRect(14, 64, 56, 44);
            g.fillStyle(0x222233); g.fillRect(22, 68, 40, 26);
            const hc = [0xff2222, 0x22ff22, 0xffff22, 0x2255ff];
            hc.forEach((c, i) => {
                g.fillStyle(c, 0.9); g.fillCircle(28 + i * 9, 74, 3);
                g.fillStyle(c, 0.6); g.fillCircle(28 + i * 9, 84, 3);
            });
            g.fillStyle(0x333333); g.fillRect(14, 108, 56, 10);
            g.fillStyle(0x111111); g.fillRect(16, 118, 22, 30); g.fillRect(46, 118, 22, 30);
            g.fillRect(14, 136, 26, 19); g.fillRect(44, 136, 26, 19);
            g.generateTexture('vader_hit', 96, 155);
            g.destroy();
        }
    }

    // ─── Background ──────────────────────────────────────────────────────────

    _buildBackground() {
        const { width, height } = this.scale;
        const g = this.add.graphics().setDepth(-2);

        // Dark wall panels
        g.fillStyle(0x1a1a1e); g.fillRect(0, 0, width, height);

        // Metal floor
        g.fillStyle(0x111116); g.fillRect(0, height - 60, width, 60);
        g.lineStyle(1, 0x222228, 0.8);
        for (let x = 0; x < width; x += 80) {
            g.beginPath(); g.moveTo(x, height - 60); g.lineTo(x, height); g.strokePath();
        }

        // Red accent lighting strips
        g.lineStyle(3, 0x880000, 0.9);
        g.beginPath(); g.moveTo(0, 55); g.lineTo(width, 55); g.strokePath();
        g.beginPath(); g.moveTo(0, height - 65); g.lineTo(width, height - 65); g.strokePath();

        // Thinner red accents
        g.lineStyle(1, 0x550000, 0.7);
        g.beginPath(); g.moveTo(0, 70); g.lineTo(width, 70); g.strokePath();

        // Vertical pipe-like columns
        for (let x = 80; x < width; x += 120) {
            g.fillStyle(0x151518, 1);
            g.fillRect(x, 60, 16, height - 120);
            g.lineStyle(1, 0x222228, 0.6);
            g.strokeRect(x, 60, 16, height - 120);
            // Conduit detail
            g.lineStyle(1, 0x440000, 0.5);
            g.beginPath(); g.moveTo(x + 8, 60); g.lineTo(x + 8, height - 60); g.strokePath();
        }

        // Ceiling structural beams
        g.fillStyle(0x111114, 1);
        g.fillRect(0, 0, width, 55);
        g.lineStyle(2, 0x220000, 0.8);
        for (let x = 0; x < width; x += 200) {
            g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 50, 55); g.strokePath();
        }

        // Glow atmosphere — dim red in background
        g.fillStyle(0x330000, 0.08);
        g.fillRect(0, 0, width, height);
    }

    // ─── Platforms ───────────────────────────────────────────────────────────

    _buildPlatforms() {
        const { width, height } = this.scale;

        this.platforms = this.physics.add.staticGroup();
        const floor = this.platforms.create(width / 2, height - 20, null);
        floor.setVisible(false);
        floor.displayWidth = width;
        floor.displayHeight = 40;
        floor.refreshBody();
    }

    // ─── Characters ──────────────────────────────────────────────────────────

    _buildCharacters() {
        const { height } = this.scale;
        const floorY = height - 60;

        this.anakin = this.physics.add.sprite(160, floorY - 65, 'anakin_body')
            .setCollideWorldBounds(true);

        this.vader = this.physics.add.sprite(640, floorY - 78, 'vader_body')
            .setCollideWorldBounds(true)
            .setFlipX(true);

        this.physics.add.collider(this.anakin, this.platforms);
        this.physics.add.collider(this.vader, this.platforms);

        this.vader.setDepth(2);
        this.anakin.setDepth(3);
    }

    // ─── Lightsabers ─────────────────────────────────────────────────────────

    _buildSabers() {
        this._anakinSaber = this.add.graphics().setDepth(4);
        this._vaderSaber = this.add.graphics().setDepth(4);
        this._drawSaber(this._anakinSaber, 0x0044ff, 0x4488ff, 0x88ccff);
        this._drawSaber(this._vaderSaber, 0xcc0000, 0xff3333, 0xff8888);
    }

    _drawSaber(gfx, core, mid, outer) {
        gfx.clear();
        // Outer glow
        gfx.fillStyle(outer, 0.2); gfx.fillRect(-4, -60, 8, 60);
        // Mid glow
        gfx.fillStyle(mid, 0.5); gfx.fillRect(-3, -60, 6, 60);
        // Core
        gfx.fillStyle(core, 0.95); gfx.fillRect(-2, -60, 4, 60);
        // Bright center
        gfx.fillStyle(0xffffff, 0.7); gfx.fillRect(-1, -60, 2, 60);
        // Hilt
        gfx.fillStyle(0x888888, 1); gfx.fillRect(-3, 0, 6, 18);
    }

    _updateSaberPositions() {
        if (!this.anakin.active || !this.vader.active) return;

        // Anakin's saber — right side of character
        const anakinFlip = this.anakin.flipX;
        this._anakinSaber.setPosition(
            this.anakin.x + (anakinFlip ? -24 : 24),
            this.anakin.y - 20
        );

        // Vader's saber — left side (Vader faces left by default)
        const vaderFlip = this.vader.flipX;
        this._vaderSaber.setPosition(
            this.vader.x + (vaderFlip ? 24 : -24),
            this.vader.y - 28
        );
    }

    // ─── HUD ─────────────────────────────────────────────────────────────────

    _buildHUD() {
        const depth = 50;
        const { width } = this.scale;

        // Anakin health
        this.add.text(16, 16, 'ANAKIN', {
            fontSize: '12px', fill: '#44aaff', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 2
        }).setScrollFactor(0).setDepth(depth);

        this.add.rectangle(16, 34, 154, 14, 0x222222).setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth);
        this.anakinBar = this.add.rectangle(16, 34, 150, 10, 0x00cc44).setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth);

        this.anakinHpText = this.add.text(174, 28, '100', {
            fontSize: '11px', fill: '#aaffaa', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setScrollFactor(0).setDepth(depth);

        // Vader hearts
        this.add.text(width - 16, 16, 'VADER', {
            fontSize: '12px', fill: '#cc4444', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 2
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(depth);

        this._vaderHearts = [];
        for (let i = 0; i < VADER_HP_MAX; i++) {
            const heart = this.add.text(width - 22 - i * 28, 34, '❤', {
                fontSize: '18px'
            }).setScrollFactor(0).setDepth(depth).setOrigin(0.5);
            this._vaderHearts.push(heart);
        }

        // Controls hint
        this.add.text(16, this.scale.height - 12, 'ARROWS/WASD: Move  UP/W: Jump  SPACE/Z: Attack', {
            fontSize: '10px', fill: '#555566', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2
        }).setScrollFactor(0).setDepth(depth).setOrigin(0, 1);
    }

    _buildControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({ up: 'W', left: 'A', right: 'D', down: 'S' });
        this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.zKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    }

    // ─── Opening dialogue ────────────────────────────────────────────────────

    _showNextStartDialogue() {
        if (this._dialogueIndex >= this._dialogueQueue.length) {
            this._inputBlocked = false;
            return;
        }
        const line = this._dialogueQueue[this._dialogueIndex++];
        this._showDialogue(line.speaker, line.text, () => this._showNextStartDialogue());
    }

    // ─── Combat ──────────────────────────────────────────────────────────────

    _tryAttack() {
        const now = this.time.now;
        if (now - this.lastAttackTime < ATTACK_COOLDOWN) return;
        this.lastAttackTime = now;

        // Show attack texture briefly
        this.anakin.setTexture('anakin_attack');
        this.time.delayedCall(250, () => {
            if (this.anakin.active) this.anakin.setTexture('anakin_body');
        });

        // Check range
        const dist = Math.abs(this.anakin.x - this.vader.x);
        if (dist <= ATTACK_RANGE) {
            this._hitVader();
        }
    }

    _hitVader() {
        if (this.vaderInvincible || this.duelOver) return;
        this.vaderInvincible = true;
        this.vaderHP--;
        this.score += 500;

        // Flash
        this.vader.setTexture('vader_hit');
        this.vader.setTint(0xff4444);
        this.time.delayedCall(VADER_INVINCIBLE_TIME, () => {
            if (this.vader.active) {
                this.vader.clearTint();
                this.vader.setTexture('vader_body');
            }
            this.vaderInvincible = false;
        });

        // HIT! popup
        const hitX = (this.anakin.x + this.vader.x) / 2;
        const hitY = this.vader.y - 60;
        const hitText = this.add.text(hitX, hitY, 'HIT!', {
            fontSize: '22px', fill: '#ffff00', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(60);
        this.tweens.add({
            targets: hitText, y: hitY - 30, alpha: 0, duration: 800,
            onComplete: () => hitText.destroy()
        });

        // Update hearts
        const heartIndex = VADER_HP_MAX - this.vaderHP;
        if (heartIndex < this._vaderHearts.length) {
            this._vaderHearts[heartIndex].setAlpha(0.2).setTint(0x444444);
        }

        // Hit dialogue
        if (this.vaderHP === VADER_HP_MAX - 1 && !this._hitDisplayed[0]) {
            this._hitDisplayed[0] = true;
            this._inputBlocked = true;
            const line = SW_DIALOGUE.duel.vader_hit_1[0];
            this._showDialogue(line.speaker, line.text, () => { this._inputBlocked = false; });
        } else if (this.vaderHP === 1 && !this._hitDisplayed[1]) {
            this._hitDisplayed[1] = true;
            this._inputBlocked = true;
            const line = SW_DIALOGUE.duel.vader_hit_2[0];
            this._showDialogue(line.speaker, line.text, () => { this._inputBlocked = false; });
        }

        if (this.vaderHP <= 0) {
            this._vaderDefeated();
        }
    }

    _vaderAttackAnakin() {
        if (this.duelOver || !this.isAlive) return;
        const dist = Math.abs(this.anakin.x - this.vader.x);
        if (dist > 150) return;

        // Vader attack pose
        this.vader.setTexture('vader_attack');
        this.time.delayedCall(300, () => {
            if (this.vader.active) this.vader.setTexture('vader_body');
        });

        this.anakinHP -= 25;
        if (this.anakinHP < 0) this.anakinHP = 0;
        this._updateHUD();

        if (this.anakinHP <= 0) {
            this._anakinDie();
        }
    }

    _updateHUD() {
        const pct = this.anakinHP / ANAKIN_HP_MAX;
        this.anakinBar.width = 150 * pct;
        if (pct > 0.5) {
            this.anakinBar.setFillStyle(0x00cc44);
        } else if (pct > 0.25) {
            this.anakinBar.setFillStyle(0xffcc00);
        } else {
            this.anakinBar.setFillStyle(0xcc2222);
        }
        this.anakinHpText.setText(String(Math.max(0, Math.round(this.anakinHP))));
    }

    _anakinDie() {
        this.isAlive = false;
        this.anakin.setTint(0xff0000);
        this.time.delayedCall(1500, () => {
            this.scene.restart({ score: this.score });
        });
    }

    _vaderDefeated() {
        this.duelOver = true;

        // Stop Vader
        this.vader.setVelocity(0, 0);

        // Defeated tween
        this.tweens.add({
            targets: this.vader,
            alpha: 0.3,
            y: this.vader.y + 30,
            duration: 1500,
            ease: 'Sine.easeIn'
        });

        this._anakinSaber.setVisible(false);
        this._vaderSaber.setVisible(false);

        // Show defeat dialogue then victory
        const defeatLines = SW_DIALOGUE.duel.vader_defeat.slice();
        let di = 0;
        const showNext = () => {
            if (di >= defeatLines.length) {
                this._showVictory();
                return;
            }
            const line = defeatLines[di++];
            this._showDialogue(line.speaker, line.text, showNext);
        };
        this._inputBlocked = true;
        showNext();
    }

    _showVictory() {
        const { width, height } = this.scale;
        this.add.text(width / 2, height / 2 - 40, 'VADER DEFEATED', {
            fontSize: '36px', fill: '#ffe81f', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(70);

        this.time.delayedCall(2500, () => {
            this.cameras.main.fadeOut(700, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('EndingCutsceneScene', { score: this.score });
            });
        });
    }

    // ─── Dialogue helper ─────────────────────────────────────────────────────

    _showDialogue(speaker, text, onDone) {
        const { width, height } = this.scale;

        if (this._dialogueObjects) {
            this._dialogueObjects.forEach(o => { if (o && o.destroy) o.destroy(); });
        }
        this._dialogueObjects = [];
        this._dialogueLocked = true;
        this._dialogueDoneCb = onDone;

        this.input.keyboard.off('keydown', this._dialogueAdvance, this);
        this.input.off('pointerdown', this._dialogueAdvance, this);

        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5).setDepth(65);
        this._dialogueObjects.push(overlay);

        const cardW = 560;
        const cardH = 145;
        const cardX = width / 2 - cardW / 2;
        const cardY = height / 2 - cardH / 2 + 40;

        const card = this.add.graphics().setDepth(66);
        card.fillStyle(0x060610, 0.94);
        card.fillRoundedRect(cardX, cardY, cardW, cardH, 10);
        card.lineStyle(2, 0x334466, 1);
        card.strokeRoundedRect(cardX, cardY, cardW, cardH, 10);
        this._dialogueObjects.push(card);

        const speakerColors = {
            VADER: '#cc4444', ANAKIN: '#44aaff', PADME: '#ffaad4', NARRATOR: '#aaaaaa'
        };
        const speakerColor = speakerColors[speaker.toUpperCase()] || '#ffffff';

        const speakerTxt = this.add.text(width / 2, cardY + 16, speaker, {
            fontSize: '13px', fill: speakerColor, fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(67);
        this._dialogueObjects.push(speakerTxt);

        const bodyTxt = this.add.text(width / 2, cardY + 40, text, {
            fontSize: '13px', fill: '#ddddee', fontFamily: 'Georgia, serif',
            fontStyle: 'italic', align: 'center',
            wordWrap: { width: cardW - 40 }, stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5, 0).setDepth(67);
        this._dialogueObjects.push(bodyTxt);

        const promptTxt = this.add.text(width / 2, cardY + cardH - 16, '[ press any key ]', {
            fontSize: '9px', fill: '#555566', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(67).setAlpha(0);
        this._dialogueObjects.push(promptTxt);

        this.time.delayedCall(500, () => {
            this.tweens.add({
                targets: promptTxt, alpha: 1, duration: 300,
                onComplete: () => {
                    this.tweens.add({ targets: promptTxt, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
                }
            });
            this._dialogueLocked = false;
            this.input.keyboard.on('keydown', this._dialogueAdvance, this);
            this.input.on('pointerdown', this._dialogueAdvance, this);
        });

        if (this._dialogueAutoTimer) this._dialogueAutoTimer.remove(false);
        this._dialogueAutoTimer = this.time.delayedCall(4000, () => {
            if (!this._dialogueLocked) this._dialogueAdvance();
        });
    }

    _dialogueAdvance() {
        if (this._dialogueLocked) return;
        this._dialogueLocked = true;
        this.input.keyboard.off('keydown', this._dialogueAdvance, this);
        this.input.off('pointerdown', this._dialogueAdvance, this);
        if (this._dialogueAutoTimer) this._dialogueAutoTimer.remove(false);

        if (this._dialogueObjects) {
            this._dialogueObjects.forEach(o => { if (o && o.destroy) o.destroy(); });
            this._dialogueObjects = [];
        }

        if (this._dialogueDoneCb) {
            const cb = this._dialogueDoneCb;
            this._dialogueDoneCb = null;
            cb();
        }
    }

    // ─── Update loop ─────────────────────────────────────────────────────────

    update(time, delta) {
        if (!this.isAlive || this.duelOver || this._inputBlocked) {
            // Still update saber positions even when blocked
            this._updateSaberPositions();
            return;
        }

        const { height } = this.scale;
        const floorY = height - 60;

        // ── Anakin movement ──
        const speed = 200;
        let vx = 0;
        if (this.cursors.left.isDown  || this.wasd.left.isDown)  { vx = -speed; this.anakin.setFlipX(true); }
        if (this.cursors.right.isDown || this.wasd.right.isDown) { vx =  speed; this.anakin.setFlipX(false); }
        this.anakin.setVelocityX(vx);

        const onGround = this.anakin.body.blocked.down;
        if ((this.cursors.up.isDown || this.wasd.up.isDown) && onGround) {
            this.anakin.setVelocityY(-520);
        }

        if (Phaser.Input.Keyboard.JustDown(this.attackKey) || Phaser.Input.Keyboard.JustDown(this.zKey)) {
            this._tryAttack();
        }

        // ── Vader AI ──
        this.vaderAttackTimer += delta;
        if (this.vaderAttackTimer >= VADER_ATTACK_INTERVAL) {
            this.vaderAttackTimer = 0;
            this._vaderAttackAnakin();
        }

        // Vader walks toward Anakin
        if (!this.vaderInvincible) {
            const dx = this.anakin.x - this.vader.x;
            const vaderSpeed = 70;
            if (Math.abs(dx) > 80) {
                this.vader.setVelocityX(dx > 0 ? vaderSpeed : -vaderSpeed);
                this.vader.setFlipX(dx > 0);
            } else {
                this.vader.setVelocityX(0);
            }
        }

        this._updateSaberPositions();
    }
}
