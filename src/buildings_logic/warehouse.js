import GameModel from "../game/core/GameModel";
import { BUILDING_TYPES, BUILDING_SIZES, TILE_SIZE } from "../game/core/constants";
import EventBus from "../game/events/eventBus";

export function init(scene, grid, x, y) {
  const { w, h } = BUILDING_SIZES[BUILDING_TYPES.WAREHOUSE];
  const cx = x * TILE_SIZE + 1 + (w * TILE_SIZE - 2) / 2;
  const cy = y * TILE_SIZE + 1 + (h * TILE_SIZE - 2) / 2;
    const rect = scene.add
    .sprite(cx, cy, "warehouse_idle")
    .play("warehouse_idle_anim");
  rect.setDisplaySize(w * TILE_SIZE - 2, h * TILE_SIZE - 2);
  rect.setOrigin(0.5, 0.5);
  rect.setInteractive({ useHandCursor: true });



  const root = grid[y][x];
  root.building = rect;
  root.buildingType = BUILDING_TYPES.WAREHOUSE;
  root.root = root;
  root.isUnderConstruction = false;
  root.width = w;
  root.height = h;
  root.data = {
    capacity: 100,
    storage: { wood: 0, stone: 0, wheat: 0, fish: 0 },
  };

  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const cell = grid[y + dy][x + dx];
      cell.building = rect;
      cell.buildingType = BUILDING_TYPES.WAREHOUSE;
      cell.root = root;
      cell.isUnderConstruction = false;
    }
  }

  rect.on("pointerdown", () => {
    if (root.isUnderConstruction) return;
    EventBus.emit("open-building-ui", getClickPayload(root));
  });

  return rect;
}

export function getClickPayload(cell) {
  return {
    type: "warehouse",
    capacity: cell.data?.capacity || 100,
    storage: { ...(cell.data?.storage || {}) },
    used: getUsed(cell),
    rootX: cell.x,
    rootY: cell.y,
  };
}

export function remove(scene, cell) {
  const root = cell.root || cell;
  
  // Get stored resources before removal
  const storedResources = root.data?.storage || {};
  
  // Remove stored resources from global resources
  // This represents resources being lost when warehouse is destroyed
  if (GameModel.resources) {
    if (storedResources.wood) {
      GameModel.resources.wood = Math.max(0, (GameModel.resources.wood || 0) - storedResources.wood);
    }
    if (storedResources.stone) {
      GameModel.resources.stone = Math.max(0, (GameModel.resources.stone || 0) - storedResources.stone);
    }
    if (storedResources.wheat) {
      GameModel.resources.wheat = Math.max(0, (GameModel.resources.wheat || 0) - storedResources.wheat);
    }
    if (storedResources.fish) {
      GameModel.resources.fish = Math.max(0, (GameModel.resources.fish || 0) - storedResources.fish);
    }
  }
  
  // Clear warehouse assignments from all production buildings
  clearWarehouseAssignments(root.x, root.y);
  
  // Clean up building visual
  root.building?.destroy();
  
  // Clean up grid cells
  const grid = GameModel.gridData;
  const { width = 1, height = 1 } = root;
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const c = grid[root.y + dy][root.x + dx];
      if (c) {
        c.building = null;
        c.buildingType = null;
        c.root = null;
        c.isUnderConstruction = false;
      }
    }
  }
  
  // Clear warehouse data
  root.data = null;
}

function clearWarehouseAssignments(warehouseX, warehouseY) {
  const grid = GameModel.gridData;
  if (!grid) return;
  
  // Scan all grid cells to find production buildings that were using this warehouse
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    if (!row) continue;
    
    for (let x = 0; x < row.length; x++) {
      const cell = row[x];
      if (!cell || !cell.root || cell.root !== cell) continue;
      
      // Check if this building had an assigned warehouse that matches the destroyed one
      const assignedWh = cell.data?.assignedWarehouse;
      if (assignedWh && assignedWh.x === warehouseX && assignedWh.y === warehouseY) {
        // Clear the warehouse assignment
        cell.data.assignedWarehouse = null;
      }
    }
  }
}

export function canStore(root, type, amount) {
  const cap = root.data?.capacity || 100;
  const used = getUsed(root);
  return used + amount <= cap;
}

export function store(root, type, amount) {
  if (!root || root.buildingType !== BUILDING_TYPES.WAREHOUSE) return 0;
  const cap = root.data?.capacity || 100;
  const used = getUsed(root);
  const free = Math.max(0, cap - used);
  const put = Math.min(free, amount);
  if (put <= 0) return 0;
  root.data.storage[type] = (root.data.storage[type] || 0) + put;
  return put;
}

function getUsed(root) {
  const s = root.data?.storage || {};
  return (s.wood || 0) + (s.stone || 0) + (s.wheat || 0) + (s.fish || 0);
}

export function isWarehouseFull(warehouse) {
  if (!warehouse || warehouse.buildingType !== BUILDING_TYPES.WAREHOUSE) return true;
  const cap = warehouse.data?.capacity || 100;
  const used = getUsed(warehouse);
  return used >= cap;
}

