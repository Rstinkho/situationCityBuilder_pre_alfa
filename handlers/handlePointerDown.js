import Grid from "../src/game/core/Grid";
import GameModel from "../src/game/core/GameModel";
import Pointer from "../src/game/core/Pointer";
import { BUILDING_TYPES, BUILDING_SIZES } from "../src/game/core/constants";
import * as House from "../src/buildings_logic/house";
import * as TrainingCenter from "../src/buildings_logic/training_center";

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
        : null;

    if (payload) scene.reactCallback?.(payload);
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
