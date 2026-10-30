import { BingoGame } from '../models/BingoGame.model.js';
import { BINGO_CONSTANTS } from '../game/game.constants.js';
import { gameManager } from '../game/game.manager.js';

class GameService {
  // Create and persist a new game session in MongoDB
  async createGameSession({ entryFee = 10, maxPlayers = 50 }) {
    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: GameService.createGameSession initiating with fee: ${entryFee}, maxPlayers: ${maxPlayers}`);
    }

    // Generate a unique roomNumber since it is required and unique in the schema
    const roomNumber = Math.floor(1000 + Math.random() * 9000);

    const newGame = await BingoGame.create({
      roomNumber,
      ticketPrice: entryFee, // Maps incoming entryFee to schema's required ticketPrice (Default 10 Birr)
      maxPlayers,
      status: 'scheduled',   // Must match schema enums
      calledNumbers: [],     
      prizePool: 0
    });

    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: Successfully created BingoGame document with ID: ${newGame._id}`);
    }

    return newGame;
  }

  // Fetch details for a specific game
  async getGameDetails(gameId) {
    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: GameService.getGameDetails fetching ID: ${gameId}`);
    }

    const game = await BingoGame.findById(gameId).populate('winner');
    return game;
  }

  // Retrieve all currently active or scheduled games
  async fetchActiveGames() {
    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: GameService.fetchActiveGames querying active database sessions`);
    }

    // Query using valid schema statuses
    const games = await BingoGame.find({ 
      status: { $in: ['scheduled', 'open_for_bets', 'in_progress'] } 
    }).sort({ createdAt: -1 });
    
    return games;
  }
}

export const gameService = new GameService();