import { GRID_HEIGHT, GRID_WIDTH, TILE_SIZE } from "./constants";

const Grid = {
  createGrid(scene) {
    const grid = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      const row = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        row.push({
          x, y,
          building: null,
          buildingType: null,
          villagers: 0,
          occupants: 0,
          capacity: 0,
          isUnderConstruction: false,
          data: {},
        });
      }
      grid.push(row);
    }
    const graphics = scene.add.graphics();
    graphics.lineStyle(1, 0x3a3f45, 1);
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      graphics.strokeLineShape({ x1: 0, y1: y * TILE_SIZE, x2: GRID_WIDTH * TILE_SIZE, y2: y * TILE_SIZE });
    }
    for (let x = 0; x <= GRID_WIDTH; x++) {
      graphics.strokeLineShape({ x1: x * TILE_SIZE, y1: 0, x2: x * TILE_SIZE, y2: GRID_HEIGHT * TILE_SIZE });
    }

    return grid;
  },

  worldToCell(x, y) {
    return {
      cx: Math.max(0, Math.min(GRID_WIDTH - 1, Math.floor(x / TILE_SIZE))),
      cy: Math.max(0, Math.min(GRID_HEIGHT - 1, Math.floor(y / TILE_SIZE))),
    };
  },
};

export default Grid;
