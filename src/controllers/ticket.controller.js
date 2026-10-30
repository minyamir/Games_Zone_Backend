import { ticketService } from '../services/ticket.service.js';
import { BINGO_CONSTANTS } from '../game/game.constants.js';

class TicketController {
  // Purchase one or more tickets for a specific game session
  async purchaseTickets(req, res, next) {
    try {
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: TicketController.purchaseTickets called with body:`, req.body);
      }

      const { gameId, ticketCount } = req.body;
      const userId = req.user?.id || req.body.userId; // Extracted from auth middleware or request body

      if (!gameId || !ticketCount) {
        return res.status(400).json({
          success: false,
          message: 'Game ID and ticket count are required.'
        });
      }

      const result = await ticketService.buyTickets({ userId, gameId, ticketCount });

      return res.status(201).json({
        success: true,
        message: `${ticketCount} ticket(s) purchased successfully.`,
        data: result
      });
    } catch (error) {
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.error(`[DEBUG ERROR]: purchaseTickets controller failed:`, error);
      }
      return next(error);
    }
  }

  // Get all tickets owned by a user for a specific game
  async getUserTickets(req, res, next) {
    try {
      const { gameId } = req.params;
      const userId = req.user?.id || req.query.userId;

      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: TicketController.getUserTickets called for user ${userId} in game ${gameId}`);
      }

      const tickets = await ticketService.fetchUserTickets(userId, gameId);

      return res.status(200).json({
        success: true,
        count: tickets.length,
        data: tickets
      });
    } catch (error) {
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.error(`[DEBUG ERROR]: getUserTickets controller failed:`, error);
      }
      return next(error);
    }
  }
}

export const ticketController = new TicketController();