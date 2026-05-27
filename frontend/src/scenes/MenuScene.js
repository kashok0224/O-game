export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor('#000000');

        // Star field background
        for (let i = 0; i < 120; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.Between(1, 3);
            this.add.rectangle(x, y, size, size, 0xffffff).setAlpha(Phaser.Math.FloatBetween(0.3, 1.0));
        }

        // Title
        this.add.text(width / 2, height / 2 - 90, "O-VADER'S REVENGE", {
            fontSize: '36px',
            fill: '#ffe81f',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height / 2 - 40, 'A Star Wars Story', {
            fontSize: '16px',
            fill: '#aaaadd',
            fontFamily: 'monospace',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Decorative divider
        this.add.text(width / 2, height / 2, '— — — — — — — — —', {
            fontSize: '12px',
            fill: '#555566',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        const startText = this.add.text(width / 2, height / 2 + 60, '[ PRESS ENTER TO START ]', {
            fontSize: '16px',
            fill: '#2ecc71',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Blink the start prompt
        this.tweens.add({
            targets: startText,
            alpha: 0,
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        this.input.keyboard.once('keydown-ENTER', () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('OpeningCutsceneScene');
            });
        });
    }
}
