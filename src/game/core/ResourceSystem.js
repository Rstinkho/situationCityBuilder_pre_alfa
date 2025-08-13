import GameModel from "./GameModel";
import { GOLD_PAYOUT_EVERY_MS, HOUSE_FULL_INCOME, HOUSE_CAPACITY } from "./constants";
import TimeSystem from "./TimeSystem";

const ResourceSystem = {
  start(scene) {
    TimeSystem.every(scene, GOLD_PAYOUT_EVERY_MS, () => {
      let fullHouses = 0;
      const grid = GameModel.gridData;
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
          const cell = grid[y][x];
          if (
            cell.buildingType === "house" &&
            cell.root === cell &&
            cell.occupants === HOUSE_CAPACITY
          ) {
            fullHouses += 1;
          }
        }
      }
      GameModel.gold += fullHouses * HOUSE_FULL_INCOME;
    });
  },
};

export default ResourceSystem;
