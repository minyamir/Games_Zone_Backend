import { gameManager } from '../game/game.manager.js';
import { BINGO_CONSTANTS } from '../game/game.constants.js';
import { BingoGame } from '../models/BingoGame.model.js';
import { BingoTicket } from '../models/BingoTicket.model.js';

export const registerGameSockets = (io, socket) => {
  if (BINGO_CONSTANTS.DEBUG_MODE) {
    console.log(`[DEBUG]: Registering game sockets for connection ID: ${socket.id}`);
  }

  // Handle player/guest joining a specific live game room
  socket.on('join_game_room', async ({ gameId, userId }) => {
    try {
      if (!gameId) {
        socket.emit('error', { message: 'Game ID is required to join a room.' });
        return;
      }

      const roomName = `game_${gameId}`;
      socket.join(roomName);

      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: Socket ${socket.id} joined room: ${roomName}`);
      }

      // Check if game exists in DB
      const game = await BingoGame.findById(gameId);
      if (!game) {
        socket.emit('error', { message: 'Game session not found.' });
        return;
      }

      // Check if active engine exists, otherwise fetch/initialize session
      let session = gameManager.getGameSession(gameId);
      if (!session && game.status === 'in_progress') {
        session = await gameManager.createGameSession(gameId, io);
      }

      // Check if user has tickets for this game (Determines Player vs Spectator)
      let userTickets = [];
      let isPlayer = false;

      if (userId) {
        userTickets = await BingoTicket.find({ game: gameId, user: userId });
        isPlayer = userTickets.length > 0;
      }

      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: User ${userId || socket.id} joined room as ${isPlayer ? 'PLAYER 🎮' : 'SPECTATOR (GUEST) 👁️'}`);
      }

      // Notify the user with current game state and their role
      socket.emit('joined_game_success', {
        gameId,
        status: game.status,
        prizePool: game.prizePool,
        drawnNumbers: session ? session.drawnNumbers : game.calledNumbers,
        isRunning: session ? session.isRunning : false,
        isPlayer, // true = ተጫዋች፣ false = እንደ እንግዳ (Spectator) ይከታተላል
        tickets: userTickets
      });

      // Broadcast to other players in the room
      socket.to(roomName).emit('player_joined', {
        socketId: socket.id,
        isPlayer,
        message: isPlayer ? 'A player joined the game.' : 'A spectator joined the game.'
      });

      console.log(`🎮 [GameSocket] User ${userId || socket.id} joined game room ${gameId} as ${isPlayer ? 'Player' : 'Spectator'}`);
    } catch (error) {
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.error(`[DEBUG ERROR]: Error in join_game_room:`, error);
      }
      socket.emit('error', { message: 'Failed to join game room.' });
    }
  });

  // Handle playerssssssssss leaving the game room
  socket.on('leave_game_room', ({ gameId }) => {
    const roomName = `game_${gameId}`;
    socket.leave(roomName);

    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: Socket ${socket.id} left room: ${roomName}`);
    }

    console.log(`🚪 [GameSocket] User ${socket.id} left game room: ${gameId}`);
  });

  // Handle socket disconnection cleanup
  socket.on('disconnect', () => {
    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: Game socket disconnected: ${socket.id}`);
    }
  });
};