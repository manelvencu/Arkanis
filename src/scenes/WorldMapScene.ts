import * as Phaser from 'phaser';

const MAP_TIMEOUT_MS = 60_000;
// Punto central del rótulo «La Aldea» en arkanis-world-map.png.
// Imagen de referencia: 1220×1567; centro aproximado del rótulo: x=510, y=907.
const ALDEA_TARGET = { x: 510 / 1220, y: 907 / 1567 };

interface WorldMapData {
  characterId?: string;
  startAtMap?: boolean;
}

export class WorldMapScene extends Phaser.Scene {
  private characterId = 'tiana';
  private startAtMap = false;
  private mapContainer?: Phaser.GameObjects.Container;
  private mapImage?: Phaser.GameObjects.Image;
  private mapTimeout?: Phaser.Time.TimerEvent;
  private canContinue = false;
  private transitioning = false;

  constructor() {
    super('WorldMapScene');
  }

  init(data: WorldMapData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.startAtMap = data.startAtMap ?? false;
    this.canContinue = false;
    this.transitioning = false;
  }

  preload(): void {
    this.load.image('story-jewel-complete', './assets/story/joya-completa-arkanis.png');
    this.load.image('story-jewel-pieces', './assets/story/joya-trozos-arkanis.png');
    this.load.image('story-world-map', './assets/maps/arkanis-world-map.png');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#05040a');

    if (this.startAtMap) {
      this.showWorldMap();
      return;
    }

    const title = this.add.text(width / 2, height / 2,
      'El viaje por las Tierras de Arkanis\ncomienza ahora.', {
        fontFamily: 'IM Fell English, Georgia, serif',
        fontSize: '64px',
        color: '#f6df9d',
        align: 'center',
        stroke: '#24170d',
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: title,
      alpha: 1,
      duration: 900,
      hold: 3000,
      yoyo: true,
      onComplete: () => {
        title.destroy();
        this.showJewelSequence();
      }
    });
  }

  private showJewelSequence(): void {
    const { width, height } = this.scale;
    const complete = this.add.image(width / 2, height / 2 - 40, 'story-jewel-complete').setAlpha(0);
    this.fitInside(complete, width * 0.48, height * 0.62);

    const pieces = this.add.image(width / 2, height / 2 - 40, 'story-jewel-pieces')
      .setAlpha(0)
      .setScale(0.9);
    this.fitInside(pieces, width * 0.52, height * 0.64);
    pieces.setScale(pieces.scaleX * 0.9, pieces.scaleY * 0.9);

    this.tweens.add({
      targets: complete,
      alpha: 1,
      duration: 700,
      hold: 1500,
      onComplete: () => {
        this.cameras.main.flash(280, 255, 232, 160);
        this.cameras.main.shake(420, 0.008);
        this.tweens.add({
          targets: complete,
          alpha: 0,
          scaleX: complete.scaleX * 1.12,
          scaleY: complete.scaleY * 1.12,
          duration: 420,
          ease: 'Quad.easeOut'
        });
        this.tweens.add({
          targets: pieces,
          alpha: 1,
          scaleX: pieces.scaleX / 0.9,
          scaleY: pieces.scaleY / 0.9,
          duration: 650,
          ease: 'Back.easeOut',
          onComplete: () => this.showJewelMessage(pieces)
        });
      }
    });
  }

  private showJewelMessage(pieces: Phaser.GameObjects.Image): void {
    const { width, height } = this.scale;
    const message = this.add.text(width / 2, height - 120,
      'Ocho mundos guardan las piezas de la gran joya de Arkanis.', {
        fontFamily: 'IM Fell English, Georgia, serif',
        fontSize: '42px',
        color: '#f4d98c',
        align: 'center',
        stroke: '#1b120b',
        strokeThickness: 4,
        wordWrap: { width: width * 0.82 }
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: message,
      alpha: 1,
      duration: 650,
      hold: 2300,
      onComplete: () => {
        this.tweens.add({ targets: [pieces, message], alpha: 0, duration: 650 });
        this.time.delayedCall(700, () => {
          pieces.destroy();
          message.destroy();
          this.showWorldMap();
        });
      }
    });
  }

  private showWorldMap(): void {
    const { width, height } = this.scale;

    const background = this.add.image(width / 2, height / 2, 'story-world-map')
      .setTint(0x50485b)
      .setAlpha(0.42);
    this.fitCover(background, width, height);
    const fx = (background as unknown as { preFX?: { addBlur?: (quality?: number, x?: number, y?: number, strength?: number) => unknown } }).preFX;
    fx?.addBlur?.(1, 3, 3, 2);

    const veil = this.add.rectangle(width / 2, height / 2, width, height, 0x080711, 0.42);

    const map = this.add.image(0, 0, 'story-world-map');
    this.fitInside(map, width * 0.72, height * 0.94);

    const container = this.add.container(width / 2, height / 2, [map]).setAlpha(0);
    this.mapContainer = container;
    this.mapImage = map;

    const hint = this.add.text(width / 2, height - 44,
      'Pulsa cualquier tecla o toca la pantalla para comenzar', {
        fontFamily: 'IM Fell English, Georgia, serif',
        fontSize: '30px',
        color: '#f5dda0',
        stroke: '#130d09',
        strokeThickness: 3
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: [container, hint],
      alpha: 1,
      duration: 900,
      onComplete: () => {
        this.canContinue = true;
        this.installContinueInput();
        this.pulseAldea();
        this.mapTimeout = this.time.delayedCall(MAP_TIMEOUT_MS, () => this.beginAldeaTransition());
      }
    });

    void veil;
  }

  private pulseAldea(): void {
    if (!this.mapContainer || !this.mapImage) return;
    const local = this.aldeaLocalPoint();
    const glow = this.add.circle(local.x, local.y, 70, 0xffe28a, 0.08)
      .setStrokeStyle(8, 0xffdc78, 0.88);
    this.mapContainer.add(glow);
    this.tweens.add({
      targets: glow,
      scale: 1.22,
      alpha: 0.7,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private installContinueInput(): void {
    const go = (): void => this.beginAldeaTransition();
    this.input.keyboard?.once('keydown', go);
    this.input.once('pointerdown', go);
  }

  private beginAldeaTransition(): void {
    if (!this.canContinue || this.transitioning || !this.mapContainer || !this.mapImage) return;
    this.transitioning = true;
    this.mapTimeout?.remove(false);
    this.input.keyboard?.removeAllListeners('keydown');
    this.input.removeAllListeners('pointerdown');

    const { width, height } = this.scale;
    const local = this.aldeaLocalPoint();
    const targetScale = 5.6;

    const flash = this.add.circle(
      this.mapContainer.x + local.x,
      this.mapContainer.y + local.y,
      90,
      0xffe9a3,
      0.18
    ).setStrokeStyle(10, 0xffdc74, 0.95).setDepth(50);

    this.tweens.add({ targets: flash, scale: 2.2, alpha: 0, duration: 850 });
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
  }

  private aldeaLocalPoint(): Phaser.Math.Vector2 {
    if (!this.mapImage) return new Phaser.Math.Vector2(0, 0);
    return new Phaser.Math.Vector2(
      (ALDEA_TARGET.x - 0.5) * this.mapImage.displayWidth,
      (ALDEA_TARGET.y - 0.5) * this.mapImage.displayHeight
    );
  }

  private fitInside(image: Phaser.GameObjects.Image, maxWidth: number, maxHeight: number): void {
    const source = image.texture.getSourceImage() as { width: number; height: number };
    const scale = Math.min(maxWidth / source.width, maxHeight / source.height);
    image.setDisplaySize(source.width * scale, source.height * scale);
  }

  private fitCover(image: Phaser.GameObjects.Image, targetWidth: number, targetHeight: number): void {
    const source = image.texture.getSourceImage() as { width: number; height: number };
    const scale = Math.max(targetWidth / source.width, targetHeight / source.height);
    image.setDisplaySize(source.width * scale, source.height * scale);
  }
}
