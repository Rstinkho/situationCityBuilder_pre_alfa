import GameModel from "../game/core/GameModel";
import { BUILDING_TYPES, BUILDING_SIZES, TILE_SIZE } from "../game/core/constants";
import EventBus from "../game/events/eventBus";

export function init(scene, grid, x, y) {
  const { w, h } = BUILDING_SIZES[BUILDING_TYPES.TRAINING_CENTER];
  const rect = scene.add.rectangle(
    x * TILE_SIZE + 1,
    y * TILE_SIZE + 1,
    w * TILE_SIZE - 2,
    h * TILE_SIZE - 2,
    0xffd37a
  );
  rect.setOrigin(0, 0);
  rect.setInteractive({ useHandCursor: true });

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

export function getClickPayload(_cell) {
  return {
    type: "training_center",
    actions: [
      { key: "farmer", label: "Train Farmer" },
      { key: "forester", label: "Train Forester" },
    ],
  };
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
