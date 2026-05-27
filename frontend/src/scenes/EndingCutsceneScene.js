// EndingCutsceneScene — order: closing text → ending video → game-over screen.

export default class EndingCutsceneScene extends Phaser.Scene {
    constructor() {
        super('EndingCutsceneScene');
    }

    init(data) {
        this.score = data.score || 0;
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');
        this._showClosingText();
    }

    // ── 1. Closing text ───────────────────────────────────────────────────────

    _showClosingText() {
        const { width, height } = this.scale;

        this.cameras.main.fadeIn(900, 0, 0, 0);

        for (let i = 0; i < 80; i++) {
            this.add.rectangle(
                Phaser.Math.Between(0, width), Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 3), Phaser.Math.Between(1, 3), 0xffffff
            ).setAlpha(Phaser.Math.FloatBetween(0.1, 0.6));
        }

        const line1 = this.add.text(width / 2, height / 2 - 50,
            'K-padme has been successfully captured by O-vader.', {
                fontSize: '17px', fill: '#ddddcc', fontFamily: 'Georgia, serif',
                fontStyle: 'italic', stroke: '#000000', strokeThickness: 3,
                align: 'center', wordWrap: { width: 680 }
            }).setOrigin(0.5).setAlpha(0);

        const line2 = this.add.text(width / 2, height / 2 + 20,
            'And now his final act of revenge...\nturning his princess to the dark side.', {
                fontSize: '17px', fill: '#cc3333', fontFamily: 'Georgia, serif',
                fontStyle: 'italic', stroke: '#000000', strokeThickness: 3,
                align: 'center', wordWrap: { width: 680 }
            }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({ targets: line1, alpha: 1, duration: 1000, delay: 600 });
        this.tweens.add({
            targets: line2, alpha: 1, duration: 1000, delay: 1800,
            onComplete: () => {
                // Hold for 2.4 s, then move to the video (or skip to game over)
                this.time.delayedCall(2400, () => this._transitionToVideo());
            }
        });
    }

    // ── 2. Ending video ───────────────────────────────────────────────────────

    _transitionToVideo() {
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            [...this.children.list].forEach(c => c.destroy());
            this.cameras.main.setBackgroundColor('#000000');

            if (this.cache.video.has('ending_video')) {
                this._playVideo();
            } else {
                this._showGameOver();
            }
        });
    }

    _playVideo() {
        const { width, height } = this.scale;

        this.cameras.main.fadeIn(400, 0, 0, 0);

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000).setDepth(0);

        const video = this.add.video(width / 2, height / 2, 'ending_video');
        video.setMute(false);
        video.play(false);

        const sizeVideo = () => {
            const el = video.video;
            const vw = (el && el.videoWidth)  || 0;
            const vh = (el && el.videoHeight) || 0;
            if (vw && vh) {
                video.setScale(Math.min(width / vw, height / vh));
            }
        };
        sizeVideo();
        if (video.video) {
            video.video.addEventListener('canplay', sizeVideo, { once: true });
        }

        video.on('complete', () => this._showGameOver());

        const skip = () => { video.stop(); this._showGameOver(); };
        this.input.keyboard.once('keydown-SPACE', skip);
        this.input.once('pointerdown', skip);

        this.add.text(width - 16, height - 14, 'SPACE / click to skip', {
            fontSize: '10px', fill: '#444455', fontFamily: 'monospace'
        }).setOrigin(1, 1).setDepth(10);
    }

    // ── 3. Game-over screen ───────────────────────────────────────────────────

    _showGameOver() {
        const { width, height } = this.scale;

        this.cameras.main.fadeOut(700, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            [...this.children.list].forEach(c => c.destroy());

            this.cameras.main.setBackgroundColor('#000000');
            this.cameras.main.fadeIn(700, 0, 0, 0);

            for (let i = 0; i < 80; i++) {
                this.add.rectangle(
                    Phaser.Math.Between(0, width), Phaser.Math.Between(0, height),
                    Phaser.Math.Between(1, 3), Phaser.Math.Between(1, 3), 0xffffff
                ).setAlpha(Phaser.Math.FloatBetween(0.2, 0.8));
            }

            const title = this.add.text(width / 2, height / 2 - 80, 'GAME OVER', {
                fontSize: '52px', fill: '#cc1111', fontFamily: 'monospace',
                fontStyle: 'bold', stroke: '#000000', strokeThickness: 7
            }).setOrigin(0.5).setAlpha(0);
            this.tweens.add({ targets: title, alpha: 1, duration: 900, delay: 200 });

            const scoreText = this.add.text(width / 2, height / 2 + 10, `FINAL SCORE: ${this.score}`, {
                fontSize: '24px', fill: '#ffffff', fontFamily: 'monospace',
                stroke: '#000000', strokeThickness: 4
            }).setOrigin(0.5).setAlpha(0);
            this.tweens.add({ targets: scoreText, alpha: 1, duration: 800, delay: 700 });

            const prompt = this.add.text(width / 2, height / 2 + 90, '[ PRESS ENTER TO PLAY AGAIN ]', {
                fontSize: '15px', fill: '#2ecc71', fontFamily: 'monospace',
                stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5).setAlpha(0);

            this.tweens.add({
                targets: prompt, alpha: 1, duration: 600, delay: 1400,
                onComplete: () => {
                    this.tweens.add({ targets: prompt, alpha: 0.15, duration: 600, yoyo: true, repeat: -1 });
                    this.input.keyboard.once('keydown-ENTER', () => {
                        this.cameras.main.fadeOut(500, 0, 0, 0);
                        this.cameras.main.once('camerafadeoutcomplete', () => {
                            this.scene.start('MenuScene');
                        });
                    });
                }
            });
        });
    }
}
