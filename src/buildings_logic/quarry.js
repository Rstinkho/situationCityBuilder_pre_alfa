import GameModel from "../game/core/GameModel";
import { BUILDING_TYPES, BUILDING_SIZES, TILE_SIZE, TILE_TYPES, STONE_PER_100_EFF_MS, QUARRY_NEARBY_RADIUS } from "../game/core/constants";
import { store as warehouseStore, isWarehouseFull } from "./warehouse";
import EventBus from "../game/events/eventBus";
import TimeSystem from "../game/core/TimeSystem";

export function init(scene, grid, x, y) {
  const { w, h } = BUILDING_SIZES[BUILDING_TYPES.QUARRY];
  const cx = x * TILE_SIZE + 1 + (w * TILE_SIZE - 2) / 2;
  const cy = y * TILE_SIZE + 1 + (h * TILE_SIZE - 2) / 2;

  const rect = scene.add.sprite(cx, cy, "quarry_idle").play("quarry_idle_anim");

  // --- COVER LOGIC (replaces setDisplaySize) ---
  const targetW = w * TILE_SIZE - 2;
  const targetH = h * TILE_SIZE - 2;
  const texW = rect.width; // frame width from spritesheet
  const texH = rect.height; // frame height from spritesheet
  const scale = Math.max(targetW / texW, targetH / texH); // "cover" like CSS
  rect.setScale(scale);
  // --------------------------------------------

  rect.setOrigin(0.5, 0.5);
  rect.setInteractive({ useHandCursor: true });

  const root = grid[y][x];
  root.building = rect;
  root.buildingType = BUILDING_TYPES.QUARRY;
  root.root = root;
  root.isUnderConstruction = false;
  root.width = w;
  root.height = h;
  root.data = {
    workers: [], // array of { type: 'villager' | 'miner', home: {x,y} }
    targetTile: null, // { x, y }
    productionTimer: null,
    highlight: null,
    assignedIcon: null,
    gatheredTotal: 0,
    availableToDeliver: 0,
    assignedWarehouse: null,
    deliveryDots: [], // array of moving resource dots
    incomingDelivery: 0, // count of resources in transit
  };

  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const cell = grid[y + dy][x + dx];
      cell.building = rect;
      cell.buildingType = BUILDING_TYPES.QUARRY;
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
    type: "quarry",
    workers: cell.data?.workers || [],
    hasTarget: !!cell.data?.targetTile,
    targetTile: cell.data?.targetTile || null,
    efficiency: computeEfficiency(cell),
    gatheredTotal: cell.data?.gatheredTotal || 0,
    availableToDeliver: cell.data?.availableToDeliver || 0,
    assignedWarehouse: cell.data?.assignedWarehouse || null,
    rootX: cell.x,
    rootY: cell.y,
  };
}

export function assignWorker(scene, x, y, workerType) {
  const grid = GameModel.gridData;
  const root = grid[y][x];
  if (!root || root.buildingType !== BUILDING_TYPES.QUARRY) return false;
  const workers = root.data.workers;
  if (workers.length >= 2) return false;

  if (workerType === "villager") {
    const house = findHouseWithVillagerAvailable();
    if (!house) return false;
    house.employed.villager = (house.employed.villager || 0) + 1;
    workers.push({ type: "villager", home: { x: house.x, y: house.y } });
  } else if (workerType === "miner") {
    const house = findHouseWithProfessionalAvailable("miner");
    if (!house) return false;
    house.employed.miner = (house.employed.miner || 0) + 1;
    workers.push({ type: "miner", home: { x: house.x, y: house.y } });
  } else {
    return false;
  }

  updateProductionTimer(scene, root);
  return true;
}

export function unassignLastWorker(scene, x, y) {
  const grid = GameModel.gridData;
  const root = grid[y][x];
  if (!root || root.buildingType !== BUILDING_TYPES.QUARRY) return false;
  const workers = root.data.workers;
  if (workers.length === 0) return false;
  const worker = workers.pop();

  const home = getHouseByCoords(worker.home);
  if (home) {
    if (worker.type === "villager") home.employed.villager = Math.max(0, (home.employed.villager || 0) - 1);
    if (worker.type === "miner") home.employed.miner = Math.max(0, (home.employed.miner || 0) - 1);
  }

  updateProductionTimer(scene, root);
  return true;
}

export function onWorkersChanged(scene, root) {
  updateProductionTimer(scene, root);
}

export function setTargetTile(scene, x, y, tx, ty) {
  const grid = GameModel.gridData;
  const root = grid[y][x];
  if (!root || root.buildingType !== BUILDING_TYPES.QUARRY) return false;

  const cell = grid[ty]?.[tx];
  if (!cell) return false;
  if (cell.tileType !== TILE_TYPES.MOUNTAIN) return false;
  const within = withinRadius(x, y, tx, ty, QUARRY_NEARBY_RADIUS);
  if (!within) return false;

  root.data.targetTile = { x: tx, y: ty };
  // place/update pickaxe icon overlay on assigned tile
  try {
    if (!scene.textures.exists("icon_pickaxe")) {
      const g = scene.add.graphics();
      g.fillStyle(0x2c3e50, 1);
      g.fillRect(6, 2, 4, 12);
      g.fillStyle(0x95a5a6, 1);
      g.fillRoundedRect(2, 2, 8, 6, 2);
      g.generateTexture("icon_pickaxe", 16, 16);
      g.destroy();
    }
  } catch {}
  const worldX = tx * TILE_SIZE + TILE_SIZE / 2;
  const worldY = ty * TILE_SIZE + TILE_SIZE / 2;
  if (root.data.assignedIcon) {
    root.data.assignedIcon.setPosition(worldX, worldY);
  } else {
    const icon = scene.add.image(worldX, worldY, "icon_pickaxe");
    icon.setOrigin(0.5, 0.5);
    icon.setDepth(700);
    root.data.assignedIcon = icon;
  }
  updateProductionTimer(scene, root);
  return true;
}

export function clearTargetTile(scene, x, y) {
  const grid = GameModel.gridData;
  const root = grid[y][x];
  if (!root || root.buildingType !== BUILDING_TYPES.QUARRY) return false;
  root.data.targetTile = null;
  if (root.data.assignedIcon) {
    try { root.data.assignedIcon.destroy(); } catch {}
    root.data.assignedIcon = null;
  }
  updateProductionTimer(scene, root);
  return true;
}

export function remove(scene, cell) {
  const root = cell.root || cell;
  
  // Remove stored resources from global resources when building is destroyed
  const availableToDeliver = root.data?.availableToDeliver || 0;
  if (availableToDeliver > 0 && GameModel.resources) {
    GameModel.resources.stone = Math.max(0, (GameModel.resources.stone || 0) - availableToDeliver);
  }
  
  const workers = root.data?.workers || [];
  while (workers.length) {
    const w = workers.pop();
    const home = getHouseByCoords(w.home);
    if (home) {
      if (w.type === "villager") home.employed.villager = Math.max(0, (home.employed.villager || 0) - 1);
      if (w.type === "miner") home.employed.miner = Math.max(0, (home.employed.miner || 0) - 1);
    }
  }
  if (root.data?.productionTimer) {
    root.data.productionTimer.remove(false);
    root.data.productionTimer = null;
  }
  if (root.data?.assignedIcon) {
    try { root.data.assignedIcon.destroy(); } catch {}
    root.data.assignedIcon = null;
  }
  if (root.data?.deliveryDots) {
    root.data.deliveryDots.forEach((d) => d.destroy());
    root.data.deliveryDots.length = 0;
  }
  root.building?.destroy();
  const grid = GameModel.gridData;
  const { width = 1, height = 1 } = root;
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const c = grid[root.y + dy][root.x + dx];
      c.building = null;
      c.buildingType = null;
      c.root = null;
      c.isUnderConstruction = false;
    }
  }
}

function computeEfficiency(root) {
  const workers = root.data?.workers || [];
  let eff = 0;
  workers.forEach((w) => {
    if (w.type === "villager") eff += 15;
    if (w.type === "miner") eff += 50;
  });
  return Math.min(100, eff);
}

function updateProductionTimer(scene, root) {
  const canProduce = (root.data.workers?.length || 0) > 0 && !!root.data.targetTile;
  if (!canProduce) {
    if (root.data.productionTimer) {
      root.data.productionTimer.remove(false);
      root.data.productionTimer = null;
    }
    if (!root.data.targetTile && root.data.assignedIcon) {
      try { root.data.assignedIcon.destroy(); } catch {}
      root.data.assignedIcon = null;
    }
    return;
  }

  if (root.data.productionTimer) return; // already producing

  const t = TimeSystem.every(scene, STONE_PER_100_EFF_MS, () => {
    const eff = computeEfficiency(root) / 100;
    if (eff <= 0) return;
    
    // Check resource limit (20)
    if (root.data.availableToDeliver >= 20) {
      // Production stops when limit reached
      return;
    }
    
    GameModel.resources.stone += eff;
    root.data.gatheredTotal += eff;
    root.data.availableToDeliver += eff;
    deliverIfReady(scene, root.x, root.y);
  });
  root.data.productionTimer = t;
}

export function assignWarehouse(scene, x, y, wx, wy) {
  const grid = GameModel.gridData;
  const root = grid[y][x];
  if (!root || root.buildingType !== BUILDING_TYPES.QUARRY) return false;
  const w = grid[wy]?.[wx];
  if (!w || w.buildingType !== BUILDING_TYPES.WAREHOUSE || w.root !== w) return false;
  
  // Clear previous warehouse assignment
  root.data.assignedWarehouse = null;
  
  // Set new warehouse assignment
  root.data.assignedWarehouse = { x: wx, y: wy };
  
  // Try to resume delivery if we have resources to deliver
  if (root.data.availableToDeliver >= 4) {
    deliverIfReady(scene, x, y);
  }
  
  return true;
}

export function deliverIfReady(scene, x, y) {
  const grid = GameModel.gridData;
  const root = grid[y][x];
  if (!root || root.buildingType !== BUILDING_TYPES.QUARRY) return false;
  const wh = root.data.assignedWarehouse ? grid[root.data.assignedWarehouse.y]?.[root.data.assignedWarehouse.x] : null;
  if (!wh || wh.buildingType !== BUILDING_TYPES.WAREHOUSE || wh.root !== wh) return false;
  
  // Check if warehouse is full
  if (isWarehouseFull(wh)) return false;
  
  const amount = Math.floor(root.data.availableToDeliver);
  if (amount < 4) return false;
  
  // Start visual delivery
  spawnResourceDelivery(scene, root, wh, amount);
  
  return true;
}

export function spawnResourceDelivery(scene, root, warehouse, amount) {
  // Reserve resources for in-flight delivery
  const deliveryAmount = Math.min(amount, 4); // Deliver up to 4 at a time
  root.data.incomingDelivery = (root.data.incomingDelivery || 0) + deliveryAmount;
  
  // Create resource icon (stone)
  const startX = root.x * TILE_SIZE + (root.width * TILE_SIZE) / 2;
  const startY = root.y * TILE_SIZE + (root.height * TILE_SIZE) / 2;
  
  // Create a simple stone icon (gray diamond)
  const mover = scene.add.graphics();
  mover.fillStyle(0x808080, 1); // Gray color for stone
  mover.fillPoints([
    { x: 0, y: -4 },   // top
    { x: 4, y: 0 },    // right
    { x: 0, y: 4 },    // bottom
    { x: -4, y: 0 }    // left
  ], true, true);
  mover.setPosition(startX, startY);
  mover.setDepth(600);
  
  if (!root.data.deliveryDots) root.data.deliveryDots = [];
  root.data.deliveryDots.push(mover);

  const targetX = warehouse.x * TILE_SIZE + (warehouse.width * TILE_SIZE) / 2;
  const targetY = warehouse.y * TILE_SIZE + (warehouse.height * TILE_SIZE) / 2;
  
  scene.tweens.add({
    targets: mover,
    x: targetX,
    y: targetY,
    duration: 4500, // Slower movement as requested
    ease: "Sine.easeInOut",
    onComplete: () => {
      // finalize delivery
      const stored = warehouseStore(warehouse, "stone", deliveryAmount);
      if (stored > 0) {
        root.data.availableToDeliver = Math.max(0, root.data.availableToDeliver - stored);
      }
      
      // cleanup moving resource icon
      mover.destroy();
      const idx = root.data.deliveryDots.indexOf(mover);
      if (idx >= 0) root.data.deliveryDots.splice(idx, 1);
      root.data.incomingDelivery = Math.max(0, (root.data.incomingDelivery || 0) - deliveryAmount);
    },
  });
}

function withinRadius(bx, by, tx, ty, r) {
  const dx = tx - bx;
  const dy = ty - by;
  return dx * dx + dy * dy <= r * r;
}

function findHouseWithVillagerAvailable() {
  const grid = GameModel.gridData;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const cell = grid[y][x];
      if (cell.buildingType === BUILDING_TYPES.HOUSE && cell.root === cell) {
        const free = cell.villagers - (cell.employed?.villager || 0);
        if (free > 0) return cell;
      }
    }
  }
  return null;
}

function findHouseWithProfessionalAvailable(key) {
  const grid = GameModel.gridData;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const cell = grid[y][x];
      if (cell.buildingType === BUILDING_TYPES.HOUSE && cell.root === cell) {
        const total = cell.professionCounts?.[key] || 0;
        const employed = cell.employed?.[key] || 0;
        if (total - employed > 0) return cell;
      }
    }
  }
  return null;
}

function getHouseByCoords(home) {
  if (!home) return null;
  const grid = GameModel.gridData;
  const cell = grid[home.y]?.[home.x];
  if (cell && cell.buildingType === BUILDING_TYPES.HOUSE && cell.root === cell) return cell;
  return null;
}

