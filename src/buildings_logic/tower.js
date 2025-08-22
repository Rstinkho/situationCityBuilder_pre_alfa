import GameModel from "../game/core/GameModel";
import { BUILDING_TYPES, BUILDING_SIZES, TILE_SIZE } from "../game/core/constants";
import EventBus from "../game/events/eventBus";

export function init(scene, grid, x, y) {
  const { w, h } = BUILDING_SIZES[BUILDING_TYPES.TOWER];
  const cx = x * TILE_SIZE + 1 + (w * TILE_SIZE - 2) / 2;
  const cy = y * TILE_SIZE + 1 + (h * TILE_SIZE - 2) / 2;
  const rect = scene.add.image(cx, cy, "tower_frame_1");
  rect.setDisplaySize(w * TILE_SIZE - 2, h * TILE_SIZE - 2);
  rect.setOrigin(0, 0.5); // Anchor to left center for 2-tile height
  rect.setInteractive({ useHandCursor: true });

  const frames = ["tower_frame_1", "tower_frame_2", "tower_frame_3"];
  let fi = 0;
  scene.time.addEvent({ delay: 500, loop: true, callback: () => { fi = (fi + 1) % frames.length; try { rect.setTexture(frames[fi]); } catch {} } });

  const root = grid[y][x];
  root.building = rect;
  root.buildingType = BUILDING_TYPES.TOWER;
  root.root = root;
  root.isUnderConstruction = false;
  root.width = w;
  root.height = h;
  root.data = {
    lastShotMs: 0,
    cooldownMs: 900,
    range: 120, // Attack range in pixels
    damage: 25,
    targetEnemy: null
  };

  // Mark all cells occupied by the tower
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const cell = grid[y + dy][x + dx];
      if (cell) {
        cell.building = rect;
        cell.buildingType = BUILDING_TYPES.TOWER;
        cell.root = root;
        cell.isUnderConstruction = false;
      }
    }
  }

  rect.on("pointerdown", () => {
    if (root.isUnderConstruction) return;
    EventBus.emit("open-building-ui", getClickPayload(root));
  });

  return rect;
}

export function getClickPayload(cell) {
  return {
    type: "tower",
    cell,
    data: cell.data
  };
}

export function canPlace(grid, x, y) {
  const { w, h } = BUILDING_SIZES[BUILDING_TYPES.TOWER];
  
  // Check if all required cells are available
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const cell = grid[y + dy]?.[x + dx];
      if (!cell || cell.building || cell.buildingType) {
        return false;
      }
    }
  }
  
  return true;
}
