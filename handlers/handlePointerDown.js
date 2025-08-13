import Grid from "../src/game/core/Grid";
import GameModel from "../src/game/core/GameModel";
import Pointer from "../src/game/core/Pointer";
import { BUILDING_TYPES } from "../src/game/core/constants";
import * as House from "../src/buildings_logic/house";
import * as TrainingCenter from "../src/buildings_logic/training_center";

export default function handlePointerDown(scene, pointer) {
  const { cx, cy } = Grid.worldToCell(pointer.worldX, pointer.worldY);
  const cell = GameModel.gridData[cy][cx];

  if (Pointer.selected) {
    if (!cell.building) {
      switch (Pointer.selected) {
        case BUILDING_TYPES.HOUSE:
          House.init(scene, cell, cx, cy);
          break;
        case BUILDING_TYPES.TRAINING_CENTER:
          TrainingCenter.init(scene, cell, cx, cy);
          break;
        default:
          break;
      }
    }
    Pointer.clear(scene);
    return;
  }

  if (cell.building && !cell.isUnderConstruction) {
    const payload =
      cell.buildingType === BUILDING_TYPES.HOUSE
        ? House.getClickPayload(cell)
        : cell.buildingType === BUILDING_TYPES.TRAINING_CENTER
        ? TrainingCenter.getClickPayload(cell)
        : null;

    if (payload) scene.reactCallback?.(payload);
  }
}
