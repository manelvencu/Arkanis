import * as Phaser from 'phaser';
import { TrainingScene } from './scenes/TrainingScene';

const PLAYER_DISPLAY_WIDTH = 68;
const PLAYER_DISPLAY_HEIGHT = 68;
const PLAYER_BODY_WORLD_WIDTH = 36;
const PLAYER_BODY_WORLD_HEIGHT = 28;
const PLAYER_BODY_BOTTOM_MARGIN = 4;

type TrainingPhysicsPrototype = {
  __tianaPhysicsRefinementInstalled?: boolean;
  createPlayer: (this: TrainingScene, placeholderColor: number) => void;
  characterId: string;
  player: Phaser.Physics.Arcade.Sprite;
};

export function installTianaPhysicsRefinement(): void {
  const prototype = TrainingScene.prototype as unknown as TrainingPhysicsPrototype;
  if (prototype.__tianaPhysicsRefinementInstalled) return;

  const originalCreatePlayer = prototype.createPlayer;
  prototype.__tianaPhysicsRefinementInstalled = true;

  prototype.createPlayer = function createPlayerWithStablePhysics(
    this: TrainingScene,
    placeholderColor: number
  ): void {
    originalCreatePlayer.call(this, placeholderColor);

    const scene = this as unknown as TrainingPhysicsPrototype;
    if (scene.characterId !== 'tiana') return;

    configureTianaBody(scene.player);

    // Los PNG de Tiana son imágenes de alta resolución que se reducen a 68×68.
    // Reaplicamos el cuerpo cuando cambia el frame para que la física dependa del
    // tamaño visible en el mundo y no de la resolución interna del PNG.
    scene.player.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => {
      configureTianaBody(scene.player);
    });
  };
}

function configureTianaBody(player: Phaser.Physics.Arcade.Sprite): void {
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
