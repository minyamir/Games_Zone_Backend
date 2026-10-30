import express from 'express';
import { ticketController } from '../controllers/ticket.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { BINGO_CONSTANTS } from '../game/game.constants.js';

const router = express.Router();

if (BINGO_CONSTANTS.DEBUG_MODE) {
  console.log(`[DEBUG]: Initializing ticket routes`);
}

// POST /api/tickets/buy - Purchase one or more tickets for a game (Protected with authMiddleware)
router.post('/buy', authMiddleware, ticketController.purchaseTickets);

// GET /api/tickets/:gameId - Fetch user tickets for a specific game session (Protected with authMiddleware)
router.get('/:gameId', authMiddleware, ticketController.getUserTickets);

export default router;