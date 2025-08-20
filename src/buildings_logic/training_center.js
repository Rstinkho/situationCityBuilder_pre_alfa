import GameModel from "../game/core/GameModel";
import { BUILDING_TYPES, BUILDING_SIZES, TILE_SIZE } from "../game/core/constants";
import EventBus from "../game/events/eventBus";

export function init(scene, grid, x, y) {
  const { w, h } = BUILDING_SIZES[BUILDING_TYPES.TRAINING_CENTER];
  const cx = x * TILE_SIZE + 1 + (w * TILE_SIZE - 2) / 2;
  const cy = y * TILE_SIZE + 1 + (h * TILE_SIZE - 2) / 2;
  const rect = scene.add.image(cx, cy, "training_frame_1");
  rect.setDisplaySize(w * TILE_SIZE - 2, h * TILE_SIZE - 2);
  rect.setOrigin(0.5, 0.5);
  rect.setInteractive({ useHandCursor: true });

  const frames = ["training_frame_1", "training_frame_2", "training_frame_3"];
  let fi = 0;
  scene.time.addEvent({ delay: 500, loop: true, callback: () => { fi = (fi + 1) % frames.length; try { rect.setTexture(frames[fi]); } catch {} } });

  const root = grid[y][x];
  root.building = rect;
  root.buildingType = BUILDING_TYPES.TRAINING_CENTER;
  root.root = root;
  root.isUnderConstruction = false;
  root.width = w;
  root.height = h;

  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const cell = grid[y + dy][x + dx];
      cell.building = rect;
      cell.buildingType = BUILDING_TYPES.TRAINING_CENTER;
      cell.root = root;
      cell.isUnderConstruction = false;
    }
  }

  rect.on("pointerdown", () => {
    if (root.isUnderConstruction) return;
    EventBus.emit("open-building-ui", getClickPayload(root));
  });

  return rect;
}

export function loop(_scene, _cell, _dt) {}

export function getClickPayload(cell) {
  return {
    type: "training_center",
    actions: [
      { key: "farmer", label: "Train Farmer" },
      { key: "forester", label: "Train Forester" },
      { key: "miner", label: "Train Miner" },
    ],
    availableVillagers: countAvailableVillagers(),
    rootX: cell.x,
    rootY: cell.y,
  };
}

function countAvailableVillagers() {
  const grid = GameModel.gridData || [];
  let available = 0;
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    if (!row) continue;
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c?.buildingType === BUILDING_TYPES.HOUSE && c.root === c) {
        const employed = (c.employed?.villager || 0);
        const free = Math.max(0, (c.villagers || 0) - employed);
        available += free;
      }
    }
  }
  return available;
}

export function remove(scene, cell) {
  const root = cell.root || cell;
  root.building?.destroy();
  const { width = 1, height = 1 } = root;
  const grid = GameModel.gridData;
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const c = grid[root.y + dy][root.x + dx];
      c.building = null;
      c.buildingType = null;
      c.root = null;
      c.isUnderConstruction = false;
    }
  }
}
