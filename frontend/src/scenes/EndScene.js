import { END_SCREEN, FRIEND_NAME } from '../gameConfig.js';

// Shown after completing all 4 levels. A personal closing message.

export default class EndScene extends Phaser.Scene {
    constructor() {
        super('EndScene');
    }

    init(data) {
        this.finalScore = data.score || 0;
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;
        const cy = height / 2;

        this.cameras.main.setBackgroundColor('#000008');
        this.cameras.main.fadeIn(800, 0, 0, 0);

        // Subtle starfield
        for (let i = 0; i < 60; i++) {
            this.add.rectangle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 2),
                Phaser.Math.Between(1, 2),
                0xffffff,
                Phaser.Math.FloatBetween(0.1, 0.5)
            );
        }

        // "You did it." title
        this.add.text(cx, cy - 140, END_SCREEN.title, {
            fontSize: '36px', fill: '#ffffff', fontFamily: 'monospace',
            fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setAlpha(0);

        // Personal message lines
        END_SCREEN.lines.forEach((line, i) => {
            this.add.text(cx, cy - 60 + i * 40, line, {
                fontSize: '15px', fill: '#aaaacc', fontFamily: 'monospace',
                wordWrap: { width: 600 }, align: 'center',
                stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5).setAlpha(0);
        });

        // Score
        this.add.text(cx, cy + 90, `final score: ${this.finalScore}`, {
            fontSize: '14px', fill: '#555566', fontFamily: 'monospace'
        }).setOrigin(0.5).setAlpha(0);

        // Replay prompt
        const replay = this.add.text(cx, cy + 140, 'press ENTER to play again', {
            fontSize: '12px', fill: '#334455', fontFamily: 'monospace'
        }).setOrigin(0.5).setAlpha(0);

        // Fade everything in sequentially
        this.children.list
            .filter(obj => obj.alpha === 0)
            .forEach((obj, i) => {
                this.tweens.add({
                    targets: obj, alpha: 1,
                    duration: 700,
                    delay: 400 + i * 500,
                    ease: 'Sine.easeIn'
                });
            });

        // Blink the replay prompt after everything has faded in
        const allDelay = 400 + this.children.list.filter(o => o.alpha === 0).length * 500 + 400;
        this.time.delayedCall(allDelay, () => {
            this.tweens.add({ targets: replay, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });
            this.input.keyboard.once('keydown-ENTER', () => {
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
            });
        });
    }
}
