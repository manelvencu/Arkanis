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
const CHEST_MESSAGES = [
  'En este juego tendrás vistas cenitales y laterales, te puedes mover o saltar con las flechas del teclado o con el mando táctil',
  'Para defenderte, puedes lanzar rayos y hechizos con la barra espaciadora o el botón táctil',
  'Debes llegar a las ruinas de Arkanis como sea, pero cuidado porque tienes una energía limitada, cuídala'
] as const;

const ENVIRONMENT_ASSETS = {
  grass: './assets/environment/grass-tile-01.png',
  dirt: './assets/environment/dirt-ground-01.png',
  path: './assets/environment/dirt-path-tile-01.png',
  tree: './assets/environment/tree-large-01.png',
  bush: './assets/environment/bush-small-01.png',
  rock: './assets/environment/rock-small-01.png',
  cabin: './assets/environment/cabin-stone-thatch-01.png',
  chestClosed: './assets/environment/chest-closed-01.png',
  chestOpen: './assets/environment/chest-open-01.png',
  potIntact: './assets/environment/pot-intact-01.png',
  potBroken: './assets/environment/pot-broken-01.png',
  spikes: './assets/environment/spikes-01.png',
  coin: './assets/environment/coin-gold-01.png',
  barrier: './assets/environment/magic-barrier-01.png',
  hudFrame: './assets/environment/hud-frame.png',
  energyFrame: './assets/environment/energy-bar-frame.png',
  energyGold: './assets/environment/energy-bar-fill-gold.png',
  energyRed: './assets/environment/energy-bar-fill-red.png',
  messageFrame: './assets/environment/message-box-frame.png',
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
  private chestsRead = 0;
  private lastSpikeHitAt = -2000;
  private exitUnlocked = false;
  private isExiting = false;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private pots!: Phaser.Physics.Arcade.StaticGroup;
  private spikes!: Phaser.Physics.Arcade.StaticGroup;
  private coins!: Phaser.Physics.Arcade.StaticGroup;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private chests: Phaser.Physics.Arcade.Image[] = [];
  private barrier!: Phaser.Physics.Arcade.Image;
  private barrierCollider?: Phaser.Physics.Arcade.Collider;
  private energyGold!: Phaser.GameObjects.Image;
  private energyRed!: Phaser.GameObjects.Image;
  private coinCounter!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private messagePanel!: Phaser.GameObjects.Container;
  private messageText!: Phaser.GameObjects.Text;

  constructor() {
    super('TrainingScene');
  }

  init(data: TrainingData): void {
    this.characterId = data.characterId ?? 'tiana';
    this.energy = 100;
    this.coinsCollected = 0;
    this.potsDestroyed = 0;
    this.chestsRead = 0;
    this.lastSpikeHitAt = -2000;
    this.exitUnlocked = false;
    this.isExiting = false;
    this.chests = [];
  }

  preload(): void {
    Object.entries(ENVIRONMENT_ASSETS).forEach(([key, path]) => {
      this.load.image(`training-${key}`, path);
    });

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

    this.updateChestInteraction();
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
    this.createCabinsAndChests();
    this.createSpikeCourse();
    this.createPots();
    this.createExit();
  }

  private createNaturalBorders(): void {
    const trees = [
      [80, 100], [230, 90], [390, 90], [550, 90], [720, 85], [900, 90], [1360, 100],
      [85, 800], [250, 820], [430, 815], [610, 820], [800, 815], [990, 820], [1190, 820], [1360, 800],
      [75, 270], [70, 470], [75, 650], [1370, 280], [1370, 470], [1370, 650]
    ];
    trees.forEach(([x, y]) => this.addSolidImage(x, y, 'training-tree', 150, 176, 58, 50, 0, 52));

    const bushes = [[165, 170], [310, 165], [1010, 135], [1290, 185], [155, 705], [1100, 730], [1280, 690]];
    bushes.forEach(([x, y]) => this.addSolidImage(x, y, 'training-bush', 68, 48, 50, 24, 0, 10));

    const rocks = [[170, 300], [1250, 390], [250, 625], [1040, 650], [1300, 565], [460, 735]];
    rocks.forEach(([x, y]) => this.addSolidImage(x, y, 'training-rock', 52, 40, 42, 28, 0, 5));
  }

  private createCabinsAndChests(): void {
    [[370, 225], [700, 205], [995, 220]].forEach(([x, y]) => {
      this.addSolidImage(x, y, 'training-cabin', 270, 205, 220, 92, 0, 52);
    });

    [[370, 350], [700, 330], [995, 345]].forEach(([x, y], index) => {
      const chest = this.physics.add.staticImage(x, y, 'training-chestClosed')
        .setDisplaySize(54, 48)
        .setDepth(12);
      chest.refreshBody();
      (chest.body as Phaser.Physics.Arcade.StaticBody).setSize(48, 32).setOffset(3, 14);
      chest.setData('messageIndex', index);
      chest.setData('read', false);
      this.chests.push(chest);
      this.solids.add(chest);
    });
  }

  private createSpikeCourse(): void {
    const spikePositions = [
      [470, 660], [550, 660], [630, 660], [710, 660], [790, 660], [870, 660],
      [510, 735], [590, 735], [670, 735], [750, 735], [830, 735]
    ];
    spikePositions.forEach(([x, y]) => {
      const spike = this.spikes.create(x, y, 'training-spikes') as Phaser.Physics.Arcade.Image;
      spike.setDisplaySize(58, 48).setDepth(4).refreshBody();
      (spike.body as Phaser.Physics.Arcade.StaticBody).setSize(48, 30).setOffset(5, 12);
    });

    [[510, 620], [630, 705], [750, 620], [830, 705], [910, 620]].forEach(([x, y]) => {
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

  private updateChestInteraction(): void {
    let activeChest: Phaser.Physics.Arcade.Image | undefined;
    let activeDistance = Number.POSITIVE_INFINITY;

    this.chests.forEach((chest) => {
      const toChest = new Phaser.Math.Vector2(chest.x - this.player.x, chest.y - this.player.y);
      const distance = toChest.length();
      const isInFront = distance < 92 && toChest.normalize().dot(this.direction) > 0.15;
      if (isInFront && distance < activeDistance) {
        activeChest = chest;
        activeDistance = distance;
      }
    });

    if (!activeChest) {
      this.messagePanel.setVisible(false);
      return;
    }

    const messageIndex = activeChest.getData('messageIndex') as number;
    if (!activeChest.getData('read')) {
      activeChest.setData('read', true);
      activeChest.setTexture('training-chestOpen').setDisplaySize(54, 48).refreshBody();
      this.chestsRead += 1;
      this.updateHud();
      this.checkUnlock();
    }
    this.messageText.setText(CHEST_MESSAGES[messageIndex]);
    this.messagePanel.setVisible(true);
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
    if (this.exitUnlocked || this.chestsRead !== 3 || this.potsDestroyed !== 10) return;
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
      // TODO: sustituir este cierre por la escena del primer mundo cuando exista.
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
    const { width, height } = this.scale;
    const depth = 1000;

    this.add.rectangle(width / 2, 45, width - 24, 78, 0xf3e3b5, 0.97)
      .setStrokeStyle(1, 0x9f7732, 0.65)
      .setScrollFactor(0)
      .setDepth(depth - 1);

    this.add.image(width / 2, 45, 'training-hudFrame')
      .setDisplaySize(width - 20, 82)
      .setScrollFactor(0)
      .setDepth(depth);

    this.add.text(34, 24, characterName, {
      fontFamily: 'Arial', fontSize: '18px', color: '#2a1808', fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(depth + 3);

    this.energyGold = this.add.image(176, 58, 'training-energyGold')
      .setOrigin(0, 0.5).setDisplaySize(245, 20).setScrollFactor(0).setDepth(depth + 1);
    this.energyRed = this.add.image(176, 58, 'training-energyRed')
      .setOrigin(0, 0.5).setDisplaySize(245, 20).setScrollFactor(0).setDepth(depth + 1);
    this.add.image(298, 58, 'training-energyFrame')
      .setDisplaySize(264, 34).setScrollFactor(0).setDepth(depth + 2);

    this.add.image(width - 190, 44, 'training-coin')
      .setDisplaySize(25, 25).setScrollFactor(0).setDepth(depth + 2);
    this.coinCounter = this.add.text(width - 165, 44, '0', {
      fontFamily: 'Arial', fontSize: '20px', color: '#2a1808', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth + 3);

    const menu = this.add.image(width - 55, 44, 'training-menu')
      .setDisplaySize(42, 42).setScrollFactor(0).setDepth(depth + 3)
      .setInteractive({ useHandCursor: true });
    menu.on('pointerover', () => menu.setDisplaySize(45, 45));
    menu.on('pointerout', () => menu.setDisplaySize(42, 42));
    menu.on('pointerdown', () => {
      // TODO: abrir el menú de opciones cuando se implemente.
      this.cameras.main.flash(100, 245, 200, 95);
    });

    this.progressText = this.add.text(width / 2, 44, '', {
      fontFamily: 'Arial', fontSize: '15px', color: '#2a1808', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 3);

    const messageFrame = this.add.image(0, 0, 'training-messageFrame').setDisplaySize(820, 112);
    this.messageText = this.add.text(0, 0, '', {
      fontFamily: 'Arial', fontSize: '17px', color: '#17110b', align: 'center',
      wordWrap: { width: 735, useAdvancedWrap: true }
    }).setOrigin(0.5);
    this.messagePanel = this.add.container(width / 2, height - 66, [messageFrame, this.messageText])
      .setScrollFactor(0).setDepth(depth + 10).setVisible(false);
  }

  private updateHud(): void {
    const fillWidth = 245 * (this.energy / 100);
    this.energyGold.setDisplaySize(fillWidth, 20).setVisible(this.energy >= 30);
    this.energyRed.setDisplaySize(fillWidth, 20).setVisible(this.energy < 30);
    this.coinCounter.setText(String(this.coinsCollected));
    const exitState = this.exitUnlocked ? 'SALIDA ABIERTA' : 'SALIDA CERRADA';
    this.progressText.setText(`Cofres ${this.chestsRead}/3   Vasijas ${this.potsDestroyed}/10\n${exitState}`);
  }

  private shootMagicRay(): void {
    const shotDirection = this.direction.clone().normalize();
    const spawnPosition = new Phaser.Math.Vector2(this.player.x, this.player.y)
      .add(shotDirection.clone().scale(MAGIC_RAY_SPAWN_OFFSET));
    const ray = this.add.rectangle(spawnPosition.x, spawnPosition.y, 18, 8, 0x8ee8ff)
      .setStrokeStyle(2, 0xffffff)
      .setRotation(shotDirection.angle())
      .setDepth(45);
    this.physics.add.existing(ray);
    ray.setData('projectile', true);
    this.projectiles.add(ray);

    const body = ray.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
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
