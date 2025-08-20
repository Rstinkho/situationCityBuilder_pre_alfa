import GameModel from "../game/core/GameModel";
import { BUILDING_TYPES, BUILDING_SIZES, HOUSE_CAPACITY, TILE_SIZE, GOLD_PAYOUT_EVERY_MS, HOUSE_FULL_INCOME } from "../game/core/constants";
import EventBus from "../game/events/eventBus";
import * as Lumberyard from "./lumberyard";
import * as Farm from "./farm";
import * as Quarry from "./quarry";
import * as FishermanHut from "./fisherman_hut";

export function init(scene, grid, x, y) {
  const { w, h } = BUILDING_SIZES[BUILDING_TYPES.HOUSE];
  // Use image frames (mocked with rectangles plus frame change is complex without loader; use Image as texture)
  const rootX = x * TILE_SIZE + 1;
  const rootY = y * TILE_SIZE + 1;
  const rect = scene.add.image(rootX + (w * TILE_SIZE - 2) / 2, rootY + (h * TILE_SIZE - 2) / 2, "house_frame_1");
  rect.setDisplaySize(w * TILE_SIZE - 2, h * TILE_SIZE - 2);
  rect.setOrigin(0.5, 0.5);
  rect.setInteractive({ useHandCursor: true });

  // naive animation by swapping texture names if available
  const frames = ["house_frame_1", "house_frame_2", "house_frame_3"];
  let fi = 0;
  scene.time.addEvent({ delay: 500, loop: true, callback: () => { fi = (fi + 1) % frames.length; try { rect.setTexture(frames[fi]); } catch {} } });

  const root = grid[y][x];
  root.building = rect;
  root.buildingType = BUILDING_TYPES.HOUSE;
  root.root = root;
  root.capacity = HOUSE_CAPACITY;
  root.isUnderConstruction = false;
  root.width = w;
  root.height = h;
  root.occupants = 0;
  root.villagers = 0;
  root.professionCounts = { farmer: 0, forester: 0, miner: 0, fisherman: 0 };
  root.assigned = { villager: 0, farmer: 0, forester: 0, miner: 0, fisherman: 0 };
  root.employed = { villager: 0, farmer: 0, forester: 0, miner: 0, fisherman: 0 };
  root.incoming = 0;
  root.occupantDots = [];
  root.arrivalDots = [];

  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const cell = grid[y + dy][x + dx];
      cell.building = rect;
      cell.buildingType = BUILDING_TYPES.HOUSE;
      cell.root = root;
      cell.isUnderConstruction = false;
      if (cell !== root) {
        cell.capacity = 0;
        cell.villagers = 0;
        cell.occupants = 0;
      }
    }
  }

  rect.on("pointerdown", () => {
    if (root.isUnderConstruction) return;
    const payload = getClickPayload(root);
    EventBus.emit("open-building-ui", payload);
  });

  return rect;
}

export function loop(_scene, _cell, _dt) {}

export function getClickPayload(cell) {
  const incomePerInterval = cell.occupants === HOUSE_CAPACITY ? HOUSE_FULL_INCOME : 0;
  return {
    type: "house",
    built: true,
    occupants: cell.occupants,
    villagers: cell.villagers,
    farmers: cell.professionCounts?.farmer || 0,
    foresters: cell.professionCounts?.forester || 0,
    miners: cell.professionCounts?.miner || 0,
    fishermen: cell.professionCounts?.fisherman || 0,
    capacity: HOUSE_CAPACITY,
    incomePerInterval,
    incomeIntervalMs: GOLD_PAYOUT_EVERY_MS,
    rootX: cell.x,
    rootY: cell.y,
  };
}

export function addOccupantDot(scene, cell) {
  const root = cell.root || cell;
  if (!root.occupantDots) root.occupantDots = [];
  const idx = Math.max(0, Math.min(HOUSE_CAPACITY - 1, root.occupants - 1));
  const col = idx % 2;
  const row = Math.floor(idx / 2);
  const cx = root.x * TILE_SIZE + TILE_SIZE * (0.5 + col);
  const cy = root.y * TILE_SIZE + TILE_SIZE * (0.5 + row);
  const r = Math.max(3, Math.floor(TILE_SIZE / 6));
  const dot = scene.add.circle(cx, cy, r, 0x2ecc71, 1);
  root.occupantDots.push(dot);
}

export function spawnArrival(scene, root) {
  // Reserve capacity for in-flight arrival
  root.incoming = (root.incoming || 0) + 1;
  const startX = 1 * TILE_SIZE + TILE_SIZE / 2;
  const startY = 1 * TILE_SIZE + TILE_SIZE / 2;
  const r = Math.max(3, Math.floor(TILE_SIZE / 6));
  const mover = scene.add.circle(startX, startY, r, 0x2ecc71, 1);
  if (!root.arrivalDots) root.arrivalDots = [];
  root.arrivalDots.push(mover);

  const targetX = root.x * TILE_SIZE + (root.width * TILE_SIZE) / 2;
  const targetY = root.y * TILE_SIZE + (root.height * TILE_SIZE) / 2;
  scene.tweens.add({
    targets: mover,
    x: targetX,
    y: targetY,
    duration: 2200,
    ease: "Sine.easeInOut",
    onComplete: () => {
      // finalize arrival
      root.villagers += 1;
      root.occupants += 1;
      GameModel.population.current += 1;
      addOccupantDot(scene, root);
      // cleanup moving dot
      mover.destroy();
      const idx = root.arrivalDots.indexOf(mover);
      if (idx >= 0) root.arrivalDots.splice(idx, 1);
      root.incoming = Math.max(0, (root.incoming || 0) - 1);
    },
  });
}

export function remove(scene, cell) {
  const root = cell.root || cell;
  // Before removing visuals, unassign workers in buildings that reference this house as home
  const grid = GameModel.gridData;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const c = grid[y][x];
      if (!c || c.root !== c) continue;
      if (c.buildingType === BUILDING_TYPES.LUMBERYARD && c.data?.workers?.length) {
        const kept = [];
        for (const w of c.data.workers) {
          if (w.home && w.home.x === root.x && w.home.y === root.y) {
            // decrement employed for this house
            if (w.type === "villager") root.employed.villager = Math.max(0, (root.employed.villager || 0) - 1);
            if (w.type === "forester") root.employed.forester = Math.max(0, (root.employed.forester || 0) - 1);
            if (w.type === "miner") root.employed.miner = Math.max(0, (root.employed.miner || 0) - 1);
          } else {
            kept.push(w);
          }
        }
        if (kept.length !== c.data.workers.length) {
          c.data.workers = kept;
          Lumberyard.onWorkersChanged?.(scene, c);
        }
      }
      if (c.buildingType === BUILDING_TYPES.FARM && c.data?.workers?.length) {
        const kept = [];
        for (const w of c.data.workers) {
          if (w.home && w.home.x === root.x && w.home.y === root.y) {
            if (w.type === "villager") root.employed.villager = Math.max(0, (root.employed.villager || 0) - 1);
            if (w.type === "farmer") root.employed.farmer = Math.max(0, (root.employed.farmer || 0) - 1);
            if (w.type === "miner") root.employed.miner = Math.max(0, (root.employed.miner || 0) - 1);
          } else {
            kept.push(w);
          }
        }
        if (kept.length !== c.data.workers.length) {
          c.data.workers = kept;
          Farm.onWorkersChanged?.(scene, c);
        }
      }
      if (c.buildingType === BUILDING_TYPES.QUARRY && c.data?.workers?.length) {
        const kept = [];
        for (const w of c.data.workers) {
          if (w.home && w.home.x === root.x && w.home.y === root.y) {
            if (w.type === "villager") root.employed.villager = Math.max(0, (root.employed.villager || 0) - 1);
            if (w.type === "miner") root.employed.miner = Math.max(0, (root.employed.miner || 0) - 1);
          } else {
            kept.push(w);
          }
        }
        if (kept.length !== c.data.workers.length) {
          c.data.workers = kept;
          Quarry.onWorkersChanged?.(scene, c);
        }
      }
      if (c.buildingType === BUILDING_TYPES.FISHERMAN_HUT && c.data?.workers?.length) {
        const kept = [];
        for (const w of c.data.workers) {
          if (w.home && w.home.x === root.x && w.home.y === root.y) {
            if (w.type === "villager") root.employed.villager = Math.max(0, (root.employed.villager || 0) - 1);
            if (w.type === "fisherman") root.employed.fisherman = Math.max(0, (root.employed.fisherman || 0) - 1);
          } else {
            kept.push(w);
          }
        }
        if (kept.length !== c.data.workers.length) {
          c.data.workers = kept;
          FishermanHut.onWorkersChanged?.(scene, c);
        }
      }
    }
  }

  root.building?.destroy();
  if (root.occupantDots) {
    root.occupantDots.forEach((d) => d.destroy());
    root.occupantDots.length = 0;
  }
  if (root.arrivalDots) {
    root.arrivalDots.forEach((d) => d.destroy());
    root.arrivalDots.length = 0;
  }

  // Adjust global population and professions
  const removed = root.occupants || 0;
  GameModel.population.current = Math.max(0, GameModel.population.current - removed);
  if (root.professionCounts) {
    GameModel.professions.farmer = Math.max(0, GameModel.professions.farmer - (root.professionCounts.farmer || 0));
    GameModel.professions.forester = Math.max(0, GameModel.professions.forester - (root.professionCounts.forester || 0));
    GameModel.professions.miner = Math.max(0, GameModel.professions.miner - (root.professionCounts.miner || 0));
    GameModel.professions.fisherman = Math.max(0, GameModel.professions.fisherman - (root.professionCounts.fisherman || 0));
  }

  const { width = 1, height = 1 } = root;
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const c = grid[root.y + dy][root.x + dx];
      c.building = null;
      c.buildingType = null;
      c.root = null;
      c.capacity = 0;
      c.villagers = 0;
      c.occupants = 0;
      c.isUnderConstruction = false;
    }
  }
}