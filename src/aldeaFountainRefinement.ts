import * as Phaser from 'phaser';
import { AldeaScene } from './scenes/AldeaScene';

const FOUNTAIN_X = 496;
const FOUNTAIN_Y = 320;
const FOUNTAIN_SIZE = 128;
const FOUNTAIN_ANIMATION_KEY = 'aldea-little-fountain-loop';
// La referencia visual es la base de la fuente, no su centro geométrico.
// Al cruzar esta línea con los pies, cambiamos qué objeto queda delante.
const FOUNTAIN_FRONT_THRESHOLD_Y = FOUNTAIN_Y + FOUNTAIN_SIZE / 4;
const FOUNTAIN_DEPTH_BEHIND_PLAYER = 31;
const FOUNTAIN_DEPTH_IN_FRONT_OF_PLAYER = 18;

type AldeaRuntime = Phaser.Scene & {
  player: Phaser.Physics.Arcade.Sprite;
  __aldeaDepthSortedFountain?: Phaser.Physics.Arcade.Sprite;
  ui: {
    ignoreWorldObject: (object: Phaser.GameObjects.GameObject) => void;
  };
};

type AldeaPrototype = {
  __aldeaFountainRefinementInstalled?: boolean;
  preload: (this: AldeaRuntime) => void;
  create: (this: AldeaRuntime) => void;
  update: (this: AldeaRuntime, time: number, delta: number) => void;
};

export function installAldeaFountainRefinement(): void {
  const prototype = AldeaScene.prototype as unknown as AldeaPrototype;
  if (prototype.__aldeaFountainRefinementInstalled) return;
  prototype.__aldeaFountainRefinementInstalled = true;

  const originalPreload = prototype.preload;
  const originalCreate = prototype.create;
  const originalUpdate = prototype.update;

  prototype.preload = function preloadWithFountain(this: AldeaRuntime): void {
    originalPreload.call(this);
    this.load.image('aldea-little-fountain-01', './assets/environment/fountain/little-fountain-01.png');
    this.load.image('aldea-little-fountain-02', './assets/environment/fountain/little-fountain-02.png');
    this.load.image('aldea-little-fountain-03', './assets/environment/fountain/little-fountain-03.png');
    this.load.image('aldea-little-fountain-04', './assets/environment/fountain/little-fountain-04.png');
  };

  prototype.create = function createWithFountain(this: AldeaRuntime): void {
    originalCreate.call(this);

    if (this.anims.exists(FOUNTAIN_ANIMATION_KEY)) {
      this.anims.remove(FOUNTAIN_ANIMATION_KEY);
    }

    this.anims.create({
      key: FOUNTAIN_ANIMATION_KEY,
      frames: [
        { key: 'aldea-little-fountain-01' },
        { key: 'aldea-little-fountain-02' },
        { key: 'aldea-little-fountain-03' },
        { key: 'aldea-little-fountain-04' }
      ],
      frameRate: 5,
      repeat: -1
    });

    const fountain = this.physics.add.staticSprite(
      FOUNTAIN_X,
      FOUNTAIN_Y,
      'aldea-little-fountain-01'
    );

    fountain
      .setDisplaySize(FOUNTAIN_SIZE, FOUNTAIN_SIZE)
      .setDepth(18)
      .play(FOUNTAIN_ANIMATION_KEY);

    fountain.refreshBody();
    const body = fountain.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(86, 54).setOffset(21, 66);

    // El movimiento del jugador en La Aldea se limita mediante el grid positivo.
    // No añadimos collider físico con la fuente para evitar contradicciones con celdas jugables.

    // La cámara del HUD se crea antes que este refinement. Hay que excluir
    // explícitamente la fuente para que no aparezca una segunda copia fija
    // en pantalla mientras la cámara del mundo sigue al personaje.
    this.ui.ignoreWorldObject(fountain);
    this.__aldeaDepthSortedFountain = fountain;
  };

  prototype.update = function updateWithFountainDepth(this: AldeaRuntime, time: number, delta: number): void {
    originalUpdate.call(this, time, delta);
    const fountain = this.__aldeaDepthSortedFountain;
    if (!fountain?.active || !this.player?.active) return;
    // Jugador por encima de la base: fuente delante, ocultándolo parcialmente.
    // Jugador por debajo: fuente detrás del personaje.
    const playerFootY = this.player.y + 20;
    fountain.setDepth(
      playerFootY < FOUNTAIN_FRONT_THRESHOLD_Y
        ? FOUNTAIN_DEPTH_BEHIND_PLAYER
        : FOUNTAIN_DEPTH_IN_FRONT_OF_PLAYER
    );
  };
}
