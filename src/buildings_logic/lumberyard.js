import GameModel from "../game/core/GameModel";
import { BUILDING_TYPES, BUILDING_SIZES, TILE_SIZE, TILE_TYPES, LUMBER_PER_100_EFF_MS, LUMBERYARD_NEARBY_RADIUS } from "../game/core/constants";
import EventBus from "../game/events/eventBus";
import TimeSystem from "../game/core/TimeSystem";

export function init(scene, grid, x, y) {
  const { w, h } = BUILDING_SIZES[BUILDING_TYPES.LUMBERYARD];
  const rect = scene.add.rectangle(
    x * TILE_SIZE + 1,
    y * TILE_SIZE + 1,
    w * TILE_SIZE - 2,
    h * TILE_SIZE - 2,
    0xb5651d
  );
  rect.setOrigin(0, 0);
  rect.setInteractive({ useHandCursor: true });

  const root = grid[y][x];
  root.building = rect;
  root.buildingType = BUILDING_TYPES.LUMBERYARD;
  root.root = root;
  root.isUnderConstruction = false;
  root.width = w;
  root.height = h;
  root.data = {
    workers: [], // array of { type: 'villager' | 'forester', home: {x,y} }
    targetTile: null, // { x, y }
    productionTimer: null,
    highlight: null,
  };

  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const cell = grid[y + dy][x + dx];
      cell.building = rect;
      cell.buildingType = BUILDING_TYPES.LUMBERYARD;
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
    type: "lumberyard",
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
  if (!root || root.buildingType !== BUILDING_TYPES.LUMBERYARD) return false;
  const workers = root.data.workers;
  if (workers.length >= 2) return false;

  if (workerType === "villager") {
    const house = findHouseWithVillager();
    if (!house) return false;
    house.villagers -= 1;
    workers.push({ type: "villager", home: { x: house.x, y: house.y } });
  } else if (workerType === "forester") {
    const house = findHouseWithProfessional("forester");
    if (!house) return false;
    // Take one free forester from that house
    house.professionCounts.forester -= 1;
    GameModel.professions.forester -= 1;
    workers.push({ type: "forester", home: { x: house.x, y: house.y } });
  } else {
    return false;
  }

  updateProductionTimer(scene, root);
  return true;
}

export function unassignLastWorker(scene, x, y) {
  const grid = GameModel.gridData;
  const root = grid[y][x];
  if (!root || root.buildingType !== BUILDING_TYPES.LUMBERYARD) return false;
  const workers = root.data.workers;
  if (workers.length === 0) return false;
  const worker = workers.pop();

  if (worker.type === "villager") {
    const home = getHouseByCoords(worker.home);
    if (home) home.villagers += 1; else addVillagerToAnyHouse();
  } else if (worker.type === "forester") {
    const home = getHouseByCoords(worker.home);
    if (home) home.professionCounts.forester += 1;
    GameModel.professions.forester += 1;
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
  if (!root || root.buildingType !== BUILDING_TYPES.LUMBERYARD) return false;

  const cell = grid[ty]?.[tx];
  if (!cell) return false;
  if (cell.tileType !== TILE_TYPES.FOREST) return false;
  const within = withinRadius(x, y, tx, ty, LUMBERYARD_NEARBY_RADIUS);
  if (!within) return false;

  root.data.targetTile = { x: tx, y: ty };
  updateProductionTimer(scene, root);
  return true;
}

export function clearTargetTile(scene, x, y) {
  const grid = GameModel.gridData;
  const root = grid[y][x];
  if (!root || root.buildingType !== BUILDING_TYPES.LUMBERYARD) return false;
  root.data.targetTile = null;
  updateProductionTimer(scene, root);
  return true;
}

export function remove(scene, cell) {
  const root = cell.root || cell;
  // release all workers back to pool
  const workers = root.data?.workers || [];
  while (workers.length) {
    const w = workers.pop();
    if (w.type === "villager") {
      const home = getHouseByCoords(w.home);
      if (home) home.villagers += 1; else addVillagerToAnyHouse();
    } else if (w.type === "forester") {
      const home = getHouseByCoords(w.home);
      if (home) home.professionCounts.forester += 1;
      GameModel.professions.forester += 1;
    }
  }
  // stop production
  if (root.data?.productionTimer) {
    root.data.productionTimer.remove(false);
    root.data.productionTimer = null;
  }
  // destroy visuals and clear cells
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
    if (w.type === "forester") eff += 50;
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
    return;
  }

  if (root.data.productionTimer) return; // already producing

  const t = TimeSystem.every(scene, LUMBER_PER_100_EFF_MS, () => {
    const eff = computeEfficiency(root) / 100;
    if (eff <= 0) return;
    GameModel.resources.wood += eff;
  });
  root.data.productionTimer = t;
}

function withinRadius(bx, by, tx, ty, r) {
  const dx = tx - bx;
  const dy = ty - by;
  return dx * dx + dy * dy <= r * r;
}

function findHouseWithVillager() {
  const grid = GameModel.gridData;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const cell = grid[y][x];
      if (cell.buildingType === BUILDING_TYPES.HOUSE && cell.root === cell && cell.villagers > 0) {
        return cell;
      }
    }
  }
  return null;
}

function findHouseWithProfessional(key) {
  const grid = GameModel.gridData;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const cell = grid[y][x];
      if (cell.buildingType === BUILDING_TYPES.HOUSE && cell.root === cell && cell.professionCounts?.[key] > 0) {
        return cell;
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

function addVillagerToAnyHouse() {
  const grid = GameModel.gridData;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const cell = grid[y][x];
      if (cell.buildingType === BUILDING_TYPES.HOUSE && cell.root === cell && cell.villagers < cell.capacity) {
        cell.villagers += 1;
        return true;
      }
    }
  }
  return false;
}