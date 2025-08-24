import Grid from "../src/game/core/Grid";
import GameModel from "../src/game/core/GameModel";
import Pointer from "../src/game/core/Pointer";
import {
  BUILDING_TYPES,
  BUILDING_SIZES,
  TILE_TYPES,
  LUMBERYARD_NEARBY_RADIUS,
  BUILDING_COSTS,
} from "../src/game/core/constants";
import * as House from "../src/buildings_logic/house";
import * as TrainingCenter from "../src/buildings_logic/training_center";
import * as Lumberyard from "../src/buildings_logic/lumberyard";
import * as Farm from "../src/buildings_logic/farm";
import * as Quarry from "../src/buildings_logic/quarry";
import * as FishermanHut from "../src/buildings_logic/fisherman_hut";
import * as Warehouse from "../src/buildings_logic/warehouse";
import * as Tower from "../src/buildings_logic/tower";
import EventBus from "../src/game/events/eventBus";

export default function handlePointerDown(scene, pointer) {
  const { cx, cy } = Grid.worldToCell(pointer.worldX, pointer.worldY);
  const grid = GameModel.gridData;
  const cell = grid[cy][cx];

  if (Pointer.selected) {
    const { w, h } = BUILDING_SIZES[Pointer.selected];
    const cost = BUILDING_COSTS[Pointer.selected] || 0;
    if (GameModel.gold < cost) {
      Pointer.clear(scene);
      return;
    }

    if (canPlaceOnPlains(grid, cx, cy, w, h) && canPlace(grid, cx, cy, w, h)) {
      switch (Pointer.selected) {
        case BUILDING_TYPES.HOUSE:
          GameModel.gold -= cost;
          House.init(scene, grid, cx, cy);
          break;
        case BUILDING_TYPES.TRAINING_CENTER:
          GameModel.gold -= cost;
          TrainingCenter.init(scene, grid, cx, cy);
          break;
        case BUILDING_TYPES.LUMBERYARD:
          if (isAdjacentToTileType(grid, cx, cy, w, h, TILE_TYPES.FOREST)) {
            GameModel.gold -= cost;
            Lumberyard.init(scene, grid, cx, cy);
          }
          break;
        case BUILDING_TYPES.QUARRY:
          if (isAdjacentToTileType(grid, cx, cy, w, h, TILE_TYPES.MOUNTAIN)) {
            GameModel.gold -= cost;
            Quarry.init(scene, grid, cx, cy);
          }
          break;
        case BUILDING_TYPES.FISHERMAN_HUT:
          if (isAdjacentToTileType(grid, cx, cy, w, h, TILE_TYPES.WATER)) {
            GameModel.gold -= cost;
            FishermanHut.init(scene, grid, cx, cy);
          }
          break;
        case BUILDING_TYPES.FARM:
          GameModel.gold -= cost;
          Farm.init(scene, grid, cx, cy);
          break;
        case BUILDING_TYPES.WAREHOUSE:
          GameModel.gold -= cost;
          Warehouse.init(scene, grid, cx, cy);
          break;
        default:
          break;
      }
    }

    // Emit building completed event
    EventBus.emit("building-completed", Pointer.selected);

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
        : target.buildingType === BUILDING_TYPES.QUARRY
        ? Quarry.getClickPayload(target)
        : target.buildingType === BUILDING_TYPES.FISHERMAN_HUT
        ? FishermanHut.getClickPayload(target)
        : target.buildingType === BUILDING_TYPES.FARM
        ? Farm.getClickPayload(target)
        : target.buildingType === BUILDING_TYPES.TOWER
        ? Tower.getClickPayload(target)
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

function canPlaceOnPlains(grid, cx, cy, w, h) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const row = grid[cy + dy];
      const cell = row?.[cx + dx];
      if (!cell) return false;
      if (cell.tileType !== TILE_TYPES.PLAINS) return false; // disallow building ON water/forest/mountain
    }
  }
  return true;
}

function isAdjacentToTileType(grid, cx, cy, w, h, tileType) {
  // Check any 4-neighbor around the rectangle perimeter is of the tileType
  // top and bottom edges
  for (let x = cx; x < cx + w; x++) {
    const top = grid[cy - 1]?.[x];
    const bottom = grid[cy + h]?.[x];
    if (top?.tileType === tileType) return true;
    if (bottom?.tileType === tileType) return true;
  }
  // left and right edges
  for (let y = cy; y < cy + h; y++) {
    const left = grid[y]?.[cx - 1];
    const right = grid[y]?.[cx + w];
    if (left?.tileType === tileType) return true;
    if (right?.tileType === tileType) return true;
  }
  return false;
}
