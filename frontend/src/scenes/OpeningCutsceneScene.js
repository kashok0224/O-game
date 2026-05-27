// OpeningCutsceneScene — plays O-game-beginning-scene.mp4 (letterboxed, with audio),
// then shows the story slide, then launches SpaceChaseScene.

export default class OpeningCutsceneScene extends Phaser.Scene {
    constructor() {
        super('OpeningCutsceneScene');
    }

    create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor('#000000');

        if (this.cache.video.has('intro_video')) {
            this._playVideo(width, height, () => this._showStorySlide());
        } else {
            this._showStorySlide();
        }
    }

    _playVideo(width, height, onDone) {
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000).setDepth(0);

        const video = this.add.video(width / 2, height / 2, 'intro_video');
        video.setMute(false);
        video.play(false);

        // Size the video to fit the canvas while keeping its native aspect ratio.
        // Called immediately in case dimensions are already cached, then again on
        // 'canplay' as a reliable fallback (fires before the first frame renders).
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

        video.on('complete', onDone);

        const skip = () => { video.stop(); onDone(); };
        this.input.keyboard.once('keydown-SPACE', skip);
        this.input.once('pointerdown', skip);

        this.add.text(width - 16, height - 14, 'SPACE / click to skip', {
            fontSize: '10px', fill: '#444455', fontFamily: 'monospace'
        }).setOrigin(1, 1).setDepth(10);
    }

    _showStorySlide() {
        const { width, height } = this.scale;

        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            [...this.children.list].forEach(c => c.destroy());

            this.cameras.main.setBackgroundColor('#000000');
            this.cameras.main.fadeIn(800, 0, 0, 0);

            for (let i = 0; i < 70; i++) {
                this.add.rectangle(
                    Phaser.Math.Between(0, width), Phaser.Math.Between(0, height),
                    Phaser.Math.Between(1, 3), Phaser.Math.Between(1, 3), 0xffffff
                ).setAlpha(Phaser.Math.FloatBetween(0.1, 0.5));
            }

            const line1 = this.add.text(width / 2, height / 2 - 48,
                'O-vader has successfully captured the galaxy.', {
                    fontSize: '18px', fill: '#ddddcc', fontFamily: 'Georgia, serif',
                    fontStyle: 'italic', stroke: '#000000', strokeThickness: 3,
                    align: 'center', wordWrap: { width: 680 }
                }).setOrigin(0.5).setAlpha(0);

            const line2 = this.add.text(width / 2, height / 2 + 8,
                'Now everything is under his reign.', {
                    fontSize: '18px', fill: '#ddddcc', fontFamily: 'Georgia, serif',
                    fontStyle: 'italic', stroke: '#000000', strokeThickness: 3,
                    align: 'center'
                }).setOrigin(0.5).setAlpha(0);

            const line3 = this.add.text(width / 2, height / 2 + 64,
                'Except K-padme...', {
                    fontSize: '22px', fill: '#cc3333', fontFamily: 'Georgia, serif',
                    fontStyle: 'italic', stroke: '#000000', strokeThickness: 4,
                    align: 'center'
                }).setOrigin(0.5).setAlpha(0);

            this.tweens.add({ targets: line1, alpha: 1, duration: 900, delay: 400 });
            this.tweens.add({ targets: line2, alpha: 1, duration: 900, delay: 1300 });
            this.tweens.add({
                targets: line3, alpha: 1, duration: 900, delay: 2300,
                onComplete: () => {
                    const prompt = this.add.text(width / 2, height - 40, 'press any key to continue', {
                        fontSize: '11px', fill: '#444455', fontFamily: 'monospace'
                    }).setOrigin(0.5).setAlpha(0);

                    this.tweens.add({
                        targets: prompt, alpha: 1, duration: 500,
                        onComplete: () => {
                            this.tweens.add({ targets: prompt, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });
                        }
                    });

                    const advance = () => {
                        this.input.keyboard.off('keydown', advance);
                        this.input.off('pointerdown', advance);
                        this.cameras.main.fadeOut(600, 0, 0, 0);
                        this.cameras.main.once('camerafadeoutcomplete', () => {
                            this.scene.start('SpaceChaseScene', { score: 0 });
                        });
                    };

                    this.input.keyboard.once('keydown', advance);
                    this.input.once('pointerdown', advance);
                    this.time.delayedCall(6000, advance);
                }
            });
        });
    }
}
