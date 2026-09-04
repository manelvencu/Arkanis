import * as Phaser from 'phaser';
import { TrainingScene } from './scenes/TrainingScene';
import { setVillageProgressFromTraining } from './villageProgress';

type TrainingPrototype = {
  __worldMapTransitionInstalled?: boolean;
  checkExit: (this: TrainingScene) => void;
};

type TrainingRuntime = {
  exitUnlocked: boolean;
  isExiting: boolean;
  player: Phaser.Physics.Arcade.Sprite;
  barrier: Phaser.Physics.Arcade.Image;
  characterId: string;
  energy: number;
  coinsCollected: number;
};

const REGISTRY_ENERGY_KEY = 'arkanis.player.energy';
const REGISTRY_COINS_KEY = 'arkanis.player.coins';

export function installWorldMapTransitionRefinement(): void {
  const prototype = TrainingScene.prototype as unknown as TrainingPrototype;
  if (prototype.__worldMapTransitionInstalled) return;

  prototype.__worldMapTransitionInstalled = true;
  prototype.checkExit = function checkExitToWorldMap(this: TrainingScene): void {
    const runtime = this as unknown as TrainingRuntime;
    if (!runtime.exitUnlocked || runtime.isExiting) return;

    const body = runtime.player.body as Phaser.Physics.Arcade.Body;
    const insidePortal = Phaser.Geom.Rectangle.Contains(
      new Phaser.Geom.Rectangle(runtime.barrier.x - 60, runtime.barrier.y - 48, 120, 96),
      runtime.player.x,
      runtime.player.y
    );

    if (!insidePortal || body.velocity.y >= 0) return;

    runtime.isExiting = true;
    body.setVelocity(0);
    runtime.player.anims.stop();

    const energy = Math.max(0, Math.min(100, runtime.energy));
    const coins = Math.max(0, Math.floor(runtime.coinsCollected));

    // Guardamos el estado en dos capas: progreso de juego y Registry de Phaser.
    // El Registry pertenece a la instancia completa del juego y sobrevive a los cambios de escena.
    setVillageProgressFromTraining(energy, coins);
    this.registry.set(REGISTRY_ENERGY_KEY, energy);
    this.registry.set(REGISTRY_COINS_KEY, coins);

    this.cameras.main.fadeOut(750, 3, 2, 8);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.physics.pause();
      this.scene.start('WorldMapScene', {
        characterId: runtime.characterId,
        energy,
        coins
      });
    });
  };
}
