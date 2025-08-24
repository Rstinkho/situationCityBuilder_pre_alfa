import GameModel from "../game/core/GameModel";
import {
  BUILDING_TYPES,
  BUILDING_SIZES,
  TILE_SIZE,
} from "../game/core/constants";
import EventBus from "../game/events/eventBus";

export function init(scene, grid, x, y) {
  const { w, h } = BUILDING_SIZES[BUILDING_TYPES.TRAINING_CENTER];
  const cx = x * TILE_SIZE + 1 + (w * TILE_SIZE - 2) / 2;
  const cy = y * TILE_SIZE + 1 + (h * TILE_SIZE - 2) / 2;
  const rect = scene.add
    .sprite(cx, cy, "training_idle")
    .play("training_idle_anim");
  rect.setDisplaySize(w * TILE_SIZE - 2, h * TILE_SIZE - 2);
  rect.setOrigin(0.5, 0.5);
  rect.setInteractive({ useHandCursor: true });

  const root = grid[y][x];
  root.building = rect;
  root.buildingType = BUILDING_TYPES.TRAINING_CENTER;
  root.root = root;
  root.isUnderConstruction = false;
  root.width = w;
  root.height = h;
  
  // Initialize training progress tracking
  root.trainingProgress = {};
  root.trainingStartTime = {};
  root.trainingHouse = {};

  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const cell = grid[y + dy][x + dx];
      cell.building = rect;
      cell.buildingType = BUILDING_TYPES.TRAINING_CENTER;
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

export function loop(_scene, _cell, _dt) {}

export function getClickPayload(cell) {
  return {
    type: "training_center",
    actions: [
      { key: "farmer", label: "Train Farmer", icon: "👨‍🌾" },
      { key: "forester", label: "Train Forester", icon: "🌲" },
      { key: "miner", label: "Train Miner", icon: "⛏️" },
      { key: "fisherman", label: "Train Fisherman", icon: "🎣" },
    ],
    availableVillagers: countAvailableVillagers(),
    rootX: cell.x,
    rootY: cell.y,
    trainingProgress: cell.trainingProgress || {},
    trainingStartTime: cell.trainingStartTime || {},
  };
}

export function startTraining(cell, profession) {
  const root = cell.root || cell;
  const now = Date.now();
  const trainingDuration = 5000; // 5 seconds
  
  // Check if we can actually start training (need available villagers)
  if (countAvailableVillagers() <= 0) {
    return null;
  }
  
  // Consume a villager immediately when training starts
  const result = consumeVillagerForTraining(profession);
  if (!result.success) {
    return null; // Couldn't get a villager
  }
  
  // Store training info including the house
  root.trainingProgress[profession] = 0;
  root.trainingStartTime[profession] = now;
  root.trainingHouse = root.trainingHouse || {};
  root.trainingHouse[profession] = result.house;
  
  console.log(`Started training ${profession}. Villager taken from house at (${result.house.x}, ${result.house.y})`);
  
  // Start progress update timer
  const progressInterval = setInterval(() => {
    const elapsed = Date.now() - now;
    const progress = Math.min((elapsed / trainingDuration) * 100, 100);
    
    root.trainingProgress[profession] = progress;
    
    if (progress >= 100) {
      // Training complete
      clearInterval(progressInterval);
      completeTraining(root, profession);
    }
  }, 100); // Update every 100ms for smooth progress
  
  return progressInterval;
}

function consumeVillagerForTraining(profession) {
  const grid = GameModel.gridData || [];
  
  // Find a house with available villagers
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    if (!row) continue;
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c?.buildingType === BUILDING_TYPES.HOUSE && c.root === c) {
        const employed = (c.employed?.villager || 0);
        const free = Math.max(0, (c.villagers || 0) - employed);
        
        if (free > 0) {
          // Remove the villager from the house
          c.villagers = (c.villagers || 0) - 1;
          
          // Store which house this training is happening from
          return { success: true, house: c, profession };
        }
      }
    }
  }
  
  return { success: false }; // No available villagers
}

function completeTraining(root, profession) {
  // Get the house where the villager came from
  const house = root.trainingHouse && root.trainingHouse[profession];
  
  // Remove the training progress
  delete root.trainingProgress[profession];
  delete root.trainingStartTime[profession];
  if (root.trainingHouse) {
    delete root.trainingHouse[profession];
  }
  
  // Actually create the trained worker and assign them to the house
  createTrainedWorker(profession, house);
  
  // Emit training completed event
  EventBus.emit("training-completed", { profession, rootX: root.x, rootY: root.y });
}

function createTrainedWorker(profession, house) {
  // Add the trained worker to the GameModel professions
  if (!GameModel.professions) GameModel.professions = {};
  
  const currentCount = GameModel.professions[profession] || 0;
  GameModel.professions[profession] = currentCount + 1;
  
  // Add the trained worker back to the house they came from
  if (house) {
    // Initialize profession counts if needed
    if (!house.professionCounts) {
      house.professionCounts = { farmer: 0, forester: 0, miner: 0, fisherman: 0 };
    }
    
    // Add the new specialist to the house (same person, different role)
    house.professionCounts[profession] = (house.professionCounts[profession] || 0) + 1;
    // Note: house.occupants stays the same since we're transforming, not adding
    
    console.log(`Training completed! ${profession} added to house at (${house.x}, ${house.y})`);
    console.log(`House now has: ${house.villagers} villagers, ${house.professionCounts[profession]} ${profession}s, total occupants: ${house.occupants}`);
  }
  
  console.log(`Training completed! New ${profession} created. Total: ${GameModel.professions[profession]}`);
}

function countAvailableVillagers() {
  const grid = GameModel.gridData || [];
  let available = 0;
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    if (!row) continue;
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c?.buildingType === BUILDING_TYPES.HOUSE && c.root === c) {
        const employed = (c.employed?.villager || 0);
        const free = Math.max(0, (c.villagers || 0) - employed);
        available += free;
      }
    }
  }
  return available;
}

export function remove(scene, cell) {
  const root = cell.root || cell;
  root.building?.destroy();
  const { width = 1, height = 1 } = root;
  const grid = GameModel.gridData;
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
