import express from 'express';
import { gameController } from '../controllers/game.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { BINGO_CONSTANTS } from '../game/game.constants.js';

const router = express.Router();

if (BINGO_CONSTANTS.DEBUG_MODE) {
  console.log(`[DEBUG]: Initializing game routes`);
}

// ⚡ POST /api/games - Create a new game session (Protected with authMiddleware to track who created it)
router.post('/', authMiddleware, gameController.createGame);

// GET /api/games/active - Fetch all active/ongoing or upcoming games
router.get('/active', gameController.getActiveGames);

// GET /api/games/:gameId - Fetch details of a specific game session
router.get('/:gameId', gameController.getGameById);

export default router;