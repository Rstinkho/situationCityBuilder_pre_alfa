import GameModel from "../game/core/GameModel";
import { BUILDING_TYPES, BUILDING_SIZES, HOUSE_CAPACITY, TILE_SIZE, GOLD_PAYOUT_EVERY_MS, HOUSE_FULL_INCOME } from "../game/core/constants";
import EventBus from "../game/events/eventBus";

export function init(scene, grid, x, y) {
  const { w, h } = BUILDING_SIZES[BUILDING_TYPES.HOUSE];
  const rect = scene.add.rectangle(
    x * TILE_SIZE + 1,
    y * TILE_SIZE + 1,
    w * TILE_SIZE - 2,
    h * TILE_SIZE - 2,
    0x88bbff
  );
  rect.setOrigin(0, 0);
  rect.setInteractive({ useHandCursor: true });

  const root = grid[y][x];
  root.building = rect;
  root.buildingType = BUILDING_TYPES.HOUSE;
  root.root = root;
  root.capacity = HOUSE_CAPACITY;
  root.isUnderConstruction = false;
  root.width = w;
  root.height = h;
  root.occupants = 0;
  root.occupantDots = [];

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
    capacity: HOUSE_CAPACITY,
    incomePerInterval,
    incomeIntervalMs: GOLD_PAYOUT_EVERY_MS,
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

export function remove(scene, cell) {
  const root = cell.root || cell;
  root.building?.destroy();
  if (root.occupantDots) {
    root.occupantDots.forEach((d) => d.destroy());
    root.occupantDots.length = 0;
  }
  const { width = 1, height = 1 } = root;
  const grid = GameModel.gridData;
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
