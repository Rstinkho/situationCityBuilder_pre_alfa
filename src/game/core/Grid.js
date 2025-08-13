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

    // Assign some tile type patches
    assignTilePatches(grid);

    // Grid lines
    const graphics = scene.add.graphics();
    graphics.lineStyle(1, 0x3a3f45, 1);
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      graphics.strokeLineShape({ x1: 0, y1: y * TILE_SIZE, x2: GRID_WIDTH * TILE_SIZE, y2: y * TILE_SIZE });
    }
    for (let x = 0; x <= GRID_WIDTH; x++) {
      graphics.strokeLineShape({ x1: x * TILE_SIZE, y1: 0, x2: x * TILE_SIZE, y2: GRID_HEIGHT * TILE_SIZE });
    }

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
};

function assignTilePatches(grid) {
  const height = grid.length;
  const width = grid[0].length;
  // Simple patches for WATER, FOREST, MOUNTAIN
  const patches = [
    { type: TILE_TYPES.FOREST, count: 4, radius: 5 },
    { type: TILE_TYPES.WATER, count: 2, radius: 6 },
    { type: TILE_TYPES.MOUNTAIN, count: 2, radius: 4 },
  ];
  patches.forEach(({ type, count, radius }) => {
    for (let i = 0; i < count; i++) {
      const cx = Math.floor(Math.random() * width);
      const cy = Math.floor(Math.random() * height);
      for (let y = Math.max(0, cy - radius); y <= Math.min(height - 1, cy + radius); y++) {
        for (let x = Math.max(0, cx - radius); x <= Math.min(width - 1, cx + radius); x++) {
          const dx = x - cx;
          const dy = y - cy;
          if (dx * dx + dy * dy <= radius * radius) {
            grid[y][x].tileType = type;
          }
        }
      }
    }
  });
}

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
