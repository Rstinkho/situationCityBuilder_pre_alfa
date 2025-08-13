import GameModel from "./GameModel";
import { GOLD_PAYOUT_EVERY_MS, HOUSE_FULL_INCOME, HOUSE_CAPACITY, TILE_SIZE } from "./constants";
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
            const worldX = x * TILE_SIZE + (cell.width ? (cell.width * TILE_SIZE) / 2 : TILE_SIZE / 2);
            const worldY = y * TILE_SIZE - 6;
            showFloatingText(scene, worldX, worldY, `+${HOUSE_FULL_INCOME} gold`);
          }
        }
      }
      GameModel.gold += fullHouses * HOUSE_FULL_INCOME;
    });
  },
};

export default ResourceSystem;
