import { gameService } from '../services/game.service.js';
import { BINGO_CONSTANTS } from '../game/game.constants.js';

class GameController {
  // Helper function made static to avoid `this` context binding issues
  static formatGameResponse(game) {
    if (!game) return null;
    const gameObj = game.toObject ? game.toObject() : game;
    const { _id, ...rest } = gameObj;
    return {
      gameSession_id: _id,
      ...rest
    };
  }

  // Create a new Bingo game session
  createGame = async (req, res, next) => {
    try {
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: GameController.createGame called with body:`, req.body);
      }

      const { entryFee, maxPlayers } = req.body;
      const game = await gameService.createGameSession({ entryFee, maxPlayers });
      const formattedGame = GameController.formatGameResponse(game);

      return res.status(201).json({
        success: true,
        message: 'Bingo game session created successfully.',
        data: formattedGame
      });
    } catch (error) {
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.error(`[DEBUG ERROR]: createGame controller failed:`, error);
      }
      return next(error);
    }
  };

  // Get details of a specific game by ID
  getGameById = async (req, res, next) => {
    try {
      const { gameId } = req.params;

      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: GameController.getGameById called for ID: ${gameId}`);
      }

      const game = await gameService.getGameDetails(gameId);
      if (!game) {
        return res.status(404).json({ success: false, message: 'Game session not found.' });
      }

      const formattedGame = GameController.formatGameResponse(game);

      return res.status(200).json({
        success: true,
        data: formattedGame
      });
    } catch (error) {
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.error(`[DEBUG ERROR]: getGameById controller failed:`, error);
      }
      return next(error);
    }
  };

  // Get list of active/ongoing games
  getActiveGames = async (req, res, next) => {
    try {
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: GameController.getActiveGames called`);
      }

      const activeGames = await gameService.fetchActiveGames();
      const formattedGames = activeGames.map(game => GameController.formatGameResponse(game));

      return res.status(200).json({
        success: true,
        count: formattedGames.length,
        data: formattedGames
      });
    } catch (error) {
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.error(`[DEBUG ERROR]: getActiveGames controller failed:`, error);
      }
      return next(error);
    }
  };
}

export const gameController = new GameController();