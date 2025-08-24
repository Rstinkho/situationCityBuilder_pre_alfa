import GameModel from "../game/core/GameModel";
import QuestModel from "./QuestModel";

// Quest event definitions
export const QUEST_EVENTS = {
  FIRST_WAREHOUSE_DELIVERY: {
    id: "first_warehouse_delivery",
    title: "You have been noticed by...",
    description: "A mysterious figure has taken interest in your growing settlement. They demand tribute to ensure your safety.",
    choices: [
      {
        text: "Agree to pay 25 gold",
        action: (questModel) => {
          // Check if player has enough gold
          if (GameModel.gold >= 1) {
            GameModel.gold -= 25;
            
            // Start the tribute cycle every 90 seconds
            questModel.startQuestTimer("tribute_cycle", () => {
              showTributeChoice(questModel);
            }, 90000); // 90 seconds
            
            return {
              success: true,
              message: "You paid the tribute. The figure promises to return in 90 seconds for more..."
            };
          } else {
            return {
              success: false,
              message: "You don't have enough gold to pay the tribute!"
            };
          }
        }
      },
      {
        text: "Don't agree to pay",
        action: (questModel) => {
          // Start the attack cycle
          startAttackCycle(questModel);
          
          return {
            success: true,
            message: "You refused to pay. The figure warns you will face consequences..."
          };
        }
      }
    ]
  }
};

// Tribute choice dialog (appears every 90 seconds)
function showTributeChoice(questModel) {
  const tributeEvent = {
    id: "tribute_choice",
    title: "The figure returns...",
    description: "They demand another tribute payment to continue protecting your settlement.",
    choices: [
      {
        text: "Pay 5 gold",
        action: (questModel) => {
          if (GameModel.gold >= 5) {
            GameModel.gold -= 5;
            
            // Continue the tribute cycle
            return {
              success: true,
              message: "Tribute paid. They will return in 90 seconds..."
            };
          } else {
            return {
              success: false,
              message: "You don't have enough gold! The tribute cycle is broken."
            };
          }
        }
      },
      {
        text: "Reject",
        action: (questModel) => {
          // Stop tribute cycle and start attack cycle
          questModel.stopQuestTimer("tribute_cycle");
          startAttackCycle(questModel);
          
          return {
            success: true,
            message: "You rejected the tribute. Prepare for the consequences..."
          };
        }
      }
    ]
  };
  
  // Show the tribute choice dialog
  if (window.__questUI) {
    window.__questUI.showQuest(tributeEvent);
  }
}

// Start the attack cycle with decreasing intervals
function startAttackCycle(questModel) {
  // Show timer on tower defense screen
  if (window.__defenseScene) {
    window.__defenseScene.showAttackTimer();
  }
  
  // Start attack timer with decreasing intervals after 30 seconds
  questModel.startAttackTimer("attack_cycle", () => {
    if (window.__defenseScene) {
      window.__defenseScene.launchAttack();
    }
  });
}

// Check for quest triggers
export function checkQuestTriggers(questModel) {
  // Check for first warehouse delivery
  if (!questModel.isEventTriggered("first_warehouse_delivery")) {
    const grid = GameModel.gridData || [];
    let hasWarehouseResources = false;
    
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        const cell = row[x];
        if (cell && cell.root === cell && cell.buildingType === "warehouse") {
          const storage = cell.data?.storage || {};
          const totalResources = (storage.wood || 0) + (storage.stone || 0) + (storage.wheat || 0) + (storage.fish || 0);
          
          if (totalResources > 0) {
            hasWarehouseResources = true;
            break;
          }
        }
      }
      if (hasWarehouseResources) break;
    }
    
    if (hasWarehouseResources) {
      questModel.markEventTriggered("first_warehouse_delivery");
      
      // Show the quest dialog
      if (window.__questUI) {
        window.__questUI.showQuest(QUEST_EVENTS.FIRST_WAREHOUSE_DELIVERY);
      }
    }
  }
  
  // Check for win condition - 2 full warehouses
  checkWinCondition();
}

// Check win condition: 2 warehouses full
function checkWinCondition() {
  const grid = GameModel.gridData || [];
  let fullWarehouses = 0;
  
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    if (!row) continue;
    for (let x = 0; x < row.length; x++) {
      const cell = row[x];
      if (cell && cell.root === cell && cell.buildingType === "warehouse") {
        const storage = cell.data?.storage || {};
        const capacity = cell.data?.capacity || 100; // Default capacity
        
        // Check if warehouse is completely full
        const totalStored = (storage.wood || 0) + (storage.stone || 0) + (storage.wheat || 0) + (storage.fish || 0);
        
        if (totalStored >= capacity) {
          fullWarehouses++;
        }
      }
    }
  }
  
  // Win condition: at least 2 full warehouses
  if (fullWarehouses >= 2) {
    // Import EventBus dynamically to avoid circular dependency
    import("../game/events/eventBus").then(({ default: EventBus }) => {
      EventBus.emit("game-win");
    });
  }
}
