import QuestModel from "./QuestModel";
import { checkQuestTriggers } from "./questEvents";

export default class QuestSystem {
  constructor() {
    this.model = new QuestModel();
    this.isActive = false;
    this.checkInterval = null;
    
    // Make the model globally accessible
    window.__questModel = this.model;
  }

  // Start the quest system
  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    
    // Check for quest triggers every 2 seconds
    this.checkInterval = setInterval(() => {
      this.checkForTriggers();
    }, 2000);
    
    console.log("Quest System started");
  }

  // Stop the quest system
  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    // Clean up timers
    this.model.cleanup();
    
    console.log("Quest System stopped");
  }

  // Check for quest triggers
  checkForTriggers() {
    try {
      checkQuestTriggers(this.model);
    } catch (error) {
      console.error("Error checking quest triggers:", error);
    }
  }

  // Manually trigger a quest (for testing)
  triggerQuest(questId) {
    if (questId === "first_warehouse_delivery") {
      // Force trigger the first warehouse delivery quest
      this.model.markEventTriggered("first_warehouse_delivery");
      
      // Import and show the quest
      import("./questEvents").then(({ QUEST_EVENTS }) => {
        if (window.__questUI) {
          window.__questUI.showQuest(QUEST_EVENTS.FIRST_WAREHOUSE_DELIVERY);
        }
      });
    }
  }

  // Get quest system status
  getStatus() {
    return {
      isActive: this.isActive,
      triggeredEvents: Array.from(this.model.triggeredEvents),
      activeQuests: Array.from(this.model.activeQuests.keys()),
      activeTimers: Array.from(this.model.questTimers.keys()),
      activeAttackTimers: Array.from(this.model.attackTimers.keys())
    };
  }

  // Reset the quest system (for testing)
  reset() {
    this.stop();
    this.model = new QuestModel();
    window.__questModel = this.model;
    console.log("Quest System reset");
  }
}
