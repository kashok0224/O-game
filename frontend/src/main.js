import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import DedicationScene from './scenes/DedicationScene.js';
import MenuScene from './scenes/MenuScene.js';
import Level1Scene from './scenes/Level1Scene.js';
import Level2Scene from './scenes/Level2Scene.js';
import Level3Scene from './scenes/Level3Scene.js';
import Level4Scene from './scenes/Level4Scene.js';
import EndScene from './scenes/EndScene.js';
import OpeningCutsceneScene from './scenes/OpeningCutsceneScene.js';
import SpaceChaseScene from './scenes/SpaceChaseScene.js';
import TractorBeamScene from './scenes/TractorBeamScene.js';
import DuelScene from './scenes/DuelScene.js';
import EndingCutsceneScene from './scenes/EndingCutsceneScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 500,
    backgroundColor: '#1a1a2e',
    autoFocus: true,
    input: {
        keyboard: {
            capture: [32, 37, 38, 39, 40] // Space + arrows — prevent browser scroll hijack
        }
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },
    scene: [BootScene, DedicationScene, MenuScene, Level1Scene, Level2Scene, Level3Scene, Level4Scene, EndScene, OpeningCutsceneScene, SpaceChaseScene, TractorBeamScene, DuelScene, EndingCutsceneScene]
};

new Phaser.Game(config);
