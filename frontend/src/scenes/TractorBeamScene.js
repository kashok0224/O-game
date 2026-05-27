import { SW_DIALOGUE } from '../gameConfig.js';

// TractorBeamScene — short cinematic after SpaceChase, before Duel.
// Anakin's X-wing is caught by a tractor beam and pulled into Vader's ship.

export default class TractorBeamScene extends Phaser.Scene {
    constructor() {
        super('TractorBeamScene');
    }

    init(data) {
        this.score = data.score || 0;
    }

    create() {
        this.introActive = false;

        const { width, height } = this.scale;

        // Background
        if (this.textures.exists('bg_starwars')) {
            this.add.image(width / 2, height / 2, 'bg_starwars').setDepth(-2);
        } else {
            this.cameras.main.setBackgroundColor('#000011');
        }

        // Starfield overlay
        for (let i = 0; i < 80; i++) {
            this.add.rectangle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 2), Phaser.Math.Between(1, 2),
                0xffffff
            ).setAlpha(Phaser.Math.FloatBetween(0.2, 0.8)).setDepth(-1);
        }

        // Dark overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.45).setDepth(-1);

        this._dialogueQueue = SW_DIALOGUE.tractor.slice();
        this._dialogueIndex = 0;
        this._scenePhase = 0;

        // Draw ships
        this._xwing = this._drawXwing(160, 300);
        this._vaderShipGfx = null;
        this._beamGfx = this.add.graphics().setDepth(5);

        // Screen-space camera starts faded in
        this.cameras.main.fadeIn(600, 0, 0, 0);

        // Sequence: 1) show X-wing flying, 2) vader ship appears, 3) beam, 4) pull, 5) dialogue
        this.time.delayedCall(800, () => this._phase1());
    }

    // ─── Animation phases ────────────────────────────────────────────────────

    _phase1() {
        // X-wing slowly flies right
        this.tweens.add({
            targets: this._xwing,
            x: 250,
            duration: 1500,
            ease: 'Linear',
            onComplete: () => this._phase2()
        });
    }

    _phase2() {
        const { width } = this.scale;

        // Vader's ship silhouette appears from top-right
        const g = this.add.graphics().setDepth(4);
        this._vaderShipGfx = g;

        // Large dark triangle entering from top-right corner
        const cx = width - 80;
        const cy = 80;
        g.fillStyle(0x0d0d18, 1);
        g.fillTriangle(cx - 200, cy - 60, cx + 60, cy + 40, cx - 200, cy + 140);
        // Engine glow
        g.fillStyle(0x2244cc, 0.7);
        for (let i = 0; i < 4; i++) {
            g.fillCircle(cx - 205, cy - 40 + i * 28, 7);
        }

        // Fade in
        g.setAlpha(0);
        this.tweens.add({
            targets: g,
            alpha: 1,
            duration: 900,
            onComplete: () => this._phase3()
        });
    }

    _phase3() {
        // Draw tractor beam — animated blue trapezoid growing from ship toward X-wing
        const { width } = this.scale;

        let beamWidth = 0;
        const maxBeamWidth = 340;

        this._beamTimer = this.time.addEvent({
            delay: 16,
            callback: () => {
                beamWidth = Math.min(maxBeamWidth, beamWidth + 8);
                this._beamGfx.clear();

                // Tractor beam as a blue gradient trapezoid
                this._beamGfx.fillStyle(0x3388ff, 0.18);
                this._beamGfx.fillTriangle(
                    width - 120, 90,
                    width - 120 - beamWidth, 280,
                    width - 120 - beamWidth, 320
                );
                this._beamGfx.fillStyle(0x55aaff, 0.25);
                this._beamGfx.fillTriangle(
                    width - 130, 100,
                    width - 130 - beamWidth, 290,
                    width - 130 - beamWidth, 310
                );
                // Bright center line
                this._beamGfx.lineStyle(2, 0x88ddff, 0.8);
                this._beamGfx.beginPath();
                this._beamGfx.moveTo(width - 125, 100);
                this._beamGfx.lineTo(width - 125 - beamWidth, 300);
                this._beamGfx.strokePath();

                if (beamWidth >= maxBeamWidth) {
                    this._beamTimer.remove(false);
                    this._phase4();
                }
            },
            loop: true
        });
    }

    _phase4() {
        const { width } = this.scale;

        // X-wing tweens toward the ship (upper-right) — getting pulled in
        this.tweens.add({
            targets: this._xwing,
            x: width - 180,
            y: 140,
            scaleX: 0.4,
            scaleY: 0.4,
            duration: 2200,
            ease: 'Sine.easeIn',
            onComplete: () => this._startDialogue()
        });
    }

    _startDialogue() {
        this._showNextDialogue();
    }

    _showNextDialogue() {
        if (this._dialogueIndex >= this._dialogueQueue.length) {
            this._endScene();
            return;
        }
        const line = this._dialogueQueue[this._dialogueIndex];
        this._dialogueIndex++;
        this._showDialogue(line.speaker, line.text, () => this._showNextDialogue());
    }

    _endScene() {
        this.cameras.main.fadeOut(900, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('DuelScene', { score: this.score });
        });
    }

    // ─── Draw X-wing with graphics ───────────────────────────────────────────

    _drawXwing(x, y) {
        const container = this.add.container(x, y).setDepth(8);

        if (this.textures.exists('sw_xwing')) {
            const img = this.add.image(0, 0, 'sw_xwing').setScale(0.85);
            container.add(img);
        } else {
            const g = this.add.graphics();
            g.fillStyle(0xcccccc); g.fillRect(-35, -10, 50, 20);
            g.fillStyle(0xaaaaaa); g.fillTriangle(15, -10, 15, 10, 40, 0);
            g.fillStyle(0xbbbbbb);
            g.fillTriangle(-35, -22, 15, -22, 15, -10);
            g.fillTriangle(-35, 22, 15, 22, 15, 10);
            g.fillStyle(0x4466ff); g.fillRect(-44, -8, 10, 6);
            g.fillRect(-44, 2, 10, 6);
            container.add(g);
        }

        return container;
    }

    // ─── Dialogue helper ─────────────────────────────────────────────────────

    _showDialogue(speaker, text, onDone) {
        const { width, height } = this.scale;

        // Clear previous dialogue
        if (this._dialogueObjects) {
            this._dialogueObjects.forEach(o => { if (o && o.destroy) o.destroy(); });
        }
        this._dialogueObjects = [];
        this._dialogueLocked = true;
        this._dialogueDoneCb = onDone;

        // Remove previous input listeners
        this.input.keyboard.off('keydown', this._dialogueAdvance, this);
        this.input.off('pointerdown', this._dialogueAdvance, this);

        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5).setDepth(20);
        this._dialogueObjects.push(overlay);

        const cardW = 580;
        const cardH = 150;
        const cardX = width / 2 - cardW / 2;
        const cardY = height / 2 - cardH / 2 + 70;

        const card = this.add.graphics().setDepth(21);
        card.fillStyle(0x080816, 0.93);
        card.fillRoundedRect(cardX, cardY, cardW, cardH, 10);
        card.lineStyle(2, 0x334466, 1);
        card.strokeRoundedRect(cardX, cardY, cardW, cardH, 10);
        this._dialogueObjects.push(card);

        const speakerColors = {
            VADER: '#cc4444', ANAKIN: '#44aaff', PADME: '#ffaad4', NARRATOR: '#aaaaaa'
        };
        const speakerColor = speakerColors[speaker.toUpperCase()] || '#ffffff';

        const speakerTxt = this.add.text(width / 2, cardY + 18, speaker, {
            fontSize: '13px', fill: speakerColor, fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(22);
        this._dialogueObjects.push(speakerTxt);

        const bodyTxt = this.add.text(width / 2, cardY + 44, text, {
            fontSize: '13px', fill: '#ddddee', fontFamily: 'Georgia, serif',
            fontStyle: 'italic', align: 'center',
            wordWrap: { width: cardW - 40 }, stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5, 0).setDepth(22);
        this._dialogueObjects.push(bodyTxt);

        const promptTxt = this.add.text(width / 2, cardY + cardH - 16, '[ press any key ]', {
            fontSize: '9px', fill: '#555566', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(22).setAlpha(0);
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

        // Auto-advance
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
}
