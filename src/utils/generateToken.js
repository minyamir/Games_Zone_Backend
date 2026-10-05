import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      telegramId: user.telegramId,
      role: user.role,
    },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
};