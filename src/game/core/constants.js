export const TILE_SIZE = 24;
export const GRID_WIDTH = 66;
export const GRID_HEIGHT = 42;

export const POPULATION_CAP_START = 10;
export const HOUSE_CAPACITY = 4;

export const VILLAGER_ARRIVAL_EVERY_MS = 3000;
export const GOLD_PAYOUT_EVERY_MS = 10000;
export const HOUSE_FULL_INCOME = 0.1;

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
  FARM: "farm",
  FARM_FIELD: "farm_field",
};

export const BUILDING_SIZES = {
  [BUILDING_TYPES.HOUSE]: { w: 2, h: 2 },
  [BUILDING_TYPES.TRAINING_CENTER]: { w: 3, h: 2 },
  [BUILDING_TYPES.LUMBERYARD]: { w: 2, h: 2 },
  [BUILDING_TYPES.FARM]: { w: 2, h: 2 },
  [BUILDING_TYPES.FARM_FIELD]: { w: 1, h: 1 },
};

export const LUMBER_PER_100_EFF_MS = 20000;
export const LUMBERYARD_NEARBY_RADIUS = 3; // tiles
export const FARM_PER_100_EFF_MS = 20000;
