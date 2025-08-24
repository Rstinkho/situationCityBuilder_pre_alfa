import GameModel from "./GameModel";
import { HOUSE_CAPACITY, VILLAGER_ARRIVAL_EVERY_MS } from "./constants";
import TimeSystem from "./TimeSystem";
import { spawnArrival } from "../../buildings_logic/house";

const PopulationSystem = {
  start(scene) {
    TimeSystem.every(scene, VILLAGER_ARRIVAL_EVERY_MS + 1000, () => {
      if (GameModel.population.current >= GameModel.population.cap) return;
      const { cell } = this.findHouseWithSpace(scene);
      if (!cell) return;
      // let visual arrival handle counters on completion
      spawnArrival(scene, cell);
    });
  },

  findHouseWithSpace(scene) {
    const grid = GameModel.gridData;
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        const cell = grid[y][x];
        const incoming = cell.root === cell ? (cell.incoming || 0) : 0;
        if (
          cell.buildingType === "house" &&
          cell.root === cell &&
          cell.occupants + incoming < HOUSE_CAPACITY
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
        if (cell.buildingType === "house" && cell.root === cell) {
          const employedVillagers = cell.employed?.villager || 0;
          const availableVillagers = cell.villagers - employedVillagers;
          if (availableVillagers > 0) {
            cell.villagers -= 1;
            const root = cell;
            root.professionCounts[professionKey] = (root.professionCounts[professionKey] || 0) + 1;
            GameModel.professions[professionKey] += 1;
            return true;
          }
        }
      }
    }
    return false;
  },
};

export default PopulationSystem;
