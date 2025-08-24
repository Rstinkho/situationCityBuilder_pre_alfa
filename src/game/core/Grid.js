import { GRID_HEIGHT, GRID_WIDTH, TILE_SIZE, TILE_TYPES } from "./constants";

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
          tileType: TILE_TYPES.PLAINS,
        });
      }
      grid.push(row);
    }

    // Random tile patches removed for admin-driven assignment

    // Grid lines (now hideable)
    const gridLines = scene.add.graphics();
    gridLines.lineStyle(1, 0x3a3f45, 1);
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      gridLines.strokeLineShape({ x1: 0, y1: y * TILE_SIZE, x2: GRID_WIDTH * TILE_SIZE, y2: y * TILE_SIZE });
    }
    for (let x = 0; x <= GRID_WIDTH; x++) {
      gridLines.strokeLineShape({ x1: x * TILE_SIZE, y1: 0, x2: x * TILE_SIZE, y2: GRID_HEIGHT * TILE_SIZE });
    }
    gridLines.setVisible(false); // Hide grid lines by default
    scene.__gridLines__ = gridLines;

    // Tile overlay
    createTileTypeOverlay(scene, grid);

    return grid;
  },

  worldToCell(x, y) {
    return {
      cx: Math.max(0, Math.min(GRID_WIDTH - 1, Math.floor(x / TILE_SIZE))),
      cy: Math.max(0, Math.min(GRID_HEIGHT - 1, Math.floor(y / TILE_SIZE))),
    };
  },

  setTileOverlayVisible(scene, visible) {
    scene.__tileTypeOverlay__?.setVisible(visible);
  },

  setGridVisible(scene, visible) {
    // Control both grid lines and tile overlay
    scene.__gridLines__?.setVisible(visible);
    scene.__tileTypeOverlay__?.setVisible(visible);
  },

  redrawTileOverlay(scene, grid) {
    const g = scene.__tileTypeOverlay__;
    if (!g) return;
    g.clear();
    g.setAlpha(0.25);
    grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        let color = 0x000000;
        switch (cell.tileType) {
          case TILE_TYPES.WATER:
            color = 0x3366cc; break;
          case TILE_TYPES.FOREST:
            color = 0x228b22; break;
          case TILE_TYPES.MOUNTAIN:
            color = 0x888888; break;
          default:
            color = 0x000000; break;
        }
        if (color !== 0x000000) {
          g.fillStyle(color, 1);
          g.fillRect(x * TILE_SIZE + 1, y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        }
      });
    });
  },
};

// assignTilePatches removed

function createTileTypeOverlay(scene, grid) {
  const g = scene.add.graphics();
  g.setAlpha(0.25);
  grid.forEach((row, y) => {
    row.forEach((cell, x) => {
      let color = 0x000000;
      switch (cell.tileType) {
        case TILE_TYPES.WATER:
          color = 0x3366cc; break;
        case TILE_TYPES.FOREST:
          color = 0x228b22; break;
        case TILE_TYPES.MOUNTAIN:
          color = 0x888888; break;
        default:
          color = 0x000000; break;
      }
      if (color !== 0x000000) {
        g.fillStyle(color, 1);
        g.fillRect(x * TILE_SIZE + 1, y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }
    });
  });
  g.setVisible(false);
  scene.__tileTypeOverlay__ = g;
}

export default Grid;
