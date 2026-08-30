import * as Phaser from 'phaser';
import { DEV_MODE } from './devMode';
import type { CharacterId } from './gameData';

const HD_SCALE = 2;
const LOGICAL_WIDTH = 960;
const LOGICAL_HEIGHT = 540;
const PHYSICAL_WIDTH = LOGICAL_WIDTH * HD_SCALE;
const PHYSICAL_HEIGHT = LOGICAL_HEIGHT * HD_SCALE;
const ENERGY_FULL_WIDTH = 220 * HD_SCALE;
const ENERGY_FILL_HEIGHT = 16 * HD_SCALE;
const DPAD_CENTER_X = 112 * HD_SCALE;
const DPAD_CENTER_Y = (LOGICAL_HEIGHT - 108) * HD_SCALE;
const DPAD_SPACING = 56 * HD_SCALE;
const MAGIC_X = (LOGICAL_WIDTH - 105) * HD_SCALE;
const MAGIC_Y = (LOGICAL_HEIGHT - 105) * HD_SCALE;
const UI_DEPTH = 1200;

type TouchDirection = 'left' | 'right' | 'up' | 'down';

export interface PlayableUiController {
  touchDirections: Record<TouchDirection, boolean>;
  consumeShootRequest: () => boolean;
  updateEnergy: (energy: number) => void;
  updateCoins: (coins: number) => void;
  ignoreWorldObject: (object: Phaser.GameObjects.GameObject) => void;
}

export function preloadPlayableUiAssets(scene: Phaser.Scene): void {
  scene.load.image('playable-hudFrame', './assets/environment/hud-frame.png');
  scene.load.image('playable-energyFrame', './assets/environment/energy-bar-frame.png');
  scene.load.image('playable-energyGold', './assets/environment/energy-bar-fill-gold.png');
  scene.load.image('playable-energyRed', './assets/environment/energy-bar-fill-red.png');
  scene.load.image('playable-coin', './assets/environment/coin-gold-01.png');
  scene.load.image('playable-menu', './assets/environment/menu-icon-01.png');
  scene.load.image('playable-magicRayGold', './assets/effects/magic-ray-gold-01.png');
}

export function createPlayableUi(
  scene: Phaser.Scene,
  characterId: CharacterId,
  characterName: string,
  initialEnergy = 100,
  initialCoins = 0
): PlayableUiController {
  const touchDirections: Record<TouchDirection, boolean> = {
    left: false,
    right: false,
    up: false,
    down: false
  };
  let shootRequested = false;

  const uiObjects: Phaser.GameObjects.GameObject[] = [];
  const remember = <T extends Phaser.GameObjects.GameObject>(object: T): T => {
    uiObjects.push(object);
    return object;
  };

  remember(scene.add.image(PHYSICAL_WIDTH / 2, 45 * HD_SCALE, 'playable-hudFrame')
    .setDisplaySize((LOGICAL_WIDTH - 20) * HD_SCALE, 82 * HD_SCALE)
    .setScrollFactor(0)
    .setDepth(1000));

  remember(scene.add.text(185 * HD_SCALE, 44 * HD_SCALE, characterName, {
    fontFamily: 'Georgia, Times New Roman, serif',
    fontSize: `${19 * HD_SCALE}px`,
    color: '#2a1808',
    fontStyle: 'bold',
    stroke: '#f4e0a8',
    strokeThickness: 2 * HD_SCALE
  }).setOrigin(0.5).setScrollFactor(0).setDepth(1005));

  const energyGold = remember(scene.add.image(80 * HD_SCALE, 105 * HD_SCALE, 'playable-energyGold')
    .setOrigin(0, 0.5)
    .setDisplaySize(ENERGY_FULL_WIDTH, ENERGY_FILL_HEIGHT)
    .setScrollFactor(0)
    .setDepth(1003));
  const energyRed = remember(scene.add.image(80 * HD_SCALE, 105 * HD_SCALE, 'playable-energyRed')
    .setOrigin(0, 0.5)
    .setDisplaySize(ENERGY_FULL_WIDTH, ENERGY_FILL_HEIGHT)
    .setScrollFactor(0)
    .setDepth(1003));
  remember(scene.add.image(190 * HD_SCALE, 105 * HD_SCALE, 'playable-energyFrame')
    .setDisplaySize(264 * HD_SCALE, 34 * HD_SCALE)
    .setScrollFactor(0)
    .setDepth(1004));

  remember(scene.add.image((LOGICAL_WIDTH - 190) * HD_SCALE, 41 * HD_SCALE, 'playable-coin')
    .setDisplaySize(25 * HD_SCALE, 25 * HD_SCALE)
    .setScrollFactor(0)
    .setDepth(1004));
  const coinCounter = remember(scene.add.text((LOGICAL_WIDTH - 165) * HD_SCALE, 41 * HD_SCALE, String(initialCoins), {
    fontFamily: 'Arial',
    fontSize: `${20 * HD_SCALE}px`,
    color: '#2a1808',
    fontStyle: 'bold'
  }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1005));

  const menu = remember(scene.add.image((LOGICAL_WIDTH - 80) * HD_SCALE, 44 * HD_SCALE, 'playable-menu')
    .setDisplaySize(40 * HD_SCALE, 40 * HD_SCALE)
    .setScrollFactor(0)
    .setDepth(1005)
    .setInteractive({ useHandCursor: true }));

  menu.on('pointerover', () => menu.setDisplaySize(43 * HD_SCALE, 43 * HD_SCALE));
  menu.on('pointerout', () => menu.setDisplaySize(40 * HD_SCALE, 40 * HD_SCALE));
  menu.on('pointerdown', () => {
    if (!DEV_MODE) return;
    scene.scene.sleep();
    scene.scene.launch('DevMenuScene', {
      sourceSceneKey: scene.scene.key,
      characterId
    });
  });

  const directions: Array<{ direction: TouchDirection; label: string; x: number; y: number }> = [
    { direction: 'left', label: '◀', x: DPAD_CENTER_X - DPAD_SPACING, y: DPAD_CENTER_Y },
    { direction: 'right', label: '▶', x: DPAD_CENTER_X + DPAD_SPACING, y: DPAD_CENTER_Y },
    { direction: 'up', label: '▲', x: DPAD_CENTER_X, y: DPAD_CENTER_Y - DPAD_SPACING },
    { direction: 'down', label: '▼', x: DPAD_CENTER_X, y: DPAD_CENTER_Y + DPAD_SPACING }
  ];

  directions.forEach(({ label, x, y }) => {
    remember(scene.add.circle(x, y, 50, 0x171421, 0.68)
      .setStrokeStyle(6, 0xf1d16a, 0.9)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH));
    remember(scene.add.text(x, y, label, {
      fontFamily: 'Arial',
      fontSize: '50px',
      color: '#fff1ad',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(UI_DEPTH + 1));
  });

  const magicButton = remember(scene.add.circle(MAGIC_X, MAGIC_Y, 68, 0x7a302d, 0.84)
    .setStrokeStyle(6, 0xf0a08c, 0.98)
    .setScrollFactor(0)
    .setDepth(UI_DEPTH)
    .setInteractive({ useHandCursor: true }));
  remember(scene.add.text(MAGIC_X, MAGIC_Y, '✦', {
    fontFamily: 'Arial',
    fontSize: '62px',
    color: '#ffe9df',
    fontStyle: 'bold'
  }).setOrigin(0.5).setScrollFactor(0).setDepth(UI_DEPTH + 1));

  magicButton.on('pointerdown', () => {
    shootRequested = true;
    magicButton.setFillStyle(0xa9473b, 0.96);
  });
  const restoreMagic = (): void => {
    magicButton.setFillStyle(0x7a302d, 0.84);
  };
  magicButton.on('pointerup', restoreMagic);
  magicButton.on('pointerout', restoreMagic);
  magicButton.on('pointerupoutside', restoreMagic);

  let dpadPointerId: number | null = null;
  const clearDirections = (): void => {
    touchDirections.left = false;
    touchDirections.right = false;
    touchDirections.up = false;
    touchDirections.down = false;
  };
  const updateDirectionFromPointer = (pointer: Phaser.Input.Pointer): void => {
    const dx = pointer.x - DPAD_CENTER_X;
    const dy = pointer.y - DPAD_CENTER_Y;
    const deadZone = 36;
    clearDirections();
    if (Math.abs(dx) > deadZone) touchDirections[dx < 0 ? 'left' : 'right'] = true;
    if (Math.abs(dy) > deadZone) touchDirections[dy < 0 ? 'up' : 'down'] = true;
  };

  scene.input.addPointer(2);
  scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (Phaser.Math.Distance.Between(pointer.x, pointer.y, DPAD_CENTER_X, DPAD_CENTER_Y) <= 200) {
      dpadPointerId = pointer.id;
      updateDirectionFromPointer(pointer);
    }
  });
  scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    if (pointer.id !== dpadPointerId || !pointer.isDown) return;
    updateDirectionFromPointer(pointer);
  });
  const releaseDpad = (pointer: Phaser.Input.Pointer): void => {
    if (pointer.id !== dpadPointerId) return;
    dpadPointerId = null;
    clearDirections();
  };
  scene.input.on('pointerup', releaseDpad);
  scene.input.on('pointerupoutside', releaseDpad);
  scene.input.on('gameout', clearDirections);

  const worldObjects = scene.children.list.filter((child) => !uiObjects.includes(child));
  const uiCamera = scene.cameras.add(0, 0, PHYSICAL_WIDTH, PHYSICAL_HEIGHT, false, `${scene.scene.key}UICamera`);
  uiCamera.setZoom(1).setScroll(0, 0).setRoundPixels(false);
  scene.cameras.main.ignore(uiObjects);
  uiCamera.ignore(worldObjects);

  const updateEnergy = (energy: number): void => {
    const clamped = Phaser.Math.Clamp(energy, 0, 100);
    const fillWidth = ENERGY_FULL_WIDTH * (clamped / 100);
    const isCritical = clamped < 30;
    energyGold.setDisplaySize(fillWidth, ENERGY_FILL_HEIGHT).setVisible(!isCritical);
    energyRed.setDisplaySize(fillWidth, ENERGY_FILL_HEIGHT).setVisible(isCritical);
  };
  updateEnergy(initialEnergy);

  return {
    touchDirections,
    consumeShootRequest: () => {
      const requested = shootRequested;
      shootRequested = false;
      return requested;
    },
    updateEnergy,
    updateCoins: (coins: number) => coinCounter.setText(String(coins)),
    ignoreWorldObject: (object: Phaser.GameObjects.GameObject) => uiCamera.ignore(object)
  };
}
