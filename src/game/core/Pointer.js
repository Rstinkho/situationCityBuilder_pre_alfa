import { BUILDING_TYPES, BUILDING_SIZES, TILE_SIZE, TILE_TYPES } from "./constants";
import GameModel from "./GameModel";

const Pointer = {
  selected: null,
  preview: null,
  fieldPreview: null, // For farm fields
  tileHighlight: null, // For highlighting required tiles (forest, mountain, water)

  init(scene) {
    // Main building preview
    this.preview = scene.add.rectangle(0, 0, TILE_SIZE - 2, TILE_SIZE - 2, 0xffffff, 0.15);
    this.preview.setOrigin(0, 0);
    this.preview.setVisible(false);
    
    // Add border to preview
    this.preview.setStrokeStyle(2, 0x00ff00);
    
    // Farm field preview (2 tiles below)
    this.fieldPreview = scene.add.rectangle(0, 0, 2 * TILE_SIZE - 2, TILE_SIZE - 2, 0x00ff00, 0.1);
    this.fieldPreview.setOrigin(0, 0);
    this.fieldPreview.setVisible(false);
    this.fieldPreview.setStrokeStyle(1, 0x00ff00);
    
    // Tile highlight for special requirements
    this.tileHighlight = scene.add.graphics();
    this.tileHighlight.setVisible(false);

    scene.input.keyboard.on("keydown-ONE", () => this.setSelected(scene, BUILDING_TYPES.HOUSE));
    scene.input.keyboard.on("keydown-TWO", () => this.setSelected(scene, BUILDING_TYPES.TRAINING_CENTER));
    scene.input.keyboard.on("keydown-THREE", () => this.setSelected(scene, BUILDING_TYPES.FARM));
    scene.input.keyboard.on("keydown-FOUR", () => this.setSelected(scene, BUILDING_TYPES.LUMBERYARD));
    // Optional: add more keybinds later
    scene.input.keyboard.on("keydown-ESC", () => this.clear(scene));

    scene.input.on("pointermove", (pointer) => {
      if (this.selected) {
        this.updatePreview(scene, pointer);
      }
    });
  },

  setSelected(scene, type) {
    this.selected = type;
    const { w, h } = BUILDING_SIZES[type];
    this.preview.setSize(w * TILE_SIZE - 2, h * TILE_SIZE - 2);
    this.preview.setVisible(true);
    
    // Show field preview for farms
    if (type === BUILDING_TYPES.FARM) {
      this.fieldPreview.setVisible(true);
    } else {
      this.fieldPreview.setVisible(false);
    }
    
    // Show tile highlights for special buildings
    this.updateTileHighlight(scene, type);
    
    scene.input.setDefaultCursor("crosshair");
  },

  clear(scene) {
    this.selected = null;
    this.preview.setVisible(false);
    this.fieldPreview.setVisible(false);
    this.tileHighlight.setVisible(false);
    scene.input.setDefaultCursor("default");
  },

  updatePreview(scene, pointer) {
    const { cx, cy } = this.worldToCell(pointer.worldX, pointer.worldY);
    const { w, h } = BUILDING_SIZES[this.selected];
    
    // Position main preview
    const x = cx * TILE_SIZE + 1;
    const y = cy * TILE_SIZE + 1;
    this.preview.setPosition(x, y);
    
    // Position field preview for farms (2 tiles below)
    if (this.selected === BUILDING_TYPES.FARM) {
      const fieldX = cx * TILE_SIZE + 1;
      const fieldY = (cy + h) * TILE_SIZE + 1;
      this.fieldPreview.setPosition(fieldX, fieldY);
    }
    
    // Update preview colors based on placement validity
    this.updatePreviewColors(scene, cx, cy, w, h);
  },

  updatePreviewColors(scene, cx, cy, w, h) {
    const grid = GameModel.gridData;
    if (!grid) return;

    let canPlace = true;
    let borderColor = 0x00ff00; // Green by default

    // Check if we can place the building
    if (!this.canPlace(grid, cx, cy, w, h)) {
      canPlace = false;
      borderColor = 0xff0000; // Red
    } else {
      // Check tile type requirements
      switch (this.selected) {
        case BUILDING_TYPES.FARM:
          // Farm can be placed on plains, but check if field area is also available
          if (!this.canPlaceOnPlains(grid, cx, cy, w, h)) {
            canPlace = false;
            borderColor = 0xff0000;
          } else {
            // Check if field area (2 tiles below) is also plains and available
            if (!this.canPlaceFields(grid, cx, cy + h, 2, 1)) {
              canPlace = false;
              borderColor = 0xff0000; // Red - farm cannot be placed here due to field requirements
            }
          }
          break;
          
        case BUILDING_TYPES.LUMBERYARD:
          // Lumberyard must be on plains AND near forest
          if (!this.canPlaceOnPlains(grid, cx, cy, w, h) || 
              !this.isAdjacentToTileType(grid, cx, cy, w, h, TILE_TYPES.FOREST)) {
            canPlace = false;
            borderColor = 0xff0000;
          }
          break;
          
        case BUILDING_TYPES.QUARRY:
          // Quarry must be on plains AND near mountain
          if (!this.canPlaceOnPlains(grid, cx, cy, w, h) || 
              !this.isAdjacentToTileType(grid, cx, cy, w, h, TILE_TYPES.MOUNTAIN)) {
            canPlace = false;
            borderColor = 0xff0000;
          }
          break;
          
        case BUILDING_TYPES.FISHERMAN_HUT:
          // Fisherman hut must be on plains AND near water
          if (!this.canPlaceOnPlains(grid, cx, cy, w, h) || 
              !this.isAdjacentToTileType(grid, cx, cy, w, h, TILE_TYPES.WATER)) {
            canPlace = false;
            borderColor = 0xff0000;
          }
          break;
          
        default:
          // Other buildings just need to be on plains
          if (!this.canPlaceOnPlains(grid, cx, cy, w, h)) {
            canPlace = false;
            borderColor = 0xff0000;
          }
          break;
      }
    }

    // Update preview colors
    this.preview.setStrokeStyle(2, borderColor);
    if (this.selected === BUILDING_TYPES.FARM) {
      const fieldColor = canPlace ? 0x00ff00 : 0xff0000;
      this.fieldPreview.setStrokeStyle(1, fieldColor);
      this.fieldPreview.setFillStyle(fieldColor, 0.1);
    }
  },

  updateTileHighlight(scene, buildingType) {
    const grid = GameModel.gridData;
    if (!grid) return;

    this.tileHighlight.clear();
    this.tileHighlight.setVisible(false);

    let targetTileType = null;
    let highlightColor = 0x00ff00;

    switch (buildingType) {
      case BUILDING_TYPES.LUMBERYARD:
        targetTileType = TILE_TYPES.FOREST;
        highlightColor = 0x228b22;
        break;
      case BUILDING_TYPES.QUARRY:
        targetTileType = TILE_TYPES.MOUNTAIN;
        highlightColor = 0x888888;
        break;
      case BUILDING_TYPES.FISHERMAN_HUT:
        targetTileType = TILE_TYPES.WATER;
        highlightColor = 0x3366cc;
        break;
      default:
        return; // No highlighting needed
    }

    // Highlight all tiles of the target type
    this.tileHighlight.setVisible(true);
    this.tileHighlight.setAlpha(0.3);
    this.tileHighlight.setDepth(5);

    grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell.tileType === targetTileType) {
          this.tileHighlight.fillStyle(highlightColor, 0.4);
          this.tileHighlight.fillRect(
            x * TILE_SIZE + 1, 
            y * TILE_SIZE + 1, 
            TILE_SIZE - 2, 
            TILE_SIZE - 2
          );
        }
      });
    });
  },

  // Helper functions for placement validation
  canPlace(grid, cx, cy, w, h) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const row = grid[cy + dy];
        const cell = row?.[cx + dx];
        if (!cell || cell.building) return false;
      }
    }
    return true;
  },

  canPlaceOnPlains(grid, cx, cy, w, h) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const row = grid[cy + dy];
        const cell = row?.[cx + dx];
        if (!cell) return false;
        if (cell.tileType !== TILE_TYPES.PLAINS) return false;
      }
    }
    return true;
  },

  canPlaceFields(grid, cx, cy, w, h) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const row = grid[cy + dy];
        const cell = row?.[cx + dx];
        if (!cell) return false;
        if (cell.tileType !== TILE_TYPES.PLAINS) return false;
        if (cell.building) return false;
      }
    }
    return true;
  },

  isAdjacentToTileType(grid, cx, cy, w, h, tileType) {
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
  },

  worldToCell(x, y) {
    return {
      cx: Math.max(0, Math.min(42 - 1, Math.floor(x / TILE_SIZE))),
      cy: Math.max(0, Math.min(42 - 1, Math.floor(y / TILE_SIZE))),
    };
  },
};

export default Pointer;
