import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { User } from '../models/User.model.js';
import { BINGO_CONSTANTS } from '../game/game.constants.js';

/**
 * 1. Standard JWT Protection Middleware
 */
export const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, jwtConfig.secret);
      
      const user = await User.findById(decoded.id || decoded._id);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      req.user = user;
      req.userId = user._id;
      return next();
    } catch (error) {
      if (BINGO_CONSTANTS.DEBUG_MODE) {
        console.error(`[DEBUG ERROR]: JWT verification failed:`, error.message);
      }
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
};

/**
 * 2. Telegram Mini App initData / JSON Auth Middleware (Supports Headers, Body & JWT Bearer)
 */
export const authMiddleware = async (req, res, next) => {
  // ⚡ ከ Header (authorization ወይም tma) ወይም ከ Body (req.body.initData) ዴታውን መፈለግ
  const authInput = req.headers['authorization'] || 
                    req.headers['tma'] || 
                    req.body?.initData;
  
  if (!authInput) {
    return res.status(401).json({ success: false, message: 'No token or initData provided' });
  }

  try {
    let rawString = typeof authInput === 'string' ? authInput : JSON.stringify(authInput);

    // ⚡ 1. ቶከኑ የ JWT Bearer ቶከን ከሆነ አስቀድሞ በመያዝ በ jwt.verify ማረጋገጥ
    if (rawString.startsWith('Bearer ')) {
      const token = rawString.split(' ')[1];
      const decoded = jwt.verify(token, jwtConfig.secret);
      
      const user = await User.findById(decoded.id || decoded._id);
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found from JWT' });
      }

      req.user = user;
      req.userId = user._id;
      return next();
    }

    let userData = null;

    // 2. URL-encoded initData (query_id=...&user=%7B%22id%22%3A...%7D)
    if (rawString.includes('user=')) {
      const cleanHeader = rawString.replace('tma ', '');
      const urlParams = new URLSearchParams(cleanHeader);
      const userParam = urlParams.get('user');
      if (userParam) {
        userData = JSON.parse(decodeURIComponent(userParam));
      }
    } 
    // 3. Direct JSON string with prefix (user={"id":8378444591,...})
    else if (rawString.startsWith('user=')) {
      const jsonString = rawString.replace('user=', '');
      userData = JSON.parse(jsonString);
    } 
    // 4. Plain JSON string or Object
    else {
      userData = typeof authInput === 'object' ? authInput : JSON.parse(authInput);
    }

    if (!userData || !userData.id) {
      return res.status(403).json({ success: false, message: 'Invalid user data in token' });
    }

    const telegramId = userData.id.toString();

    // ⚡ ዳታቤዝ ውስጥ ዩዘሩን ማረጋገጥ ወይም በራስ-ሰር መመዝገብ (Auto-registration)
    let user = await User.findOne({ telegramId });
    if (!user) {
      user = await User.create({
        telegramId,
        firstName: userData.first_name || 'Player',
        username: userData.username || '',
        phone: userData.phone_number || '',
        wallet: { balance: 100 } // ለሙከራ የሚሆን መነሻ ቀሪ ሂሳብ
      });
    }

    req.user = user;
    req.userId = user._id;

    next();
  } catch (err) {
    if (BINGO_CONSTANTS.DEBUG_MODE) {
      console.error('[DEBUG ERROR]: Auth Middleware Parsing Error:', err.message);
    }
    return res.status(403).json({ success: false, message: 'Failed to parse authentication token' });
  }
};