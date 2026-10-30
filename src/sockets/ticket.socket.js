import { ticketService } from '../services/ticket.service.js';
import { BINGO_CONSTANTS } from '../game/game.constants.js';

export const registerTicketSockets = (io, socket) => {
  if (BINGO_CONSTANTS.DEBUG_MODE) {
    console.log(`[DEBUG]: Registering ticket sockets for connection ID: ${socket.id}`);
  }

  // Handle specific ticket selection and purchase (1-700 grid selection) from Mini App
  socket.on('buy_ticket', async (rawPayload) => {
    try {
      console.log('[DEBUG]: Raw payload received for buy_ticket:', rawPayload);

      // ⚡ Automatically parse if the payload was sent as a JSON string
      let payload = rawPayload;
      if (typeof rawPayload === 'string') {
        try {
          payload = JSON.parse(rawPayload);
        } catch (parseError) {
          console.error('[DEBUG ERROR]: Failed to parse stringified payload:', parseError);
        }
      }

      // Support both gameId and gameSession_id seamlessly
      const gameId = payload?.gameId || payload?.gameSession_id;
      const { userId, ticketNumber } = payload || {};

      if (!gameId || !userId || ticketNumber === undefined) {
        socket.emit('ticket_error', { message: 'Game ID, User ID, and Ticket Number are required.' });
        return;
      }

      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: User ${userId} attempting to buy specific ticket number ${ticketNumber} for game ${gameId}`);
      }

      // Call ticket service to validate if the specific ticket is available, deduct wallet, and save to DB
      const result = await ticketService.buySpecificTicket({ userId, gameId, ticketNumber });

      // Sync the successfully purchased ticket back to the buyer instantly
      socket.emit('user_tickets_synced', {
        gameId,
        tickets: result.tickets,
        newPrizePool: result.newPrizePool
      });

      // Broadcast real-time update to ALL players in the game room so the grid updates (marks as sold)
      io.to(`game_${gameId}`).emit('ticket_status_updated', {
        gameId,
        ticketNumber,
        status: 'sold',
        userId,
        newPrizePool: result.newPrizePool
      });

      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: Successfully processed ticket number ${ticketNumber} for user ${userId}`);
      }

      console.log(`🎫 [TicketSocket] User ${userId} successfully purchased Ticket #${ticketNumber} for Game ${gameId}`);
    } catch (error) {
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.error(`[DEBUG ERROR]: Error in buy_ticket (Specific Ticket):`, error);
      }
      socket.emit('ticket_error', { message: error.message || 'Failed to purchase the selected ticket.' });
    }
  });

  // Handle ticket sync requests when entering active games
  socket.on('fetch_user_tickets', async (rawPayload) => {
    try {
      let payload = rawPayload;
      if (typeof rawPayload === 'string') {
        try { payload = JSON.parse(rawPayload); } catch (e) {}
      }

      const gameId = payload?.gameId || payload?.gameSession_id;
      const { userId } = payload || {};

      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: Fetching existing tickets for user ${userId} in game ${gameId}`);
      }
      
      const userTickets = await ticketService.fetchUserTickets(userId, gameId);

      socket.emit('user_tickets_synced', {
        gameId,
        tickets: userTickets
      });
    } catch (error) {
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.error(`[DEBUG ERROR]: Error in fetch_user_tickets:`, error);
      }
      socket.emit('ticket_error', { message: 'Failed to fetch user tickets.' });
    }
  });
};