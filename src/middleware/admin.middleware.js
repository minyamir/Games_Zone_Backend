import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.model.js';

export const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.'
      });
    }

    const token = authHeader.split(' ')[1];

    // ቶከኑን መፈተሽ
    const decoded = jwt.verify(token, config.jwtSecret || 'bingo_super_secret_key');

    // ዩዘሩ ዳታቤዝ ውስጥ መኖሩን እና አድሚን መሆኑን ማረጋገጥ
    const admin = await User.findById(decoded.id);

    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Not authorized as an active admin.'
      });
    }

    // አድሚኑን ወደ ሪኩዌስት obj ማያያዝ
    req.admin = admin;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};