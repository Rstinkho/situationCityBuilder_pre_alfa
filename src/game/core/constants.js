export const TILE_SIZE = 24;
export const GRID_WIDTH = 42;
export const GRID_HEIGHT = 42;

export const POPULATION_CAP_START = 16;
export const HOUSE_CAPACITY = 4;

export const VILLAGER_ARRIVAL_EVERY_MS = 6000;
export const GOLD_PAYOUT_EVERY_MS = 10000;
export const HOUSE_FULL_INCOME = 0.1; // Legacy - no longer used
export const VILLAGER_INCOME = 0.4;
export const PROFESSIONAL_INCOME = 0.6;

export const TILE_TYPES = {
  PLAINS: "plains",
  WATER: "water",
  FOREST: "forest",
  MOUNTAIN: "mountain",
};

export const BUILDING_TYPES = {
  HOUSE: "house",
  TRAINING_CENTER: "training_center",
  LUMBERYARD: "lumberyard",
  QUARRY: "quarry",
  FARM: "farm",
  FARM_FIELD: "farm_field",
  FISHERMAN_HUT: "fisherman_hut",
  WAREHOUSE: "warehouse",
  TOWER: "tower",
};

export const BUILDING_SIZES = {
  [BUILDING_TYPES.HOUSE]: { w: 2, h: 2 },
  [BUILDING_TYPES.TRAINING_CENTER]: { w: 3, h: 2 },
  [BUILDING_TYPES.LUMBERYARD]: { w: 2, h: 2 },
  [BUILDING_TYPES.QUARRY]: { w: 2, h: 2 },
  [BUILDING_TYPES.FARM]: { w: 2, h: 2 },
  [BUILDING_TYPES.FARM_FIELD]: { w: 1, h: 1 },
  [BUILDING_TYPES.FISHERMAN_HUT]: { w: 2, h: 2 },
  [BUILDING_TYPES.WAREHOUSE]: { w: 3, h: 3 },
  [BUILDING_TYPES.TOWER]: { w: 1, h: 2 },
};

export const LUMBER_PER_100_EFF_MS = 20000;
export const LUMBERYARD_NEARBY_RADIUS = 3; // tiles
export const FARM_PER_100_EFF_MS = 20000;
export const STONE_PER_100_EFF_MS = 20000;
export const QUARRY_NEARBY_RADIUS = 3; // tiles
export const FISH_PER_100_EFF_MS = 20000;
export const FISHERMAN_HUT_NEARBY_RADIUS = 3; // tiles

export const BUILDING_COSTS = {
  [BUILDING_TYPES.HOUSE]: 10,
  [BUILDING_TYPES.TRAINING_CENTER]: 25,
  [BUILDING_TYPES.LUMBERYARD]: 30,
  [BUILDING_TYPES.QUARRY]: 30,
  [BUILDING_TYPES.FARM]: 30,
  [BUILDING_TYPES.FARM_FIELD]: 0,
  [BUILDING_TYPES.FISHERMAN_HUT]: 30,
  [BUILDING_TYPES.WAREHOUSE]: 40,
  [BUILDING_TYPES.TOWER]: 50,
};
