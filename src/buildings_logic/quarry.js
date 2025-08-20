import GameModel from "../game/core/GameModel";
import { BUILDING_TYPES, BUILDING_SIZES, TILE_SIZE, TILE_TYPES, STONE_PER_100_EFF_MS, QUARRY_NEARBY_RADIUS } from "../game/core/constants";
import EventBus from "../game/events/eventBus";
import TimeSystem from "../game/core/TimeSystem";

export function init(scene, grid, x, y) {
  const { w, h } = BUILDING_SIZES[BUILDING_TYPES.QUARRY];
  const cx = x * TILE_SIZE + 1 + (w * TILE_SIZE - 2) / 2;
  const cy = y * TILE_SIZE + 1 + (h * TILE_SIZE - 2) / 2;
  const rect = scene.add.image(cx, cy, "quarry_frame_1");
  rect.setDisplaySize(w * TILE_SIZE - 2, h * TILE_SIZE - 2);
  rect.setOrigin(0.5, 0.5);
  rect.setInteractive({ useHandCursor: true });

  const frames = ["quarry_frame_1", "quarry_frame_2", "quarry_frame_3"];
  let fi = 0;
  scene.time.addEvent({ delay: 500, loop: true, callback: () => { fi = (fi + 1) % frames.length; try { rect.setTexture(frames[fi]); } catch {} } });

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
    GameModel.resources.stone += eff;
  });
  root.data.productionTimer = t;
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

