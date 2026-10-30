import { gameManager } from './game.manager.js';
import { BINGO_CONSTANTS } from './game.constants.js';

class GameScheduler {
  constructor() {
    this.scheduledIntervals = new Map();

    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: GameScheduler instance created`);
    }
  }

  // Initialize automatic game room scheduler (e.g., spawn new game every X minutes)
  initAutoScheduler(ioServer, intervalMinutes = 2) {
    const delayMs = intervalMinutes * 60 * 1000;

    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: Setting up auto-scheduler with interval delay of ${delayMs}ms`);
    }

    console.log(`⏰ [GameScheduler] Auto-scheduler initialized. New game every ${intervalMinutes} minutes.`);

    // Future implementation will hook here to fetch upcoming room schedules from BingoGame model
  }

  // Stop all scheduled timers
  stopScheduler() {
    for (const [id, interval] of this.scheduledIntervals.entries()) {
      clearInterval(interval);
    }
    this.scheduledIntervals.clear();

    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: Cleared all scheduled interval mappings`);
    }

    console.log(`🛑 [GameScheduler] All schedules stopped.`);
  }
}

export const gameScheduler = new GameScheduler();