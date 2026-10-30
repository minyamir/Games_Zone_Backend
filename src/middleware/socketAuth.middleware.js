import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.model.js';
import { BINGO_CONSTANTS } from '../game/game.constants.js';

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const authHeader = socket.handshake.auth?.token || 
                       socket.handshake.auth?.initData || 
                       socket.handshake.headers['authorization'] || 
                       socket.handshake.headers['tma'];

    if (!authHeader) {
      return next(new Error('Authentication error: No token or initData provided'));
    }

    let userData = null;

    // 1. If it's a standard JWT Bearer token (e.g., "Bearer eyJ...")
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret || 'bingo_super_secret_key');
      
      const user = await User.findById(decoded.id || decoded._id);
      if (!user) {
        return next(new Error('Authentication error: User not found from JWT'));
      }

      socket.user = user;
      socket.userId = user._id;
      return next();
    }

    // 2. If it's Telegram initData or JSON payload
    let cleanHeader = authHeader;
    if (typeof cleanHeader === 'string') {
      cleanHeader = cleanHeader.replace('tma ', '');
    }

    if (cleanHeader.includes('user=')) {
      const urlParams = new URLSearchParams(cleanHeader);
      const userParam = urlParams.get('user');
      if (userParam) {
        userData = JSON.parse(decodeURIComponent(userParam));
      }
    } else if (cleanHeader.startsWith('user=')) {
      const jsonString = cleanHeader.replace('user=', '');
      userData = JSON.parse(jsonString);
    } else {
      userData = JSON.parse(cleanHeader);
    }

    if (!userData || !userData.id) {
      return next(new Error('Authentication error: Invalid user data in token'));
    }

    const telegramId = userData.id.toString();

    let user = await User.findOne({ telegramId });
    if (!user) {
      user = await User.create({
        telegramId,
        firstName: userData.first_name || 'Player',
        username: userData.username || '',
        phone: userData.phone_number || '',
        wallet: { balance: 100 }
      });
    }

    socket.user = user;
    socket.userId = user._id;

    next();
  } catch (err) {
    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.error('[DEBUG ERROR]: Socket Auth Middleware Error:', err.message);
    }
    next(new Error('Authentication error: Failed to parse authentication token'));
  }
};