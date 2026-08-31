import * as Phaser from 'phaser';
import { AldeaScene } from './scenes/AldeaScene';

const FOUNTAIN_X = 496;
const FOUNTAIN_Y = 352;
const FOUNTAIN_SIZE = 128;
const FOUNTAIN_ANIMATION_KEY = 'aldea-little-fountain-loop';

type AldeaRuntime = Phaser.Scene & {
  player: Phaser.Physics.Arcade.Sprite;
};

type AldeaPrototype = {
  __aldeaFountainRefinementInstalled?: boolean;
  preload: (this: AldeaRuntime) => void;
  create: (this: AldeaRuntime) => void;
};

export function installAldeaFountainRefinement(): void {
  const prototype = AldeaScene.prototype as unknown as AldeaPrototype;
  if (prototype.__aldeaFountainRefinementInstalled) return;
  prototype.__aldeaFountainRefinementInstalled = true;

  const originalPreload = prototype.preload;
  const originalCreate = prototype.create;

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

    this.physics.add.collider(this.player, fountain);
  };
}
