import * as Phaser from 'phaser';
import { type CharacterId } from '../gameData';

interface EmeraldSeaSceneData {
  characterId?: CharacterId;
}

const WORLD_WIDTH = 2880;
const WORLD_HEIGHT = 704;
const PLAYER_SIZE = 64;
const PLAYER_SPEED = 180;

const CHARACTER_ASSETS = {
  tiana: './assets/characters/tiana/walk-down/tiana-idle-down.png',
  lupe: './assets/characters/lupe/walk-down/lupe-idle-down.png'
} as const;

export class EmeraldSeaScene extends Phaser.Scene {
  private characterId: CharacterId = 'tiana';
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('EmeraldSeaScene');
  }

  init(data: EmeraldSeaSceneData): void {
    this.characterId = data.characterId ?? 'tiana';
  }

  preload(): void {
    this.load.image(
      'emerald-sea-player',
      CHARACTER_ASSETS[this.characterId === 'lupe' ? 'lupe' : 'tiana']
    );
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#2d8f86');

    const sea = this.add.graphics();
    sea.fillStyle(0x2d8f86, 1);
    sea.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    for (let y = 60; y < WORLD_HEIGHT; y += 72) {
      sea.lineStyle(3, 0x8ad6c8, 0.18);
      sea.beginPath();
      sea.moveTo(0, y);
      sea.lineTo(WORLD_WIDTH, y);
      sea.strokePath();
    }

    this.add.text(
      WORLD_WIDTH / 2,
      105,
      'EL MAR ESMERALDA',
      {
        fontFamily: 'Arial',
        fontSize: '42px',
        color: '#eafff9',
        fontStyle: 'bold',
        stroke: '#15534f',
        strokeThickness: 7
      }
    )
      .setOrigin(0.5)
      .setDepth(20);

    this.add.text(
      WORLD_WIDTH / 2,
      160,
      'NUEVO MUNDO · EN DESARROLLO',
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#d8fff7',
        backgroundColor: 'rgba(12, 63, 60, 0.55)',
        padding: { x: 10, y: 6 }
      }
    )
      .setOrigin(0.5)
      .setDepth(20);

    this.player = this.physics.add.sprite(
      160,
      WORLD_HEIGHT / 2,
      'emerald-sea-player'
    );

    this.player
      .setDisplaySize(PLAYER_SIZE, PLAYER_SIZE)
      .setDepth(50)
      .setCollideWorldBounds(true);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(28, 24).setOffset(18, 36);

    this.cursors = this.input.keyboard!.createCursorKeys();

    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(500, 20, 80, 72);
  }

  update(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    let x = 0;
    let y = 0;

    if (this.cursors.left.isDown) x -= 1;
    if (this.cursors.right.isDown) x += 1;
    if (this.cursors.up.isDown) y -= 1;
    if (this.cursors.down.isDown) y += 1;

    if (x === 0 && y === 0) return;

    const direction = new Phaser.Math.Vector2(x, y).normalize();
    body.setVelocity(
      direction.x * PLAYER_SPEED,
      direction.y * PLAYER_SPEED
    );
  }
}
