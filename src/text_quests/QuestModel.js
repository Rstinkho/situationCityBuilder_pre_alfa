export default class QuestModel {
  constructor() {
    this.triggeredEvents = new Set();
    this.activeQuests = new Map();
    this.questTimers = new Map();
    this.attackTimers = new Map();
  }

  // Check if an event has been triggered before
  isEventTriggered(eventId) {
    return this.triggeredEvents.has(eventId);
  }

  // Mark an event as triggered
  markEventTriggered(eventId) {
    this.triggeredEvents.add(eventId);
  }

  // Start a quest timer
  startQuestTimer(questId, callback, intervalMs) {
    if (this.questTimers.has(questId)) {
      clearInterval(this.questTimers.get(questId));
    }
    
    const timerId = setInterval(callback, intervalMs);
    this.questTimers.set(questId, timerId);
  }

  // Stop a quest timer
  stopQuestTimer(questId) {
    if (this.questTimers.has(questId)) {
      clearInterval(this.questTimers.get(questId));
      this.questTimers.delete(questId);
    }
  }

  // Start attack timer with decreasing intervals
  startAttackTimer(questId, launchAttackFn) {
    if (this.attackTimers.has(questId)) {
      clearTimeout(this.attackTimers.get(questId));
    }

    // Wait 30 seconds before starting the attack cycle
    setTimeout(() => {
      let currentInterval = 10000; // Start with 10 seconds
      let timePassed = 0;
      
      const scheduleNextAttack = () => {
        if (timePassed >= 30000) { // After 30 seconds, start decreasing interval
          currentInterval = Math.max(1000, 10000 - Math.floor((timePassed - 30000) / 30000) * 1000);
        }
        
        launchAttackFn();
        
        const nextAttack = setTimeout(() => {
          timePassed += currentInterval;
          scheduleNextAttack();
        }, currentInterval);
        
        this.attackTimers.set(questId, nextAttack);
      };

      // Start the attack cycle
      scheduleNextAttack();
    }, 30000); // Wait 30 seconds before starting attacks
  }

  // Stop attack timer
  stopAttackTimer(questId) {
    if (this.attackTimers.has(questId)) {
      clearTimeout(this.attackTimers.get(questId));
      this.attackTimers.delete(questId);
    }
  }

  // Clean up all timers
  cleanup() {
    this.questTimers.forEach(timerId => clearInterval(timerId));
    this.questTimers.clear();
    
    this.attackTimers.forEach(timerId => clearTimeout(timerId));
    this.attackTimers.clear();
  }
}
