import Grid from "../src/game/core/Grid";
import GameModel from "../src/game/core/GameModel";
import Pointer from "../src/game/core/Pointer";
import { BUILDING_TYPES, BUILDING_SIZES, TILE_TYPES, LUMBERYARD_NEARBY_RADIUS } from "../src/game/core/constants";
import * as House from "../src/buildings_logic/house";
import * as TrainingCenter from "../src/buildings_logic/training_center";
import * as Lumberyard from "../src/buildings_logic/lumberyard";
import * as Farm from "../src/buildings_logic/farm";
import EventBus from "../src/game/events/eventBus";

export default function handlePointerDown(scene, pointer) {
  const { cx, cy } = Grid.worldToCell(pointer.worldX, pointer.worldY);
  const grid = GameModel.gridData;
  const cell = grid[cy][cx];

  if (Pointer.selected) {
    const { w, h } = BUILDING_SIZES[Pointer.selected];
    if (canPlace(grid, cx, cy, w, h)) {
      switch (Pointer.selected) {
        case BUILDING_TYPES.HOUSE:
          House.init(scene, grid, cx, cy);
          break;
        case BUILDING_TYPES.TRAINING_CENTER:
          TrainingCenter.init(scene, grid, cx, cy);
          break;
        case BUILDING_TYPES.LUMBERYARD:
          if (isNearTileType(grid, cx, cy, w, h, TILE_TYPES.FOREST, LUMBERYARD_NEARBY_RADIUS)) {
            Lumberyard.init(scene, grid, cx, cy);
          }
          break;
        case BUILDING_TYPES.FARM:
          Farm.init(scene, grid, cx, cy);
          break;
        default:
          break;
      }
    }
    Pointer.clear(scene);
    return;
  }

  const target = cell.root || cell;
  if (target.building && !target.isUnderConstruction) {
    const payload =
      target.buildingType === BUILDING_TYPES.HOUSE
        ? House.getClickPayload(target)
        : target.buildingType === BUILDING_TYPES.TRAINING_CENTER
        ? TrainingCenter.getClickPayload(target)
        : target.buildingType === BUILDING_TYPES.LUMBERYARD
        ? Lumberyard.getClickPayload(target)
        : target.buildingType === BUILDING_TYPES.FARM
        ? Farm.getClickPayload(target)
        : null;

    if (payload) EventBus.emit("open-building-ui", payload);
  }
}

function canPlace(grid, cx, cy, w, h) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const row = grid[cy + dy];
      const cell = row?.[cx + dx];
      if (!cell || cell.building) return false;
    }
  }
  return true;
}

function isNearTileType(grid, cx, cy, w, h, tileType, radius) {
  const minX = Math.max(0, cx - radius);
  const maxX = Math.min(grid[0].length - 1, cx + w - 1 + radius);
  const minY = Math.max(0, cy - radius);
  const maxY = Math.min(grid.length - 1, cy + h - 1 + radius);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (grid[y][x].tileType === tileType) return true;
    }
  }
  return false;
}
