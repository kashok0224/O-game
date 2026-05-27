// Reusable level intro overlay.
// Call at the end of a scene's create(). Sets scene.introActive = true while visible.

export function showLevelIntro(scene, config) {
    scene.introActive = true;

    const { width, height } = scene.scale;
    const cx = width / 2;
    const cy = height / 2;

    const group = [];

    const add = (obj) => { group.push(obj); return obj; };

    // Full-screen dark overlay
    add(scene.add.rectangle(cx, cy, width, height, 0x000000, 0.78)
        .setScrollFactor(0).setDepth(100));

    // Card background
    add(scene.add.rectangle(cx, cy, 520, 210, 0x0d0d1a, 0.97)
        .setScrollFactor(0).setDepth(101));

    // Card border
    add(scene.add.rectangle(cx, cy, 522, 212, 0x000000, 0)
        .setStrokeStyle(1, 0x444466)
        .setScrollFactor(0).setDepth(101));

    // World label (e.g. "World 1-1")
    add(scene.add.text(cx, cy - 74, config.world.toUpperCase(), {
        fontSize: '11px', fill: '#666688', fontFamily: 'monospace', letterSpacing: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102));

    // Level title
    add(scene.add.text(cx, cy - 44, config.title, {
        fontSize: '28px', fill: '#ffffff', fontFamily: 'monospace',
        fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102));

    // Thin divider
    add(scene.add.rectangle(cx, cy - 8, 320, 1, 0x333355)
        .setScrollFactor(0).setDepth(102));

    // Personal message
    add(scene.add.text(cx, cy + 22, config.message, {
        fontSize: '13px', fill: '#9999bb', fontFamily: 'monospace',
        wordWrap: { width: 460 }, align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102));

    // "Press any key" prompt
    const prompt = add(scene.add.text(cx, cy + 82, 'press any key to continue', {
        fontSize: '10px', fill: '#444466', fontFamily: 'monospace'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102));

    scene.tweens.add({ targets: prompt, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });

    const dismiss = () => {
        group.forEach(obj => {
            scene.tweens.add({
                targets: obj, alpha: 0, duration: 350,
                onComplete: () => { if (obj.active) obj.destroy(); }
            });
        });
        scene.introActive = false;
    };

    // Auto-dismiss after 3.5s; also allow any key after a short grace period
    const autoTimer = scene.time.delayedCall(3500, dismiss);

    scene.time.delayedCall(600, () => {
        scene.input.keyboard.once('keydown', () => {
            autoTimer.remove();
            dismiss();
        });
    });
}
