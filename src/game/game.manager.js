import { BingoEngine } from './bingo.engine.js';
import { BINGO_CONSTANTS } from './game.constants.js';
import { BingoGame } from '../models/BingoGame.model.js';

class GameInstanceManager {
  constructor() {
    // Registry of active game engines in RAM (gameId -> BingoEngine instance)
    this.activeGames = new Map();

    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: GameInstanceManager initialized`);
    }
  }

  // Create and start a new game session (Hybrid RAM + DB check)
  async createGameSession(gameId, ioServer) {
    if (this.activeGames.has(gameId)) {
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: Game session already active in RAM for ID: ${gameId}`);
      }
      return this.activeGames.get(gameId);
    }

    // ከዳታቤዝ ጨዋታው መኖሩን እና ንቁ መሆኑን ማረጋገጥ
    const game = await BingoGame.findById(gameId);
    if (!game) {
      throw new Error(`Game ID ${gameId} not found in database.`);
    }

    const engine = new BingoEngine(gameId, ioServer);
    this.activeGames.set(gameId, engine);
    
    // Start the game engine loop
    await engine.startEngine();

    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: Game session successfully created and started for ID: ${gameId}`);
    }
    
    console.log(`🚀 [GameManager] Game session created and started for ID: ${gameId}`);
    return engine;
  }

  // Retrieve an existing active game session from RAM or DB
  getGameSession(gameId) {
    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: Fetching game session for ID: ${gameId}`);
    }
    return this.activeGames.get(gameId);
  }

  // Stop a game, update database, and remove it from memory
  async terminateGameSession(gameId, reason = 'GAME_ENDED') {
    const engine = this.activeGames.get(gameId);
    if (engine) {
      await engine.stopEngine(reason);
      this.activeGames.delete(gameId);

      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: Game session removed from memory for ID: ${gameId}`);
      }

      console.log(`🗑️ [GameManager] Game session terminated for ID: ${gameId}`);
    }
  }
}

// Export as a Singleton instance across the application
export const gameManager = new GameInstanceManager();