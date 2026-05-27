// Places a hidden easter egg zone in a level.
// A subtle sparkle marks the spot; walking into it shows a personal message popup.

export function addEasterEgg(scene, worldX, worldY, message) {
    // Subtle pulsing sparkle in world space
    const sparkle = scene.add.text(worldX, worldY - 30, '✨', { fontSize: '10px' })
        .setOrigin(0.5).setAlpha(0.4);
    scene.tweens.add({ targets: sparkle, alpha: 0.1, duration: 1200, yoyo: true, repeat: -1 });

    // Physics trigger zone
    const zone = scene.add.zone(worldX, worldY, 64, 80);
    scene.physics.world.enable(zone);
    zone.body.setAllowGravity(false);

    let triggered = false;

    scene.physics.add.overlap(scene.player, zone, () => {
        if (triggered) return;
        triggered = true;
        sparkle.destroy();

        _showPopup(scene, message);
    });
}

function _showPopup(scene, message) {
    const { width, height } = scene.scale;
    const cx = width / 2;
    const cy = height / 2;

    const group = [];
    const add = (obj) => { group.push(obj); return obj; };

    // Backdrop
    add(scene.add.rectangle(cx, cy, width, height, 0x000000, 0.6)
        .setScrollFactor(0).setDepth(90));

    // Message card
    add(scene.add.rectangle(cx, cy, 460, 160, 0x0a0a18, 0.96)
        .setScrollFactor(0).setDepth(91));
    add(scene.add.rectangle(cx, cy, 462, 162, 0x000000, 0)
        .setStrokeStyle(1, 0x556655)
        .setScrollFactor(0).setDepth(91));

    // "You found something..." label
    add(scene.add.text(cx, cy - 52, '✨  you found something  ✨', {
        fontSize: '10px', fill: '#557755', fontFamily: 'monospace', letterSpacing: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(92));

    // The message itself
    add(scene.add.text(cx, cy + 2, message, {
        fontSize: '14px', fill: '#ccddcc', fontFamily: 'monospace',
        wordWrap: { width: 400 }, align: 'center',
        stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(92));

    // Dismiss hint
    const hint = add(scene.add.text(cx, cy + 60, 'press any key', {
        fontSize: '9px', fill: '#334433', fontFamily: 'monospace'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(92));
    scene.tweens.add({ targets: hint, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });

    // Fade in the group
    group.forEach(obj => { obj.setAlpha(0); scene.tweens.add({ targets: obj, alpha: obj === group[0] ? 0.6 : 1, duration: 400 }); });

    const dismiss = () => {
        group.forEach(obj => scene.tweens.add({
            targets: obj, alpha: 0, duration: 300,
            onComplete: () => { if (obj.active) obj.destroy(); }
        }));
    };

    const autoTimer = scene.time.delayedCall(5000, dismiss);
    scene.time.delayedCall(500, () => {
        scene.input.keyboard.once('keydown', () => { autoTimer.remove(); dismiss(); });
    });
}
