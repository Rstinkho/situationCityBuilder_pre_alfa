import GameModel from "./GameModel";
import { GOLD_PAYOUT_EVERY_MS, VILLAGER_INCOME, PROFESSIONAL_INCOME, TILE_SIZE } from "./constants";
import TimeSystem from "./TimeSystem";

function showFloatingText(scene, x, y, text) {
  const t = scene.add.text(x, y, text, {
    fontSize: 14,
    color: "#ffffff",
  });
  t.setAlpha(0.8);
  scene.tweens.add({
    targets: t,
    y: y - 20,
    alpha: 0,
    duration: 1000,
    ease: "Cubic.easeOut",
    onComplete: () => t.destroy(),
  });
}

const ResourceSystem = {
  start(scene) {
    TimeSystem.every(scene, GOLD_PAYOUT_EVERY_MS, () => {
      let totalIncome = 0;
      const grid = GameModel.gridData;
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
          const cell = grid[y][x];
          if (
            cell.buildingType === "house" &&
            cell.root === cell &&
            cell.occupants > 0
          ) {
            // Calculate income based on individual occupants and their professions
            const villagerIncome = (cell.villagers || 0) * VILLAGER_INCOME;
            const farmerIncome = (cell.professionCounts?.farmer || 0) * PROFESSIONAL_INCOME;
            const foresterIncome = (cell.professionCounts?.forester || 0) * PROFESSIONAL_INCOME;
            const minerIncome = (cell.professionCounts?.miner || 0) * PROFESSIONAL_INCOME;
            const fishermanIncome = (cell.professionCounts?.fisherman || 0) * PROFESSIONAL_INCOME;
            
            const houseIncome = villagerIncome + farmerIncome + foresterIncome + minerIncome + fishermanIncome;
            totalIncome += houseIncome;
            
            if (houseIncome > 0) {
              const worldX = x * TILE_SIZE + (cell.width ? (cell.width * TILE_SIZE) / 2 : TILE_SIZE / 2);
              const worldY = y * TILE_SIZE - 6;
              const formattedIncome = houseIncome.toFixed(1).replace(".", ",");
              showFloatingText(scene, worldX, worldY, `+${formattedIncome} gold`);
            }
          }
        }
      }
      GameModel.gold += totalIncome;
    });
  },
};

export default ResourceSystem;
