import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { registerAdminSocketHandlers } from './admin.socket.js';
import { registerDepositSocketHandlers } from './deposit.socket.js';
import { registerWithdrawalSocketHandlers } from './withdrawal.socket.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { 
      origin: config.clientUrl || '*',
      credentials: true
    }
  });

  // ⚡ JWT Authentication Middleware for Socket Connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    
    try {
      if (token) {
        const decoded = jwt.verify(token, config.jwtSecret || 'bingo_super_secret_key');
        socket.user = decoded; // የአድሚኑን/ተጠቃሚውን መረጃ እንይዘዋለን
      }
      next();
    } catch (err) {
      // ቶከኑ ልክ ካልሆነ ግንኙነቱን ላለማቋረጥ ማለፍ ይቻላል ወይም next(new Error('Authentication error')) ማለት ይቻላል
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Client connected: ${socket.id}`);

    // ⚡ አድሚኑ ወደ admin-dashboard ሩም ለመቀላቀል ሲጠይቅ
    socket.on('join-admin-room', (data) => {
      socket.join('admin-dashboard');
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

    socket.on('disconnect', () => {
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