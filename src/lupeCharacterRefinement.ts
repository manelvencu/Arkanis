import * as Phaser from 'phaser';
import { TrainingScene } from './scenes/TrainingScene';

const LUPE_ASSETS = {
  'idle-down': './assets/characters/lupe/walk-down/lupe-idle-down.png',
  'walk-down-01': './assets/characters/lupe/walk-down/lupe-walk-down-01.png',
  'walk-down-02': './assets/characters/lupe/walk-down/lupe-walk-down-02.png',
  'idle-right': './assets/characters/lupe/walk-right/lupe-idle-right.png',
  'walk-right-01': './assets/characters/lupe/walk-right/lupe-walk-right-01.png',
  'walk-right-02': './assets/characters/lupe/walk-right/lupe-walk-right-02.png',
  'idle-up': './assets/characters/lupe/walk-up/lupe-idle-up.png',
  'walk-up-01': './assets/characters/lupe/walk-up/lupe-walk-up-01.png',
  'walk-up-02': './assets/characters/lupe/walk-up/lupe-walk-up-02.png'
} as const;

const PLAYER_DISPLAY_WIDTH = 68;
const PLAYER_DISPLAY_HEIGHT = 68;
const PLAYER_BODY_WORLD_WIDTH = 36;
const PLAYER_BODY_WORLD_HEIGHT = 28;
const PLAYER_BODY_BOTTOM_MARGIN = 4;

type Facing = 'down' | 'up' | 'side';

type TrainingPrototype = {
  __lupeCharacterRefinementInstalled?: boolean;
  preload: (this: TrainingScene) => void;
  createPlayer: (this: TrainingScene, placeholderColor: number) => void;
  update: (this: TrainingScene, time: number) => void;
  playCastAnimation: (this: TrainingScene) => void;
};

type TrainingRuntime = {
  characterId: string;
  player: Phaser.Physics.Arcade.Sprite;
  facing: Facing;
  isCasting: boolean;
};

export function installLupeCharacterRefinement(): void {
  const prototype = TrainingScene.prototype as unknown as TrainingPrototype;
  if (prototype.__lupeCharacterRefinementInstalled) return;

  const originalPreload = prototype.preload;
  const originalCreatePlayer = prototype.createPlayer;
  const originalUpdate = prototype.update;
  const originalPlayCastAnimation = prototype.playCastAnimation;
  prototype.__lupeCharacterRefinementInstalled = true;

  prototype.preload = function preloadWithLupe(this: TrainingScene): void {
    originalPreload.call(this);
    const runtime = this as unknown as TrainingRuntime;
    if (runtime.characterId !== 'lupe') return;

    Object.entries(LUPE_ASSETS).forEach(([key, path]) => {
      this.load.image(`lupe-${key}`, path);
    });
  };

  prototype.createPlayer = function createPlayerWithLupe(
    this: TrainingScene,
    placeholderColor: number
  ): void {
    const runtime = this as unknown as TrainingRuntime;
    if (runtime.characterId !== 'lupe') {
      originalCreatePlayer.call(this, placeholderColor);
      return;
    }

    // Conservamos el punto de aparición y el flujo base de TrainingScene,
    // sustituyendo únicamente la representación provisional de Lupe.
    originalCreatePlayer.call(this, placeholderColor);
    const spawnX = runtime.player.x;
    const spawnY = runtime.player.y;
    runtime.player.destroy();

    createLupeAnimations(this);
    runtime.player = this.physics.add.sprite(spawnX, spawnY, 'lupe-idle-down');
    runtime.player
      .setDisplaySize(PLAYER_DISPLAY_WIDTH, PLAYER_DISPLAY_HEIGHT)
      .setCollideWorldBounds(true)
      .setDepth(50);

    configureLupeBody(runtime.player);
    runtime.player.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => {
      configureLupeBody(runtime.player);
    });
  };

  prototype.playCastAnimation = function playCastAnimationWithLupe(this: TrainingScene): void {
    const runtime = this as unknown as TrainingRuntime;
    if (runtime.characterId !== 'lupe') {
      originalPlayCastAnimation.call(this);
      return;
    }

    runtime.isCasting = true;
    runtime.player.anims.play(`lupe-cast-${runtime.facing}`, true);
    runtime.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      runtime.isCasting = false;
    });
  };

  prototype.update = function updateWithLupe(this: TrainingScene, time: number): void {
    originalUpdate.call(this, time);

    const runtime = this as unknown as TrainingRuntime;
    if (runtime.characterId !== 'lupe' || runtime.isCasting) return;

    const body = runtime.player.body as Phaser.Physics.Arcade.Body;
    const isMoving = Math.abs(body.velocity.x) > 0.1 || Math.abs(body.velocity.y) > 0.1;

    if (isMoving) {
      runtime.player.anims.play(`lupe-walk-${runtime.facing}`, true);
      return;
    }

    runtime.player.anims.stop();
    const idleTexture = runtime.facing === 'down'
      ? 'lupe-idle-down'
      : runtime.facing === 'side'
        ? 'lupe-idle-right'
        : 'lupe-idle-up';

    runtime.player.setTexture(idleTexture);
    configureLupeBody(runtime.player);
  };
}

function createLupeAnimations(scene: Phaser.Scene): void {
  const create = (key: string, textureKeys: string[], frameRate: number, repeat: number): void => {
    if (scene.anims.exists(key)) return;
    scene.anims.create({
      key,
      frames: textureKeys.map((textureKey) => ({ key: textureKey })),
      frameRate,
      repeat
    });
  };

  create('lupe-walk-down', ['lupe-walk-down-01', 'lupe-walk-down-02'], 6, -1);
  create(
    'lupe-walk-side',
    ['lupe-walk-right-01', 'lupe-idle-right', 'lupe-walk-right-02', 'lupe-idle-right'],
    8,
    -1
  );
  create('lupe-walk-up', ['lupe-walk-up-01', 'lupe-walk-up-02'], 6, -1);

  // Hasta disponer de poses de disparo específicas, el rayo reutiliza el idle
  // de la dirección actual, igual que en la integración inicial de Tiana.
  create('lupe-cast-down', ['lupe-idle-down'], 14, 0);
  create('lupe-cast-side', ['lupe-idle-right'], 14, 0);
  create('lupe-cast-up', ['lupe-idle-up'], 14, 0);
}

function configureLupeBody(player: Phaser.Physics.Arcade.Sprite): void {
  const body = player.body as Phaser.Physics.Arcade.Body;
  const scaleX = Math.abs(player.scaleX) || 1;
  const scaleY = Math.abs(player.scaleY) || 1;

  const bodyWidth = PLAYER_BODY_WORLD_WIDTH / scaleX;
  const bodyHeight = PLAYER_BODY_WORLD_HEIGHT / scaleY;
  const offsetX = ((PLAYER_DISPLAY_WIDTH - PLAYER_BODY_WORLD_WIDTH) / 2) / scaleX;
  const offsetY = (
    PLAYER_DISPLAY_HEIGHT
    - PLAYER_BODY_WORLD_HEIGHT
    - PLAYER_BODY_BOTTOM_MARGIN
  ) / scaleY;

  body.setSize(bodyWidth, bodyHeight, false);
  body.setOffset(offsetX, offsetY);
}
