export const TILE_SIZE = 24;
export const GRID_WIDTH = 66;
export const GRID_HEIGHT = 42;

export const POPULATION_CAP_START = 10;
export const HOUSE_CAPACITY = 4;

export const VILLAGER_ARRIVAL_EVERY_MS = 3000;
export const GOLD_PAYOUT_EVERY_MS = 10000;
export const HOUSE_FULL_INCOME = 0.1;

export const BUILDING_TYPES = {
  HOUSE: "house",
  TRAINING_CENTER: "training_center",
};

export const BUILDING_SIZES = {
  [BUILDING_TYPES.HOUSE]: { w: 2, h: 2 },
  [BUILDING_TYPES.TRAINING_CENTER]: { w: 3, h: 2 },
};
