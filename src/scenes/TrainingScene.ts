import * as Phaser from 'phaser';
import { characters, type CharacterId } from '../gameData';

interface TrainingData {
  characterId: CharacterId;
}

type TouchDirection = 'left' | 'right' | 'up' | 'down';

type Facing = 'down' | 'up' | 'side';

export class TrainingScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private direction = new Phaser.Math.Vector2(0, 1);
  private lastShotAt = 0;
  private characterId: CharacterId = 'tiana';
  private touchDirections: Record<TouchDirection, boolean> = {
    left: false,
    right: false,
    up: false,
    down: false
  };
  private touchShootRequested = false;
  private facing: Facing = 'down';
  private isCasting = false;

  constructor() {
    super('TrainingScene');
  }

  init(data: TrainingData): void {
    this.characterId = data.characterId ?? 'tiana';
  }

  preload(): void {
    if (this.characterId === 'tiana') {
      this.load.spritesheet('tiana-game', './assets/tiana-spritesheet.png', {
        frameWidth: 48,
        frameHeight: 48
      });
    } else if (this.characterId === 'lupe') {
      this.load.spritesheet('lupe-game', './assets/lupe-spritesheet.png', {
        frameWidth: 48,
        frameHeight: 48
      });
    }
  }

  create(): void {
    const worldWidth = 1280;
    const worldHeight = 720;
    const character = characters.find((item) => item.id === this.characterId) ?? characters[0];

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    this.add.rectangle(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 0x78ad63);

    const road = this.add.rectangle(worldWidth / 2, worldHeight / 2, 1120, 150, 0xc8a66a);
    road.setStrokeStyle(4, 0xa28351);

    this.createVillageDecor();
    this.createSigns();
    this.createExitDoor(worldWidth - 105, worldHeight / 2);

    if (this.characterId === 'tiana' || this.characterId === 'lupe') {
      this.createCharacterAnimations(this.characterId);
      this.player = this.physics.add.sprite(95, worldHeight / 2, `${this.characterId}-game`, 0);
      this.player.setDisplaySize(56, 56);
    } else {
      const textureKey = `player-${character.id}`;
      const playerGraphic = this.add.graphics();
      playerGraphic.fillStyle(character.placeholderColor, 1);
      playerGraphic.fillRoundedRect(0, 0, 30, 38, 6);
      playerGraphic.generateTexture(textureKey, 30, 38);
      playerGraphic.destroy();
      this.player = this.physics.add.sprite(95, worldHeight / 2, textureKey);
    }

    this.player.setCollideWorldBounds(true);
    this.player.setDepth(20);

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Permite usar al mismo tiempo un dedo para mover y otro para disparar.
    this.input.addPointer(2);
    this.createTouchControls();

    this.add.text(18, 18, character.name, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#00000099',
      padding: { x: 10, y: 6 }
    }).setScrollFactor(0).setDepth(50);
  }

  update(time: number): void {
    const speed = 190;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    let x = 0;
    let y = 0;

    if (this.cursors.left.isDown || this.touchDirections.left) x -= 1;
    if (this.cursors.right.isDown || this.touchDirections.right) x += 1;
    if (this.cursors.up.isDown || this.touchDirections.up) y -= 1;
    if (this.cursors.down.isDown || this.touchDirections.down) y += 1;

    if (x !== 0 || y !== 0) {
      const movement = new Phaser.Math.Vector2(x, y).normalize();
      body.setVelocity(movement.x * speed, movement.y * speed);
      this.direction.copy(movement);

      if (Math.abs(movement.x) > Math.abs(movement.y)) {
        this.facing = 'side';
        this.player.setFlipX(movement.x < 0);
      } else if (movement.y < 0) {
        this.facing = 'up';
        this.player.setFlipX(false);
      } else {
        this.facing = 'down';
        this.player.setFlipX(false);
      }

      if ((this.characterId === 'tiana' || this.characterId === 'lupe') && !this.isCasting) {
        this.player.anims.play(`${this.characterId}-walk-${this.facing}`, true);
      }
    } else if ((this.characterId === 'tiana' || this.characterId === 'lupe') && !this.isCasting) {
      this.player.anims.stop();
      const idleFrame = this.facing === 'down' ? 0 : this.facing === 'side' ? 7 : 14;
      this.player.setFrame(idleFrame);
    }

    const keyboardShot = Phaser.Input.Keyboard.JustDown(this.spaceKey);
    if ((keyboardShot || this.touchShootRequested) && time - this.lastShotAt > 250) {
      this.playCastAnimation();
      this.shootMagicRay();
      this.lastShotAt = time;
    }

    this.touchShootRequested = false;
  }

  private createCharacterAnimations(characterId: 'tiana' | 'lupe'): void {
    const textureKey = `${characterId}-game`;
    const create = (key: string, frames: number[], frameRate: number, repeat: number): void => {
      if (this.anims.exists(key)) return;
      this.anims.create({
        key,
        frames: frames.map((frame) => ({ key: textureKey, frame })),
        frameRate,
        repeat
      });
    };

    create(`${characterId}-walk-down`, [1, 2, 3, 2], 9, -1);
    create(`${characterId}-walk-side`, [8, 9, 10, 9], 9, -1);
    create(`${characterId}-walk-up`, [15, 16, 17, 16], 9, -1);

    create(`${characterId}-cast-down`, [4, 5, 6], 14, 0);

    if (characterId === 'tiana') {
      create('tiana-cast-side', [7, 8, 7], 14, 0);
      create('tiana-cast-up', [14, 15, 14], 14, 0);
    } else {
      create('lupe-cast-side', [11, 12, 13], 14, 0);
      create('lupe-cast-up', [18, 19, 20], 14, 0);
    }
  }

  private playCastAnimation(): void {
    if (this.characterId !== 'tiana' && this.characterId !== 'lupe') return;

    this.isCasting = true;
    this.player.anims.play(`${this.characterId}-cast-${this.facing}`, true);
    this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.isCasting = false;
    });
  }

  private createTouchControls(): void {
    const depth = 100;
    const alpha = 0.68;
    const centerX = 112;
    const centerY = this.scale.height - 108;
    const spacing = 56;

    const createDirectionButton = (
      x: number,
      y: number,
      label: string,
      direction: TouchDirection
    ): void => {
      const button = this.add.circle(x, y, 25, 0x171421, alpha)
        .setStrokeStyle(3, 0xf1d16a, 0.9)
        .setScrollFactor(0)
        .setDepth(depth)
        .setInteractive({ useHandCursor: true });

      this.add.text(x, y, label, {
        fontFamily: 'Arial',
        fontSize: '25px',
        color: '#fff1ad',
        fontStyle: 'bold'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);

      const press = (): void => {
        this.touchDirections[direction] = true;
        button.setFillStyle(0x70551c, 0.9);
      };

      const release = (): void => {
        this.touchDirections[direction] = false;
        button.setFillStyle(0x171421, alpha);
      };

      button.on('pointerdown', press);
      button.on('pointerup', release);
      button.on('pointerout', release);
      button.on('pointerupoutside', release);
    };

    createDirectionButton(centerX - spacing, centerY, '◀', 'left');
    createDirectionButton(centerX + spacing, centerY, '▶', 'right');
    createDirectionButton(centerX, centerY - spacing, '▲', 'up');
    createDirectionButton(centerX, centerY + spacing, '▼', 'down');

    this.add.circle(centerX, centerY, 18, 0x2c2738, 0.55)
      .setStrokeStyle(2, 0x82788f, 0.7)
      .setScrollFactor(0)
      .setDepth(depth);

    const magicX = this.scale.width - 105;
    const magicY = this.scale.height - 100;
    const magicButton = this.add.circle(magicX, magicY, 43, 0x264f74, 0.78)
      .setStrokeStyle(4, 0x8ee8ff, 1)
      .setScrollFactor(0)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true });

    this.add.text(magicX, magicY - 5, '✦', {
      fontFamily: 'Arial',
      fontSize: '38px',
      color: '#d9f8ff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);

    this.add.text(magicX, magicY + 31, 'RAYO', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);

    magicButton.on('pointerdown', () => {
      this.touchShootRequested = true;
      magicButton.setFillStyle(0x3f8ab9, 0.95);
    });

    const releaseMagic = (): void => {
      magicButton.setFillStyle(0x264f74, 0.78);
    };

    magicButton.on('pointerup', releaseMagic);
    magicButton.on('pointerout', releaseMagic);
    magicButton.on('pointerupoutside', releaseMagic);

    this.input.on('gameout', () => {
      this.touchDirections.left = false;
      this.touchDirections.right = false;
      this.touchDirections.up = false;
      this.touchDirections.down = false;
    });
  }

  private shootMagicRay(): void {
    const ray = this.add.rectangle(this.player.x, this.player.y, 18, 8, 0x8ee8ff)
      .setStrokeStyle(2, 0xffffff);
    this.physics.add.existing(ray);

    const body = ray.body as Phaser.Physics.Arcade.Body;
    const velocity = this.direction.clone().normalize().scale(430);
    body.setVelocity(velocity.x, velocity.y);

    this.time.delayedCall(900, () => ray.destroy());
  }

  private createVillageDecor(): void {
    const housePositions = [220, 460, 700, 940];

    housePositions.forEach((x, index) => {
      const y = index % 2 === 0 ? 170 : 550;
      this.add.rectangle(x, y, 120, 92, 0xc58b55).setStrokeStyle(4, 0x6e492e);
      this.add.triangle(x, y - 72, 0, 65, 60, 0, 120, 65, 0x8f4938).setOrigin(0.5);
      this.add.rectangle(x, y + 18, 28, 48, 0x5d3c25);
    });

    for (let x = 80; x < 1200; x += 95) {
      this.add.circle(x, 62, 24, 0x2f6b3d);
      this.add.circle(x, 660, 24, 0x2f6b3d);
    }
  }

  private createSigns(): void {
    this.createSign(180, 300, 'FLECHAS / CRUCETA\nMoverse');
    this.createSign(610, 300, 'ESPACIO / RAYO\nMagia');

    for (let i = 0; i < 3; i += 1) {
      const x = 760 + i * 70;
      this.add.circle(x, 430, 18, 0xd8d8d8).setStrokeStyle(4, 0x70402b);
      this.add.circle(x, 430, 7, 0xc33b3b);
    }
  }

  private createSign(x: number, y: number, label: string): void {
    this.add.rectangle(x, y, 150, 74, 0x805733).setStrokeStyle(3, 0x4e321f);
    this.add.rectangle(x, y + 62, 12, 55, 0x5d3c25);
    this.add.text(x, y, label, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  private createExitDoor(x: number, y: number): void {
    this.add.rectangle(x, y, 58, 94, 0x4c2f24).setStrokeStyle(5, 0xd6bd74);
    this.add.circle(x + 18, y + 4, 4, 0xf1d66a);
    this.add.text(x, y - 75, 'SALIDA AL MUNDO', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#ffffff',
      backgroundColor: '#00000099',
      padding: { x: 7, y: 4 }
    }).setOrigin(0.5);
  }
}
