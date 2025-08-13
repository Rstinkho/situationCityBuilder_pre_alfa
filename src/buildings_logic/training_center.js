import { TILE_SIZE } from "../game/core/constants";
import EventBus from "../game/events/eventBus";

export function init(scene, cell, x, y) {
  const rect = scene.add.rectangle(x * TILE_SIZE + 1, y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2, 0xffd37a);
  rect.setOrigin(0, 0);
  rect.setInteractive({ useHandCursor: true });

  cell.building = rect;
  cell.buildingType = "training_center";
  cell.isUnderConstruction = false;

  rect.on("pointerdown", () => {
    if (cell.isUnderConstruction) return;
    EventBus.emit("open-building-ui", getClickPayload(cell));
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
  cell.building?.destroy();
  cell.building = null;
  cell.buildingType = null;
}
