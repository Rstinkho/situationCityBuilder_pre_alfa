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
    workers: [], // array of { type: 'villager' | 'forester' }
    targetTile: null, // { x, y }
    productionTimer: null,
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
    workers.push({ type: "villager" });
  } else if (workerType === "forester") {
    if (GameModel.professions.forester <= 0) return false;
    GameModel.professions.forester -= 1;
    workers.push({ type: "forester" });
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
    const house = findHouseNeedingVillager();
    if (house) house.villagers += 1;
  } else if (worker.type === "forester") {
    GameModel.professions.forester += 1;
  }

  updateProductionTimer(scene, root);
  return true;
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

function findHouseNeedingVillager() {
  const grid = GameModel.gridData;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const cell = grid[y][x];
      if (
        cell.buildingType === BUILDING_TYPES.HOUSE &&
        cell.root === cell &&
        cell.villagers < cell.occupants
      ) {
        return cell;
      }
    }
  }
  return null;
}