import * as Phaser from 'phaser';
import { characters, type CharacterId } from '../gameData';

interface TrainingData {
  characterId: CharacterId;
}

type TouchDirection = 'left' | 'right' | 'up' | 'down';
type Facing = 'down' | 'up' | 'side';

const WORLD_WIDTH = 1440;
const WORLD_HEIGHT = 900;
const PLAYER_START = { x: 650, y: 455 };
const MAGIC_RAY_SPEED = 430;
const MAGIC_RAY_SPAWN_OFFSET = 36;
const MAGIC_RAY_LIFETIME = 900;

const ENVIRONMENT_ASSETS = {
  grass: './assets/environment/grass-tile-01.png',
  dirt: './assets/environment/dirt-ground-01.png',
  path: './assets/environment/dirt-path-tile-01.png',
  tree: './assets/environment/tree-large-01.png',
  bush: './assets/environment/bush-small-01.png',
  rock: './assets/environment/rock-small-01.png',
  cabin: './assets/environment/cabin-stone-thatch-01.png',
  potIntact: './assets/environment/pot-intact-01.png',
  potBroken: './assets/environment/pot-broken-01.png',
  spikes: './assets/environment/spikes-01.png',
  coin: './assets/environment/coin-gold-01.png',
  barrier: './assets/environment/magic-barrier-01.png',
  hudFrame: './assets/environment/hud-frame.png',
  energyFrame: './assets/environment/energy-bar-frame.png',
  energyGold: './assets/environment/energy-bar-fill-gold.png',
  energyRed: './assets/environment/energy-bar-fill-red.png',
  menu: './assets/environment/menu-icon-01.png'
} as const;

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
  private energy = 100;
  private coinsCollected = 0;
  private potsDestroyed = 0;
  private lastSpikeHitAt = -2000;
  private exitUnlocked = false;
  private isExiting = false;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private pots!: Phaser.Physics.Arcade.StaticGroup;
  private spikes!: Phaser.Physics.Arcade.StaticGroup;
  private coins!: Phaser.Physics.Arcade.StaticGroup;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private barrier!: Phaser.Physics.Arcade.Image;
  private barrierCollider?: Phaser.Physics.Arcade.Collider;
  private energyGold!: Phaser.GameObjects.Image;
  private energyRed!: Phaser.GameObjects.Image;
  private coinCounter!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;

  constructor() {
    super('TrainingScene');
  }

  init(data: TrainingData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.energy = 100;
    this.coinsCollected = 0;
    this.potsDestroyed = 0;
    this.lastSpikeHitAt = -2000;
    this.exitUnlocked = false;
    this.isExiting = false;
  }

  preload(): void {
    Object.entries(ENVIRONMENT_ASSETS).forEach(([key, path]) => {
      this.load.image(`training-${key}`, path);
    });
    this.load.image('training-magicRayGold', './assets/effects/magic-ray-gold-01.png');

    if (this.characterId === 'tiana') {
      this.load.spritesheet('tiana-game', './assets/tiana-spritesheet.png', {
        frameWidth: 48,
        frameHeight: 48
      });
    }
  }

  create(): void {
    const character = characters.find((item) => item.id === this.characterId) ?? characters[0];

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.createMap();
    this.createPlayer(character.placeholderColor);

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.pots);
    this.barrierCollider = this.physics.add.collider(this.player, this.barrier);
    this.physics.add.overlap(this.player, this.spikes, () => this.hitSpikes());
    this.physics.add.overlap(this.player, this.coins, (_player, coin) => {
      this.collectCoin(coin as Phaser.Physics.Arcade.Image);
    });
    this.physics.add.overlap(this.projectiles, this.pots, (projectile, pot) => {
      this.breakPot(projectile as Phaser.GameObjects.GameObject, pot as Phaser.Physics.Arcade.Image);
    });
    this.physics.add.collider(this.projectiles, this.solids, (projectile) => {
      projectile.destroy();
    });

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.addPointer(2);

    this.createHud(character.name);
    this.createTouchControls();
    this.updateHud();
  }

  update(time: number): void {
    if (this.isExiting) return;

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

      if (this.hasAnimatedCharacter() && !this.isCasting) {
        this.player.anims.play('tiana-walk-' + this.facing, true);
      }
    } else if (this.hasAnimatedCharacter() && !this.isCasting) {
      this.player.anims.stop();
      const idleFrame = this.facing === 'down' ? 0 : this.facing === 'side' ? 7 : 14;
      this.player.setFrame(idleFrame);
    }

    this.checkExit();

    const keyboardShot = Phaser.Input.Keyboard.JustDown(this.spaceKey);
    if ((keyboardShot || this.touchShootRequested) && time - this.lastShotAt > 250) {
      this.playCastAnimation();
      this.shootMagicRay();
      this.lastShotAt = time;
    }
    this.touchShootRequested = false;
  }

  private createMap(): void {
    this.add.tileSprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 'training-grass');
    this.add.tileSprite(680, 475, 1050, 620, 'training-dirt').setDepth(1);
    this.add.tileSprite(1160, 280, 150, 360, 'training-path').setDepth(2);

    this.solids = this.physics.add.staticGroup();
    this.pots = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.coins = this.physics.add.staticGroup();
    this.projectiles = this.physics.add.group({ allowGravity: false });

    this.createNaturalBorders();
    this.createCabins();
    this.createZigzagCourse();
    this.createPots();
    this.createExit();
  }

  private createNaturalBorders(): void {
    const trees = [
      [144, 144], [400, 144], [656, 144], [912, 144], [1168, 144]
    ];
    const treeDisplayHeight = 160;
    const treeBodyHeight = 40;
    trees.forEach(([supportX, supportY]) => {
      const visualCenterY = supportY - (treeDisplayHeight - treeBodyHeight) / 2;
      this.addSolidImage(
        supportX,
        visualCenterY,
        'training-tree',
        144,
        treeDisplayHeight,
        56,
        treeBodyHeight,
        0,
        treeDisplayHeight - treeBodyHeight
      );
    });

    const bushes = [[165, 170], [310, 165], [1010, 135], [1290, 185], [155, 705], [1100, 730], [1280, 690]];
    bushes.forEach(([x, y]) => this.addSolidImage(x, y, 'training-bush', 68, 48, 50, 24, 0, 10));

    const rocks = [[170, 300], [1250, 390], [250, 625], [1040, 650], [1300, 565], [460, 735]];
    rocks.forEach(([x, y]) => this.addSolidImage(x, y, 'training-rock', 52, 40, 42, 28, 0, 5));
  }

  private createCabins(): void {
    [[370, 225], [700, 205], [995, 220]].forEach(([x, y]) => {
      this.addSolidImage(x, y, 'training-cabin', 270, 205, 220, 92, 0, 52);
    });
  }

  private createZigzagCourse(): void {
    const spikePositions: Array<[number, number]> = [];

    for (let x = 350; x <= 850; x += 65) spikePositions.push([x, 655]);
    for (let x = 545; x <= 1035; x += 65) spikePositions.push([x, 735]);

    spikePositions.push(
      [325, 695], [325, 745],
      [1060, 650], [1060, 700],
      [1035, 785]
    );

    spikePositions.forEach(([x, y]) => {
      const spike = this.spikes.create(x, y, 'training-spikes') as Phaser.Physics.Arcade.Image;
      spike.setDisplaySize(58, 48).setDepth(4).refreshBody();
      (spike.body as Phaser.Physics.Arcade.StaticBody).setSize(48, 30).setOffset(5, 12);
    });

    const coinPath = [
      [360, 610], [470, 610], [580, 610], [690, 610], [800, 610], [920, 610],
      [985, 675],
      [920, 700], [810, 700], [700, 700], [590, 700], [470, 700],
      [410, 765],
      [520, 785], [650, 785], [780, 785], [910, 785]
    ];

    coinPath.forEach(([x, y]) => {
      const coin = this.coins.create(x, y, 'training-coin') as Phaser.Physics.Arcade.Image;
      coin.setDisplaySize(23, 23).setDepth(10).refreshBody();
      this.tweens.add({ targets: coin, y: y - 5, duration: 800, yoyo: true, repeat: -1 });
    });
  }

  private createPots(): void {
    const positions = [
      [250, 410], [420, 480], [590, 405], [780, 485], [940, 420],
      [1080, 520], [300, 570], [965, 590], [1140, 690], [1210, 335]
    ];
    positions.forEach(([x, y], index) => {
      const pot = this.pots.create(x, y, 'training-potIntact') as Phaser.Physics.Arcade.Image;
      pot.setDisplaySize(44, 47).setDepth(11).refreshBody();
      (pot.body as Phaser.Physics.Arcade.StaticBody).setSize(36, 39).setOffset(4, 8);
      pot.setData('broken', false);
      pot.setData('potIndex', index);
    });
  }

  private createExit(): void {
    this.barrier = this.physics.add.staticImage(1160, 150, 'training-barrier')
      .setDisplaySize(125, 105)
      .setDepth(8);
    this.barrier.refreshBody();
    (this.barrier.body as Phaser.Physics.Arcade.StaticBody).setSize(110, 48).setOffset(7, 36);
  }

  private addSolidImage(
    x: number,
    y: number,
    key: string,
    displayWidth: number,
    displayHeight: number,
    bodyWidth: number,
    bodyHeight: number,
    bodyOffsetX: number,
    bodyOffsetY: number
  ): Phaser.Physics.Arcade.Image {
    const image = this.physics.add.staticImage(x, y, key).setDisplaySize(displayWidth, displayHeight).setDepth(9);
    image.refreshBody();
    (image.body as Phaser.Physics.Arcade.StaticBody)
      .setSize(bodyWidth, bodyHeight)
      .setOffset((displayWidth - bodyWidth) / 2 + bodyOffsetX, bodyOffsetY);
    this.solids.add(image);
    return image;
  }

  private createPlayer(placeholderColor: number): void {
    if (this.hasAnimatedCharacter()) {
      this.createTianaAnimations();
      this.player = this.physics.add.sprite(PLAYER_START.x, PLAYER_START.y, 'tiana-game', 0);
      this.player.setDisplaySize(68, 68);
    } else {
      const textureKey = `player-${this.characterId}`;
      const playerGraphic = this.add.graphics();
      playerGraphic.fillStyle(placeholderColor, 1);
      playerGraphic.fillRoundedRect(0, 0, 38, 48, 7);
      playerGraphic.generateTexture(textureKey, 38, 48);
      playerGraphic.destroy();
      this.player = this.physics.add.sprite(PLAYER_START.x, PLAYER_START.y, textureKey);
      this.player.setDisplaySize(48, 60);
    }
    this.player.setCollideWorldBounds(true).setDepth(50);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(30, 28).setOffset(9, 28);
  }

  private breakPot(projectile: Phaser.GameObjects.GameObject, pot: Phaser.Physics.Arcade.Image): void {
    projectile.destroy();
    if (pot.getData('broken')) return;

    pot.setData('broken', true);
    pot.disableBody(true, false);
    pot.setTexture('training-potBroken').setDisplaySize(47, 39).setVisible(true);
    this.potsDestroyed += 1;
    this.updateHud();
    this.checkUnlock();
    this.time.delayedCall(350, () => pot.destroy());
  }

  private hitSpikes(): void {
    const now = this.time.now;
    if (now - this.lastSpikeHitAt < 1200 || this.isExiting) return;
    this.lastSpikeHitAt = now;
    this.energy = Math.max(0, this.energy - 20);
    this.cameras.main.shake(180, 0.007);
    this.player.setTint(0xff5544);
    this.time.delayedCall(180, () => this.player.clearTint());

    if (this.energy === 0) {
      this.player.setPosition(PLAYER_START.x, PLAYER_START.y);
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
      this.energy = 100;
      this.cameras.main.flash(350, 120, 20, 20);
    }
    this.updateHud();
  }

  private collectCoin(coin: Phaser.Physics.Arcade.Image): void {
    if (!coin.active) return;
    coin.disableBody(true, true);
    this.coinsCollected += 1;
    this.updateHud();
  }

  private checkUnlock(): void {
    if (this.exitUnlocked || this.potsDestroyed !== 10) return;
    this.exitUnlocked = true;
    this.barrierCollider?.destroy();
    (this.barrier.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.tweens.add({
      targets: this.barrier,
      alpha: 0.25,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.updateHud();
  }

  private checkExit(): void {
    if (!this.exitUnlocked || this.isExiting) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const insidePortal = Phaser.Geom.Rectangle.Contains(
      new Phaser.Geom.Rectangle(this.barrier.x - 60, this.barrier.y - 48, 120, 96),
      this.player.x,
      this.player.y
    );
    if (!insidePortal || body.velocity.y >= 0) return;

    this.isExiting = true;
    body.setVelocity(0);
    this.player.anims.stop();
    this.cameras.main.fadeOut(700, 8, 7, 17);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.physics.pause();
      this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x080711)
        .setScrollFactor(0)
        .setDepth(2000);
      this.add.text(this.scale.width / 2, this.scale.height / 2, 'Entrenamiento completado\nPróximamente: las ruinas de Arkanis', {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '28px',
        color: '#f4c85f',
        align: 'center'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);
      this.cameras.main.fadeIn(500, 8, 7, 17);
    });
  }

  private createHud(characterName: string): void {
    const { width } = this.scale;
    const depth = 1000;

    this.add.image(width / 2, 45, 'training-hudFrame')
      .setDisplaySize(width - 20, 82)
      .setScrollFactor(0)
      .setDepth(depth);

    this.add.text(185, 44, characterName, {
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: '19px',
      color: '#2a1808',
      fontStyle: 'bold',
      stroke: '#f4e0a8',
      strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 5);

    this.energyGold = this.add.image(85, 105, 'training-energyGold')
      .setOrigin(0, 0.5).setDisplaySize(210, 12).setScrollFactor(0).setDepth(depth + 3);
    this.energyRed = this.add.image(85, 105, 'training-energyRed')
      .setOrigin(0, 0.5).setDisplaySize(210, 12).setScrollFactor(0).setDepth(depth + 3);
    this.add.image(190, 105, 'training-energyFrame')
      .setDisplaySize(264, 34).setScrollFactor(0).setDepth(depth + 4);

    this.add.image(width - 190, 41, 'training-coin')
      .setDisplaySize(25, 25).setScrollFactor(0).setDepth(depth + 4);
    this.coinCounter = this.add.text(width - 165, 41, '0', {
      fontFamily: 'Arial', fontSize: '20px', color: '#2a1808', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth + 5);

    const menu = this.add.image(width - 80, 44, 'training-menu')
      .setDisplaySize(40, 40).setScrollFactor(0).setDepth(depth + 5)
      .setInteractive({ useHandCursor: true });
    menu.on('pointerover', () => menu.setDisplaySize(43, 43));
    menu.on('pointerout', () => menu.setDisplaySize(40, 40));
    menu.on('pointerdown', () => {
      this.cameras.main.flash(100, 245, 200, 95);
    });

    this.progressText = this.add.text(width / 2, 44, '', {
      fontFamily: 'Arial', fontSize: '15px', color: '#2a1808', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 4);
  }

  private updateHud(): void {
    const fillWidth = 210 * (this.energy / 100);
    this.energyGold.setDisplaySize(fillWidth, 12).setVisible(this.energy >= 30);
    this.energyRed.setDisplaySize(fillWidth, 12).setVisible(this.energy < 30);
    this.coinCounter.setText(String(this.coinsCollected));
    this.progressText.setText(`Vasijas ${this.potsDestroyed}/10`);
  }

  private shootMagicRay(): void {
    const shotDirection = this.direction.clone().normalize();
    const spawnPosition = new Phaser.Math.Vector2(this.player.x, this.player.y)
      .add(shotDirection.clone().scale(MAGIC_RAY_SPAWN_OFFSET));
    const ray = this.physics.add.image(spawnPosition.x, spawnPosition.y, 'training-magicRayGold')
      .setDisplaySize(64, 24)
      .setRotation(shotDirection.angle())
      .setDepth(60);
    ray.setData('projectile', true);
    this.projectiles.add(ray);

    const body = ray.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(22, 22, true);
    body.setVelocity(shotDirection.x * MAGIC_RAY_SPEED, shotDirection.y * MAGIC_RAY_SPEED);

    this.time.delayedCall(MAGIC_RAY_LIFETIME, () => {
      if (ray.active) ray.destroy();
    });
  }

  private hasAnimatedCharacter(): boolean {
    return this.characterId === 'tiana';
  }

  private createTianaAnimations(): void {
    const create = (key: string, frames: number[], frameRate: number, repeat: number): void => {
      if (this.anims.exists(key)) return;
      this.anims.create({
        key,
        frames: frames.map((frame) => ({ key: 'tiana-game', frame })),
        frameRate,
        repeat
      });
    };

    create('tiana-walk-down', [1, 2, 3, 2], 9, -1);
    create('tiana-walk-side', [8, 9, 10, 9], 9, -1);
    create('tiana-walk-up', [15, 16, 17, 16], 9, -1);
    create('tiana-cast-down', [4, 5, 6], 14, 0);
    create('tiana-cast-side', [7, 8, 7], 14, 0);
    create('tiana-cast-up', [14, 15, 14], 14, 0);
  }

  private playCastAnimation(): void {
    if (!this.hasAnimatedCharacter()) return;
    this.isCasting = true;
    this.player.anims.play(`tiana-cast-${this.facing}`, true);
    this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.isCasting = false;
    });
  }

  private createTouchControls(): void {
    const depth = 1200;
    const alpha = 0.68;
    const centerX = 112;
    const centerY = this.scale.height - 108;
    const spacing = 56;

    const createDirectionButton = (x: number, y: number, label: string, direction: TouchDirection): void => {
      const button = this.add.circle(x, y, 25, 0x171421, alpha)
        .setStrokeStyle(3, 0xf1d16a, 0.9).setScrollFactor(0).setDepth(depth)
        .setInteractive({ useHandCursor: true });
      this.add.text(x, y, label, {
        fontFamily: 'Arial', fontSize: '25px', color: '#fff1ad', fontStyle: 'bold'
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

    const magicX = this.scale.width - 105;
    const magicY = this.scale.height - 105;
    const magicButton = this.add.circle(magicX, magicY, 43, 0x264f74, 0.78)
      .setStrokeStyle(4, 0x8ee8ff, 1).setScrollFactor(0).setDepth(depth)
      .setInteractive({ useHandCursor: true });
    this.add.text(magicX, magicY - 5, '✦', {
      fontFamily: 'Arial', fontSize: '38px', color: '#d9f8ff', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    this.add.text(magicX, magicY + 31, 'RAYO', {
      fontFamily: 'Arial', fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
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
      Object.keys(this.touchDirections).forEach((key) => {
        this.touchDirections[key as TouchDirection] = false;
      });
    });
  }
}
