import { HOUSE_CAPACITY, TILE_SIZE } from "../game/core/constants";

export function init(scene, cell, x, y) {
  const rect = scene.add.rectangle(x * TILE_SIZE + 1, y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2, 0x88bbff);
  rect.setOrigin(0, 0);
  rect.setInteractive({ useHandCursor: true });

  cell.building = rect;
  cell.buildingType = "house";
  cell.capacity = HOUSE_CAPACITY;
  cell.isUnderConstruction = false;

  rect.on("pointerdown", () => {
    if (cell.isUnderConstruction) return;
    const payload = getClickPayload(cell);
    scene.reactCallback?.(payload);
  });

  return rect;
}

export function loop(_scene, _cell, _dt) {}

export function getClickPayload(cell) {
  const income = cell.villagers === HOUSE_CAPACITY ? 0.1 : 0;
  return {
    type: "house",
    built: true,
    villagers: cell.villagers,
    capacity: HOUSE_CAPACITY,
    income,
  };
}

export function remove(scene, cell) {
  cell.building?.destroy();
  cell.building = null;
  cell.buildingType = null;
  cell.capacity = 0;
}
