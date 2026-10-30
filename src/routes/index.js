import express from 'express';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import gameRoutes from './game.routes.js';
import ticketRoutes from './ticket.routes.js';
import { BINGO_CONSTANTS } from '../game/game.constants.js';

const router = express.Router();

if (BINGO_CONSTANTS.DEBUG_MODE) {
  console.log(`[DEBUG]: Initializing main router index`);
}

// 1. User Authentication routes (e.g., /api/auth/login)
router.use('/auth', authRoutes);

// 2. Admin routes (e.g., /api/admin/auth/register and /api/admin/dashboard)
router.use('/admin', adminRoutes);

// 3. Bingo Game routes (e.g., /api/games, /api/games/active)
router.use('/games', gameRoutes);

// 4. Ticket management routes (e.g., /api/tickets/buy, /api/tickets/:gameId)
router.use('/tickets', ticketRoutes);

export default router;