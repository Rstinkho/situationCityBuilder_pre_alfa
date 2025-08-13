import GameModel from "./GameModel";
import { HOUSE_CAPACITY, VILLAGER_ARRIVAL_EVERY_MS } from "./constants";
import TimeSystem from "./TimeSystem";

const PopulationSystem = {
  start(scene) {
    TimeSystem.every(scene, VILLAGER_ARRIVAL_EVERY_MS, () => {
      if (GameModel.population.current >= GameModel.population.cap) return;
      const { cell } = this.findHouseWithSpace(scene);
      if (!cell) return;
      cell.villagers += 1;
      GameModel.population.current += 1;
    });
  },

  findHouseWithSpace(scene) {
    const grid = GameModel.gridData;
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        const cell = grid[y][x];
        if (
          cell.buildingType === "house" &&
          cell.root === cell &&
          cell.villagers < HOUSE_CAPACITY
        ) {
          return { x, y, cell };
        }
      }
    }
    return { cell: null };
  },

  trainVillager(scene, professionKey) {
    const grid = GameModel.gridData;
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        const cell = grid[y][x];
        if (cell.buildingType === "house" && cell.root === cell && cell.villagers > 0) {
          cell.villagers -= 1;
          GameModel.professions[professionKey] += 1;
          return true;
        }
      }
    }
    return false;
  },
};

export default PopulationSystem;
