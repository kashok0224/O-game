import { DEDICATION_LINES } from '../gameConfig.js';

// Shown once before the main menu — a personal dedication to the recipient.
// Lines fade in one by one, then the player can continue.

export default class DedicationScene extends Phaser.Scene {
    constructor() {
        super('DedicationScene');
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;
        const cy = height / 2;

        this.cameras.main.setBackgroundColor('#000000');

        const lineSpacing = 38;
        const startY = cy - ((DEDICATION_LINES.length - 1) * lineSpacing) / 2;

        // Fade in each line with a staggered delay
        const texts = DEDICATION_LINES.map((line, i) => {
            return this.add.text(cx, startY + i * lineSpacing, line, {
                fontSize: i === 0 ? '28px' : '16px',
                fill: i === 0 ? '#ffffff' : '#888899',
                fontFamily: 'monospace',
                fontStyle: i === 0 ? 'bold' : 'normal',
                stroke: '#000000',
                strokeThickness: 2,
            }).setOrigin(0.5).setAlpha(0);
        });

        // Stagger each line's fade-in
        texts.forEach((t, i) => {
            this.tweens.add({
                targets: t,
                alpha: 1,
                duration: 800,
                delay: 600 + i * 800,
                ease: 'Sine.easeIn'
            });
        });

        // "Press any key" prompt — appears after all lines are visible
        const totalDelay = 600 + DEDICATION_LINES.length * 800 + 400;
        const prompt = this.add.text(cx, cy + 120, 'press any key to begin', {
            fontSize: '11px', fill: '#444455', fontFamily: 'monospace'
        }).setOrigin(0.5).setAlpha(0);

        this.time.delayedCall(totalDelay, () => {
            this.tweens.add({ targets: prompt, alpha: 1, duration: 600 });
            this.tweens.add({ targets: prompt, alpha: 0.2, duration: 700, yoyo: true, repeat: -1, delay: 600 });

            // Accept input after prompt appears
            this.input.keyboard.once('keydown', () => this._advance());
            this.time.delayedCall(6000, () => this._advance());
        });
    }

    _advance() {
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
    }
}
