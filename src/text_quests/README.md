# Text Quest Events System

A supplementary system that adds narrative-driven events to the game with gameplay consequences.

## Overview

The Text Quest Events system creates mini-stories that influence gameplay through player choices. It operates independently from the main city building and tower defense systems.

## Architecture

### Core Components

1. **QuestModel** - Manages quest state, timers, and event tracking
2. **QuestSystem** - Main controller that initializes and manages the quest system
3. **QuestUI** - React component for displaying quest dialogs
4. **questEvents.js** - Configuration file defining quest events and their logic

### Key Features

- **Event Triggers**: Automatic detection of game conditions
- **Choice System**: Multiple choice responses with different consequences
- **Timer Management**: Automated events based on time intervals
- **State Persistence**: Tracks triggered events to prevent duplicates

## Current Events

### First Warehouse Delivery Quest

**Trigger**: When any resource is first delivered to a warehouse (resources > 0)

**Choices**:
1. **Agree to pay 5 gold**
   - Deducts 5 gold from player
   - Starts tribute cycle every 90 seconds
   - Player can continue paying or reject later

2. **Don't agree to pay**
   - Immediately starts attack cycle
   - Shows 30-second countdown on tower defense screen
   - Launches attacks with decreasing intervals (10s → 9s → 8s → ... → 1s)

**Tribute Cycle** (if player agrees):
- Every 90 seconds, player must choose:
  - **Pay 5 gold**: Continue the cycle
  - **Reject**: Break cycle and start attack cycle

## Integration Points

### With Main Game
- Monitors warehouse resources through `GameModel.gridData`
- Deducts gold from `GameModel.gold`
- Triggers only once per event

### With Tower Defense
- Calls `window.__defenseScene.showAttackTimer()` to display countdown
- Calls `window.__defenseScene.launchAttack()` to spawn enemies
- Integrates with existing attack system

### With UI
- Uses `window.__questUI.showQuest()` to display dialogs
- Provides global access through `window.__questSystem`

## Usage

### Automatic Triggering
The system automatically checks for triggers every 2 seconds and displays quests when conditions are met.

### Manual Testing
Use the "Test Quest" button in the Admin panel to manually trigger the first warehouse delivery quest.

### Adding New Events
1. Define the event in `questEvents.js`
2. Add trigger logic in `checkQuestTriggers()`
3. Define choices and their consequences
4. Integrate with existing game systems as needed

## Technical Details

### Timer System
- **Quest Timers**: Standard intervals (e.g., 90 seconds for tribute)
- **Attack Timers**: Decreasing intervals starting at 10 seconds
- **Automatic Cleanup**: All timers are properly managed and cleaned up

### State Management
- **Triggered Events**: Set-based tracking prevents duplicate triggers
- **Active Quests**: Map-based management of ongoing quest states
- **Global Access**: Accessible through `window.__questModel` and `window.__questSystem`

### Error Handling
- Graceful fallbacks for missing UI components
- Console logging for debugging
- Safe timer cleanup on system shutdown

## Future Enhancements

- Save/load quest progress
- More complex branching narratives
- Resource-based quest requirements
- Achievement system integration
- Multiple simultaneous quests
