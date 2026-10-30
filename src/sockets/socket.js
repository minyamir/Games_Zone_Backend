import { Server } from 'socket.io';
import { config } from '../config/env.js';
import { BINGO_CONSTANTS } from '../game/game.constants.js';
import { socketAuthMiddleware } from '../middleware/socketAuth.middleware.js'; // ⚡ አዲሱን ሚድልዌር ማስገባት
import { registerAdminSocketHandlers } from './admin.socket.js';
import { registerDepositSocketHandlers } from './deposit.socket.js';
import { registerWithdrawalSocketHandlers } from './withdrawal.socket.js';
import { registerGameSockets } from './game.socket.js';
import { registerTicketSockets } from './ticket.socket.js';

let io;

export const initSocket = (server) => {
  if (BINGO_CONSTANTS.DEBUG_MODE) {
    console.log(`[DEBUG]: Initializing Socket.io server instance`);
  }

  io = new Server(server, {
    cors: { 
      origin: config.clientUrl || '*',
      credentials: true
    }
  });

  // ⚡ ቴሌግራም initData እና ዩዘር ቼክ የሚያደርገውን ሚድልዌር እዚህ መጠቀም
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.log(`[DEBUG]: New client connected with socket ID: ${socket.id}, User ID: ${socket.userId || 'Guest'}`);
    }
    console.log(`⚡ Client connected: ${socket.id} (${socket.userId ? 'Authenticated Player' : 'Guest'})`);

    // Handle admin dashboard room joining request
    socket.on('join-admin-room', (data) => {
      socket.join('admin-dashboard');
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: Socket ${socket.id} joined room 'admin-dashboard'`);
      }
      console.log(`✅ Client ${socket.id} successfully joined admin-dashboard room`);
    });

    // 1. Register Admin Socket Handlers
    if (typeof registerAdminSocketHandlers === 'function') {
      registerAdminSocketHandlers(io, socket);
    }

    // 2. Register Deposit Socket Handlers
    if (typeof registerDepositSocketHandlers === 'function') {
      registerDepositSocketHandlers(io, socket);
      console.log(`✅ Deposit socket handlers registered for client ${socket.id}`);
    }

    // 3. Register Withdrawal Socket Handlers
    if (typeof registerWithdrawalSocketHandlers === 'function') {
      registerWithdrawalSocketHandlers(io, socket);
    }

    // 4. Register Bingo Game Socket Handlers
    if (typeof registerGameSockets === 'function') {
      registerGameSockets(io, socket);
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: Game socket handlers registered for client ${socket.id}`);
      }
    }

    // 5. Register Bingo Ticket Socket Handlers
    if (typeof registerTicketSockets === 'function') {
      registerTicketSockets(io, socket);
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: Ticket socket handlers registered for client ${socket.id}`);
      }
    }

    socket.on('disconnect', () => {
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.log(`[DEBUG]: Client disconnected: ${socket.id}`);
      }
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io instance not initialized!');
  }
  return io;
};