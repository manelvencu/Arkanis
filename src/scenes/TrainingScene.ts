import * as Phaser from 'phaser';
import { characters, type CharacterId } from '../gameData';

interface TrainingData {
  characterId: CharacterId;
}

export class TrainingScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private direction = new Phaser.Math.Vector2(0, 1);
  private lastShotAt = 0;
  private characterId: CharacterId = 'tiana';

  constructor() {
    super('TrainingScene');
  }

  init(data: TrainingData): void {
    this.characterId = data.characterId ?? 'tiana';
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

    const textureKey = `player-${character.id}`;
    const playerGraphic = this.add.graphics();
    playerGraphic.fillStyle(character.placeholderColor, 1);
    playerGraphic.fillRoundedRect(0, 0, 30, 38, 6);
    playerGraphic.generateTexture(textureKey, 30, 38);
    playerGraphic.destroy();

    this.player = this.physics.add.sprite(95, worldHeight / 2, textureKey);
    this.player.setCollideWorldBounds(true);

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

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

    if (this.cursors.left.isDown) x -= 1;
    if (this.cursors.right.isDown) x += 1;
    if (this.cursors.up.isDown) y -= 1;
    if (this.cursors.down.isDown) y += 1;

    if (x !== 0 || y !== 0) {
      const movement = new Phaser.Math.Vector2(x, y).normalize();
      body.setVelocity(movement.x * speed, movement.y * speed);
      this.direction.copy(movement);
    }

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && time - this.lastShotAt > 250) {
      this.shootMagicRay();
      this.lastShotAt = time;
    }
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
    this.createSign(180, 300, 'FLECHAS\nMoverse');
    this.createSign(610, 300, 'ESPACIO\nRayo mágico');

    for (let i = 0; i < 3; i += 1) {
      const x = 760 + i * 70;
      this.add.circle(x, 430, 18, 0xd8d8d8).setStrokeStyle(4, 0x70402b);
      this.add.circle(x, 430, 7, 0xc33b3b);
    }
  }

  private createSign(x: number, y: number, label: string): void {
    this.add.rectangle(x, y, 130, 74, 0x805733).setStrokeStyle(3, 0x4e321f);
    this.add.rectangle(x, y + 62, 12, 55, 0x5d3c25);
    this.add.text(x, y, label, {
      fontFamily: 'Arial',
      fontSize: '16px',
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
