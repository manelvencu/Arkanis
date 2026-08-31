import * as Phaser from 'phaser';
import { WorldMapScene } from './scenes/WorldMapScene';

type WorldMapRuntime = WorldMapScene & {
  characterId: string;
  mapContainer?: Phaser.GameObjects.Container;
  mapImage?: Phaser.GameObjects.Image;
  mapTimeout?: Phaser.Time.TimerEvent;
  canContinue: boolean;
  transitioning: boolean;
  aldeaLocalPoint: () => Phaser.Math.Vector2;
};

type WorldMapPrototype = {
  __worldMapVisualRefinementInstalled?: boolean;
  pulseAldea: (this: WorldMapRuntime) => void;
  beginAldeaTransition: (this: WorldMapRuntime) => void;
};

export function installWorldMapVisualRefinement(): void {
  const prototype = WorldMapScene.prototype as unknown as WorldMapPrototype;
  if (prototype.__worldMapVisualRefinementInstalled) return;
  prototype.__worldMapVisualRefinementInstalled = true;

  // No dibujamos ningún círculo o marcador sobre «La Aldea».
  prototype.pulseAldea = function pulseAldeaWithoutMarker(): void {};

  prototype.beginAldeaTransition = function beginAldeaTransitionWithoutMarker(this: WorldMapRuntime): void {
    if (!this.canContinue || this.transitioning || !this.mapContainer || !this.mapImage) return;
    this.transitioning = true;
    this.mapTimeout?.remove(false);
    this.input.keyboard?.removeAllListeners('keydown');
    this.input.removeAllListeners('pointerdown');

    const { width, height } = this.scale;
    const local = this.aldeaLocalPoint();
    const targetScale = 5.6;

    this.tweens.add({
      targets: this.mapContainer,
      scaleX: targetScale,
      scaleY: targetScale,
      x: width / 2 - local.x * targetScale,
      y: height / 2 - local.y * targetScale,
      duration: 3200,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.cameras.main.fadeOut(850, 3, 2, 8);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('AldeaScene', { characterId: this.characterId });
        });
      }
    });
  };
}
