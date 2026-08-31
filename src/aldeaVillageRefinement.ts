import * as Phaser from 'phaser';
import { AldeaScene } from './scenes/AldeaScene';
import { getVillageProgress, takeNextNpcMessage, type VillageCabinKind } from './villageProgress';
import type { CharacterId } from './gameData';

type NpcKind = 'boy' | 'girl';
type NpcFacing = 'down' | 'up' | 'side';

type VillageNpc = {
  id: number;
  kind: NpcKind;
  sprite: Phaser.Physics.Arcade.Sprite;
  cabinIndex: number;
  destinationIndex: number;
  route: Phaser.Math.Vector2[];
  routeIndex: number;
  waitingUntil: number;
  stoppedByPlayer: boolean;
  hasDeliveredMessage: boolean;
  facing: NpcFacing;
};

type AldeaDataWithReturn = {
  characterId?: CharacterId;
  returnX?: number;
  returnY?: number;
};

type AldeaRuntime = Phaser.Scene & {
  player: Phaser.Physics.Arcade.Sprite;
  ui: {
    touchDirections: Record<'left' | 'right' | 'up' | 'down', boolean>;
    updateEnergy: (energy: number) => void;
    updateCoins: (coins: number) => void;
    ignoreWorldObject: (object: Phaser.GameObjects.GameObject) => void;
  };
  characterId: CharacterId;
  lastWalkablePosition: Phaser.Math.Vector2;
  exitStarted: boolean;
  __villageNpcs?: VillageNpc[];
  __villageDialogueOpen?: boolean;
  __villageCabinTransitioning?: boolean;
  __villageReturnPosition?: Phaser.Math.Vector2;
  __nextNpcExitAt?: number;
};

type AldeaPrototype = {
  __aldeaVillageRefinementInstalled?: boolean;
  init: (this: AldeaRuntime, data: AldeaDataWithReturn) => void;
  preload: (this: AldeaRuntime) => void;
  create: (this: AldeaRuntime) => void;
  update: (this: AldeaRuntime, time: number, delta: number) => void;
};

const NPC_SIZE = 64;
const NPC_SPEED = 62;
const MIN_INSIDE_MS = 5000;
const NPC_EXIT_GAP_MS = 9000;

const CABIN_DOORS = [
  new Phaser.Math.Vector2(144, 590),
  new Phaser.Math.Vector2(176, 334),
  new Phaser.Math.Vector2(368, 206),
  new Phaser.Math.Vector2(688, 622),
  new Phaser.Math.Vector2(816, 430)
] as const;

// Recorridos ortogonales que siguen los caminos dibujados en AldeaScene.
const CABIN_ROUTES: Phaser.Math.Vector2[][] = [
  [new Phaser.Math.Vector2(144, 610), new Phaser.Math.Vector2(144, 640), new Phaser.Math.Vector2(352, 640), new Phaser.Math.Vector2(352, 448)],
  [new Phaser.Math.Vector2(176, 350), new Phaser.Math.Vector2(176, 400), new Phaser.Math.Vector2(352, 400)],
  [new Phaser.Math.Vector2(368, 220), new Phaser.Math.Vector2(368, 224)],
  [new Phaser.Math.Vector2(688, 640), new Phaser.Math.Vector2(688, 672), new Phaser.Math.Vector2(560, 672), new Phaser.Math.Vector2(560, 448)],
  [new Phaser.Math.Vector2(816, 446), new Phaser.Math.Vector2(816, 432), new Phaser.Math.Vector2(672, 432), new Phaser.Math.Vector2(656, 432)]
];

const PLAZA_ENTRIES = [
  new Phaser.Math.Vector2(352, 432),
  new Phaser.Math.Vector2(352, 400),
  new Phaser.Math.Vector2(368, 240),
  new Phaser.Math.Vector2(560, 432),
  new Phaser.Math.Vector2(640, 432)
] as const;

const PLAZA_CENTER = new Phaser.Math.Vector2(496, 352);

const ENTERABLE_CABINS: Array<{ index: number; kind: VillageCabinKind }> = [
  { index: 0, kind: 'coins' },
  { index: 3, kind: 'wine' },
  { index: 4, kind: 'blessing' }
];

const NPC_ASSETS = {
  boy: {
    down: './assets/characters/npcs/npc-boy-explorer-idle-down.png',
    down1: './assets/characters/npcs/npc-boy-explorer-walk-down-01.png',
    down2: './assets/characters/npcs/npc-boy-explorer-walk-down-02.png',
    side: './assets/characters/npcs/npc-boy-explorer-idle-right.png',
    side1: './assets/characters/npcs/npc-boy-explorer-walk-right-01.png',
    side2: './assets/characters/npcs/npc-boy-explorer-walk-right-02.png',
    up: './assets/characters/npcs/npc-boy-explorer-idle-up.png',
    up1: './assets/characters/npcs/npc-boy-explorer-walk-up-01.png',
    up2: './assets/characters/npcs/npc-boy-explorer-walk-up-02.png'
  },
  girl: {
    down: './assets/characters/npcs/npc-girl-braids-idle-down.png',
    down1: './assets/characters/npcs/npc-girl-braids-walk-down-01.png',
    down2: './assets/characters/npcs/npc-girl-braids-walk-down-02.png',
    side: './assets/characters/npcs/npc-girl-braids-idle-right.png',
    side1: './assets/characters/npcs/npc-girl-braids-walk-right-01.png',
    side2: './assets/characters/npcs/npc-girl-braids-walk-right-02.png',
    up: './assets/characters/npcs/npc-girl-braids-idle-up.png',
    up1: './assets/characters/npcs/npc-girl-braids-walk-up-01.png',
    up2: './assets/characters/npcs/npc-girl-braids-walk-up-02.png'
  }
} as const;

function createNpcAnimations(scene: AldeaRuntime): void {
  (['boy', 'girl'] as NpcKind[]).forEach((kind) => {
    const create = (facing: NpcFacing, frames: string[], frameRate: number): void => {
      const key = `aldea-npc-${kind}-walk-${facing}`;
      if (scene.anims.exists(key)) scene.anims.remove(key);
      scene.anims.create({ key, frames: frames.map((frame) => ({ key: frame })), frameRate, repeat: -1 });
    };
    create('down', [`aldea-npc-${kind}-down1`, `aldea-npc-${kind}-down2`], 6);
    create('up', [`aldea-npc-${kind}-up1`, `aldea-npc-${kind}-up2`], 6);
    create('side', [`aldea-npc-${kind}-side1`, `aldea-npc-${kind}-side`, `aldea-npc-${kind}-side2`, `aldea-npc-${kind}-side`], 8);
  });
}

function createPlayerSideAnimation(scene: AldeaRuntime): void {
  if (scene.anims.exists('aldea-walk-side')) scene.anims.remove('aldea-walk-side');
  scene.anims.create({
    key: 'aldea-walk-side',
    frames: [
      { key: 'aldea-player-side1' },
      { key: 'aldea-player-side' },
      { key: 'aldea-player-side2' },
      { key: 'aldea-player-side' }
    ],
    frameRate: 8,
    repeat: -1
  });
}

function plazaRoute(source: Phaser.Math.Vector2, destination: Phaser.Math.Vector2): Phaser.Math.Vector2[] {
  return [
    source.clone(),
    new Phaser.Math.Vector2(source.x, PLAZA_CENTER.y),
    PLAZA_CENTER.clone(),
    new Phaser.Math.Vector2(destination.x, PLAZA_CENTER.y),
    destination.clone()
  ];
}

function routeBetween(source: number, destination: number): Phaser.Math.Vector2[] {
  const out = CABIN_ROUTES[source].map((point) => point.clone());
  const intoPlaza = plazaRoute(PLAZA_ENTRIES[source], PLAZA_ENTRIES[destination]);
  const back = CABIN_ROUTES[destination].slice().reverse().map((point) => point.clone());
  return [...out, ...intoPlaza, ...back, CABIN_DOORS[destination].clone()];
}

function chooseDestination(source: number): number {
  let destination = Phaser.Math.Between(0, CABIN_DOORS.length - 1);
  while (destination === source) destination = Phaser.Math.Between(0, CABIN_DOORS.length - 1);
  return destination;
}

function setNpcIdle(npc: VillageNpc): void {
  npc.sprite.anims.stop();
  npc.sprite.setTexture(`aldea-npc-${npc.kind}-${npc.facing === 'side' ? 'side' : npc.facing}`);
}

function startNpcJourney(npc: VillageNpc): void {
  npc.destinationIndex = chooseDestination(npc.cabinIndex);
  npc.route = routeBetween(npc.cabinIndex, npc.destinationIndex);
  npc.routeIndex = 0;
  npc.stoppedByPlayer = false;
  npc.sprite.setPosition(CABIN_DOORS[npc.cabinIndex].x, CABIN_DOORS[npc.cabinIndex].y);
  npc.sprite.setVisible(true).setActive(true);
}

function createVillageNpcs(scene: AldeaRuntime): void {
  createNpcAnimations(scene);
  const now = scene.time.now;
  const starts: Array<{ kind: NpcKind; cabinIndex: number }> = [
    { kind: 'girl', cabinIndex: 0 },
    { kind: 'boy', cabinIndex: 2 },
    { kind: 'girl', cabinIndex: 3 },
    { kind: 'boy', cabinIndex: 4 }
  ];

  scene.__nextNpcExitAt = now + 1500;
  scene.__villageNpcs = starts.map(({ kind, cabinIndex }, id): VillageNpc => {
    const sprite = scene.physics.add.sprite(CABIN_DOORS[cabinIndex].x, CABIN_DOORS[cabinIndex].y, `aldea-npc-${kind}-down`)
      .setDisplaySize(NPC_SIZE, NPC_SIZE)
      .setDepth(25)
      .setVisible(false)
      .setActive(false);
    (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).setSize(26, 22).setOffset(19, 38);
    return {
      id,
      kind,
      sprite,
      cabinIndex,
      destinationIndex: cabinIndex,
      route: [],
      routeIndex: 0,
      waitingUntil: now,
      stoppedByPlayer: false,
      hasDeliveredMessage: false,
      facing: 'down'
    };
  });
}

function showNpcMessage(scene: AldeaRuntime, npc: VillageNpc): void {
  if (npc.hasDeliveredMessage) return;
  const next = takeNextNpcMessage();
  if (!next) return;

  npc.hasDeliveredMessage = true;
  npc.stoppedByPlayer = true;
  scene.__villageDialogueOpen = true;
  setNpcIdle(npc);

  const center = scene.cameras.main.midPoint;
  const box = scene.add.rectangle(center.x, center.y + 135, 760, 170, 0x17100c, 0.97)
    .setStrokeStyle(4, 0xd6a84b, 1)
    .setDepth(500);
  const text = scene.add.text(center.x, center.y + 112, next.message, {
    fontFamily: 'Georgia, Times New Roman, serif',
    fontSize: '24px',
    color: '#fff0c7',
    align: 'center',
    wordWrap: { width: 700 }
  }).setOrigin(0.5).setDepth(501);
  const close = scene.add.text(center.x, center.y + 185, 'Pulsa ESPACIO, ENTER o toca para continuar', {
    fontFamily: 'Arial', fontSize: '16px', color: '#d6a84b'
  }).setOrigin(0.5).setDepth(501);

  const dismiss = (): void => {
    if (!box.active) return;
    box.destroy();
    text.destroy();
    close.destroy();
    scene.__villageDialogueOpen = false;
  };

  scene.input.once('pointerdown', dismiss);
  scene.input.keyboard?.once('keydown-SPACE', dismiss);
  scene.input.keyboard?.once('keydown-ENTER', dismiss);
}

function releaseNextNpcIfDue(scene: AldeaRuntime, time: number): void {
  if (time < (scene.__nextNpcExitAt ?? 0)) return;
  const waiting = (scene.__villageNpcs ?? []).find((npc) => !npc.sprite.active && time >= npc.waitingUntil);
  if (!waiting) return;
  startNpcJourney(waiting);
  scene.__nextNpcExitAt = time + NPC_EXIT_GAP_MS;
}

function updateVillageNpcs(scene: AldeaRuntime, time: number, delta: number): void {
  releaseNextNpcIfDue(scene, time);

  const npcs: VillageNpc[] = scene.__villageNpcs ?? [];
  let closest: VillageNpc | undefined;
  let closestDistance = Number.POSITIVE_INFINITY;

  npcs.forEach((npc) => {
    if (!npc.sprite.active) return;

    const distanceToPlayer = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, npc.sprite.x, npc.sprite.y);
    if (!npc.hasDeliveredMessage && distanceToPlayer < closestDistance) {
      closest = npc;
      closestDistance = distanceToPlayer;
    }

    if (npc.stoppedByPlayer) {
      if (!scene.__villageDialogueOpen && distanceToPlayer > 92) npc.stoppedByPlayer = false;
      else return;
    }

    const target = npc.route[npc.routeIndex];
    if (!target) {
      npc.cabinIndex = npc.destinationIndex;
      npc.sprite.setVisible(false).setActive(false);
      npc.waitingUntil = time + Phaser.Math.Between(MIN_INSIDE_MS, 11000);
      npc.route = [];
      return;
    }

    const dx = target.x - npc.sprite.x;
    const dy = target.y - npc.sprite.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 3) {
      npc.sprite.setPosition(target.x, target.y);
      npc.routeIndex += 1;
      return;
    }

    const step = Math.min(distance, NPC_SPEED * (delta / 1000));
    npc.sprite.x += (dx / distance) * step;
    npc.sprite.y += (dy / distance) * step;

    if (Math.abs(dx) > Math.abs(dy)) {
      npc.facing = 'side';
      npc.sprite.setFlipX(dx < 0);
    } else if (dy < 0) {
      npc.facing = 'up';
      npc.sprite.setFlipX(false);
    } else {
      npc.facing = 'down';
      npc.sprite.setFlipX(false);
    }
    npc.sprite.anims.play(`aldea-npc-${npc.kind}-walk-${npc.facing}`, true);
  });

  if (!closest || closestDistance > 68 || scene.__villageDialogueOpen) return;
  closest.stoppedByPlayer = true;
  setNpcIdle(closest);
  showNpcMessage(scene, closest);
}

function checkVillageCabinEntrance(scene: AldeaRuntime): void {
  if (scene.__villageCabinTransitioning || scene.__villageDialogueOpen || scene.exitStarted) return;
  const body = scene.player.body as Phaser.Physics.Arcade.Body;
  if (body.velocity.y >= -5) return;

  for (const cabin of ENTERABLE_CABINS) {
    const door = CABIN_DOORS[cabin.index];
    if (Phaser.Math.Distance.Between(scene.player.x, scene.player.y, door.x, door.y) > 46) continue;

    scene.__villageCabinTransitioning = true;
    body.setVelocity(0);
    scene.player.anims.stop();
    scene.cameras.main.fadeOut(260, 18, 12, 8);
    scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      scene.scene.start('VillageCabinScene', {
        characterId: scene.characterId,
        kind: cabin.kind,
        returnX: door.x,
        returnY: door.y + 58
      });
    });
    return;
  }
}

export function installAldeaVillageRefinement(): void {
  const prototype = AldeaScene.prototype as unknown as AldeaPrototype;
  if (prototype.__aldeaVillageRefinementInstalled) return;
  prototype.__aldeaVillageRefinementInstalled = true;

  const originalInit = prototype.init;
  const originalPreload = prototype.preload;
  const originalCreate = prototype.create;
  const originalUpdate = prototype.update;

  prototype.init = function initVillage(this: AldeaRuntime, data: AldeaDataWithReturn): void {
    originalInit.call(this, data);
    this.__villageDialogueOpen = false;
    this.__villageCabinTransitioning = false;
    this.__villageNpcs = [];
    this.__nextNpcExitAt = 0;
    this.__villageReturnPosition = data.returnX !== undefined && data.returnY !== undefined
      ? new Phaser.Math.Vector2(data.returnX, data.returnY)
      : undefined;
  };

  prototype.preload = function preloadVillage(this: AldeaRuntime): void {
    originalPreload.call(this);
    (['boy', 'girl'] as NpcKind[]).forEach((kind) => {
      Object.entries(NPC_ASSETS[kind]).forEach(([key, path]) => this.load.image(`aldea-npc-${kind}-${key}`, path));
    });
  };

  prototype.create = function createVillage(this: AldeaRuntime): void {
    originalCreate.call(this);
    createPlayerSideAnimation(this);
    createVillageNpcs(this);

    const progress = getVillageProgress();
    this.ui.updateEnergy(progress.energy);
    this.ui.updateCoins(progress.coins);

    if (this.__villageReturnPosition) {
      this.player.setPosition(this.__villageReturnPosition.x, this.__villageReturnPosition.y);
      this.lastWalkablePosition.copy(this.__villageReturnPosition);
    }
  };

  prototype.update = function updateVillage(this: AldeaRuntime, time: number, delta: number): void {
    if (this.__villageDialogueOpen) {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
      updateVillageNpcs(this, time, delta);
      return;
    }

    originalUpdate.call(this, time, delta);
    updateVillageNpcs(this, time, delta);
    checkVillageCabinEntrance(this);
  };
}
