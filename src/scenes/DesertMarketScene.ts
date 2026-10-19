import * as Phaser from 'phaser';
import { characters, type CharacterId } from '../gameData';
import {
  createPlayableUi,
  preloadPlayableUiAssets,
  type PlayableUiController
} from '../playableSceneUi';
import {
  getVillageProgress,
  purchaseDesertCarpet
} from '../villageProgress';

interface DesertMarketSceneData {
  characterId?: CharacterId;
}

const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 640;
const BACKGROUND_KEY = 'desert-market-tent-interior-01';
const CARPET_PRICE = 40;

const PLAYER_X = 286;
const PLAYER_Y = 514;
const PLAYER_SIZE = 136;

const CHARACTER_ASSETS = {
  tiana: './assets/characters/tiana/walk-right/tiana-idle-right.png',
  lupe: './assets/characters/lupe/walk-right/lupe-idle-right.png'
} as const;

export class DesertMarketScene extends Phaser.Scene {
  private characterId: CharacterId = 'tiana';
  private player!: Phaser.GameObjects.Image;
  private ui!: PlayableUiController;
  private closing = false;

  constructor() {
    super('DesertMarketScene');
  }

  init(data: DesertMarketSceneData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.closing = false;
  }

  preload(): void {
    this.load.image(
      BACKGROUND_KEY,
      './assets/environment/interiors/desert/desert-market-tent-interior-01.png'
    );

    this.load.image(
      'desert-market-player',
      CHARACTER_ASSETS[this.characterId === 'lupe' ? 'lupe' : 'tiana']
    );

    preloadPlayableUiAssets(this);
  }

  create(): void {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#1d1008');

    this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, BACKGROUND_KEY)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(0);

    this.player = this.add.image(PLAYER_X, PLAYER_Y, 'desert-market-player')
      .setDisplaySize(PLAYER_SIZE, PLAYER_SIZE)
      .setDepth(PLAYER_Y + 20);

    // El personaje queda inmóvil, situado a los pies de la alfombra y mirando
    // hacia el interior de la tienda.
    this.player.setFlipX(false);

    this.cameras.main.setZoom(2);
    this.cameras.main.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    this.cameras.main.fadeIn(240, 20, 12, 6);

    const progress = getVillageProgress();
    const character =
      characters.find((item) => item.id === this.characterId) ?? characters[0];

    this.ui = createPlayableUi(
      this,
      this.characterId,
      character.name,
      progress.energy,
      progress.coins,
      {
        controlsEnabled: false,
        carpetOwned: progress.desertCarpetPurchased
      }
    );

    this.showOffer();
  }

  private showOffer(): void {
    const progress = getVillageProgress();

    if (progress.desertCarpetPurchased) {
      this.showDialog(
        'La alfombra especial ya es tuya.',
        [
          {
            label: 'Salir de la tienda',
            action: () => this.exitToDesert()
          }
        ]
      );
      return;
    }

    const missing = Math.max(0, CARPET_PRICE - progress.coins);

    if (missing > 0) {
      this.showDialog(
        'Hola viajer@. Tengo una alfombra muy especial para ti. ¿Quieres comprarla?',
        [
          {
            label: `Te faltan ${missing} monedas`,
            enabled: false
          },
          {
            label: 'No comprar',
            action: () => this.exitToDesert()
          }
        ]
      );
      return;
    }

    this.showDialog(
      'Hola viajer@. Tengo una alfombra muy especial para ti. ¿Quieres comprarla?',
      [
        {
          label: `Comprar · ${CARPET_PRICE} monedas`,
          action: () => this.buyCarpet()
        },
        {
          label: 'No comprar',
          action: () => this.exitToDesert()
        }
      ]
    );
  }

  private buyCarpet(): void {
    const result = purchaseDesertCarpet(CARPET_PRICE);
    const progress = getVillageProgress();

    if (result === 'insufficient') {
      this.showOffer();
      return;
    }

    if (result === 'owned') {
      this.showOffer();
      return;
    }

    this.registry.set('arkanis.player.coins', progress.coins);
    this.registry.set('arkanis.player.desertCarpetPurchased', true);
    this.ui.updateCoins(progress.coins);
    this.ui.updateCarpetOwned(true);
    this.ui.pulseCoins();

    this.clearDialog();
    this.showDialog(
      'La alfombra es tuya. Guárdala bien, viajero.',
      [
        {
          label: 'Salir de la tienda',
          action: () => this.exitToDesert()
        }
      ]
    );
  }

  private dialogObjects: Phaser.GameObjects.GameObject[] = [];
  private dialogKeyHandler?: (event: KeyboardEvent) => void;

  private clearDialog(): void {
    if (this.dialogKeyHandler) {
      this.input.keyboard?.off('keydown', this.dialogKeyHandler);
      this.dialogKeyHandler = undefined;
    }
    this.dialogObjects.forEach((object) => object.destroy());
    this.dialogObjects = [];
  }

  private showDialog(
    message: string,
    choices: Array<{
      label: string;
      action?: () => void;
      enabled?: boolean;
    }>
  ): void {
    this.clearDialog();

    // Centro relativo real de la pantalla de juego. No dependemos del mundo,
    // del zoom, del scroll ni de una resolución concreta.
    const viewportWidth = this.scale.width;
    const viewportHeight = this.scale.height;
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;
    const boxHeight = choices.length > 1
      ? viewportHeight * 0.36
      : viewportHeight * 0.30;

    const box = this.add.rectangle(
      centerX,
      centerY,
      viewportWidth * 0.425,
      boxHeight,
      0x170d08,
      0.96
    )
      .setStrokeStyle(3, 0xd6a84b, 1)
      .setDepth(20000);

    const text = this.add.text(
      centerX,
      centerY - boxHeight / 2 + 34,
      message,
      {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: `${Math.round(viewportHeight * 0.031)}px`,
        color: '#fff0c7',
        align: 'center',
        wordWrap: { width: viewportWidth * 0.375 }
      }
    )
      .setOrigin(0.5, 0)
      .setDepth(20001);

    this.dialogObjects.push(box, text);
    this.ui.showOnUiCamera(box);
    this.ui.showOnUiCamera(text);

    const startY = centerY + viewportHeight * 0.052;

    const buttons: Phaser.GameObjects.Rectangle[] = [];
    const selectable = choices
      .map((choice, index) => choice.enabled !== false && !!choice.action ? index : -1)
      .filter((index) => index >= 0);
    // Si existe, «No comprar» es siempre la selección inicial.
    let selected = selectable.find((index) => choices[index].label === 'No comprar')
      ?? selectable[0] ?? -1;

    const highlight = (): void => {
      buttons.forEach((button, index) => {
        const enabled = choices[index].enabled !== false && !!choices[index].action;
        const focused = enabled && index === selected;
        button.setFillStyle(!enabled ? 0x3a302a : focused ? 0x93632c : 0x6f3a22, enabled ? 0.96 : 0.72);
        button.setStrokeStyle(focused ? 4 : 2, focused ? 0xffef9d : enabled ? 0xe2ba66 : 0x7a6c5c, 1);
      });
    };
    const moveSelection = (direction: number): void => {
      if (selectable.length < 2) return;
      const current = selectable.indexOf(selected);
      selected = selectable[(current + direction + selectable.length) % selectable.length];
      highlight();
    };
    const confirmSelection = (): void => {
      if (selected < 0 || this.closing) return;
      choices[selected].action?.();
    };

    choices.forEach((choice, index) => {
      const enabled = choice.enabled !== false;
      const y = startY + index * (viewportHeight * 0.081);
      const button = this.add.rectangle(
        centerX, y,
        viewportWidth * 0.3125,
        viewportHeight * 0.063,
        enabled ? 0x6f3a22 : 0x3a302a,
        enabled ? 0.96 : 0.72
      ).setDepth(20001);

      const label = this.add.text(centerX, y, choice.label, {
        fontFamily: 'Arial',
        fontSize: `${Math.round(viewportHeight * 0.028)}px`,
        color: enabled ? '#fff1c7' : '#c9bca7',
        fontStyle: enabled ? 'bold' : 'normal'
      }).setOrigin(0.5).setDepth(20002);

      buttons.push(button);
      if (enabled && choice.action) {
        button.setInteractive({ useHandCursor: true });
        button.on('pointerover', () => { selected = index; highlight(); });
        button.on('pointerdown', () => { selected = index; confirmSelection(); });
      }

      this.dialogObjects.push(button, label);
      this.ui.showOnUiCamera(button);
      this.ui.showOnUiCamera(label);
    });
    highlight();

    this.dialogKeyHandler = (event: KeyboardEvent): void => {
      if (event.code === 'ArrowUp' || event.code === 'ArrowLeft') {
        event.preventDefault();
        moveSelection(-1);
      } else if (event.code === 'ArrowDown' || event.code === 'ArrowRight') {
        event.preventDefault();
        moveSelection(1);
      } else if (event.code === 'Enter' || event.code === 'NumpadEnter') {
        event.preventDefault();
        confirmSelection();
      }
    };
    this.input.keyboard?.on('keydown', this.dialogKeyHandler);

    // Flechas visibles y pulsables para las pantallas táctiles.
    if (selectable.length > 1) {
      [-1, 1].forEach((direction) => {
        const arrow = this.add.text(
          centerX + direction * viewportWidth * 0.19,
          startY + (choices.length - 1) * viewportHeight * 0.04,
          direction < 0 ? '◀' : '▶',
          { fontFamily: 'Arial', fontSize: '34px', color: '#ffe7a0', fontStyle: 'bold' }
        ).setOrigin(0.5).setDepth(20003).setInteractive({ useHandCursor: true });
        arrow.on('pointerdown', () => moveSelection(direction));
        this.dialogObjects.push(arrow);
        this.ui.showOnUiCamera(arrow);
      });
    }
  }

  private exitToDesert(): void {
    if (this.closing) return;
    this.closing = true;

    this.clearDialog();
    this.cameras.main.fadeOut(220, 18, 10, 5);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        if (this.scene.isSleeping('DesertScene')) {
          const desert = this.scene.get('DesertScene') as unknown as {
            returnFromShop?: () => void;
            cameras: Phaser.Cameras.Scene2D.CameraManager;
          };

          desert.returnFromShop?.();
          this.scene.wake('DesertScene');
          desert.cameras.main.fadeIn(220, 8, 5, 2);
          this.scene.stop();
          return;
        }

        this.scene.start('DesertScene', { characterId: this.characterId });
      }
    );
  }
}
